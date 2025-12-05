import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { generateTryOnImage } from "@/lib/gemini"
import { submitAsyncTask, pollTaskResult } from "@/lib/grsai"
import { logger } from "@/lib/logger"
import { TaskStatus, TryOnType, User } from "@prisma/client"

// Service Tiering Config
const ENABLE_SERVICE_TIERING = process.env.ENABLE_SERVICE_TIERING === 'true' || true // Default to true for now as per plan
const GEMINI_PREMIUM_ONLY = process.env.GEMINI_PREMIUM_ONLY === 'true' || true

export interface TryOnSubmissionResult {
  taskId: string
  status: string // 'submitted' | 'completed' | 'failed'
  serviceType: string
  isAsync: boolean
  resultImageUrl?: string
  error?: string
}

export interface TryOnPollResult {
  status: TaskStatus
  resultImageUrl?: string
  progress?: number
  error?: string
  isNewCompletion?: boolean
}

export async function submitTryOnTask(
  user: User,
  userImageFile: File,
  itemImageFile: File,
  type: TryOnType,
  prompt?: string
): Promise<TryOnSubmissionResult> {
  
  const startTime = Date.now()
  logger.info('tryon-service', `Starting try-on task for user ${user.id}`, { type })

  // 1. Upload images to Vercel Blob for persistence
  // Note: We upload regardless of service to ensure we have a record of input
  let userBlob, itemBlob
  try {
    [userBlob, itemBlob] = await Promise.all([
      put(`tryon/user/${user.id}/${Date.now()}-${userImageFile.name}`, userImageFile, { access: 'public' }),
      put(`tryon/item/${user.id}/${Date.now()}-${itemImageFile.name}`, itemImageFile, { access: 'public' })
    ])
  } catch (error) {
    logger.error('tryon-service', 'Failed to upload images to blob storage', error as Error)
    throw new Error("Failed to upload images")
  }

  // 2. Determine Service Type
  // Logic:
  // - If user is Premium: Use Gemini (Fast/Real-time)
  // - If user is Free: Use GrsAi (Async/Slower)
  
  let serviceType = 'grsai'
  let isAsync = true

  // Check premium status logic (same as in existing route)
  const isPremiumActive = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
  
  if (isPremiumActive) {
    serviceType = 'gemini'
    isAsync = false // Gemini is currently synchronous
  }

  logger.info('tryon-service', `Service selection: ${serviceType} (Async: ${isAsync})`, { userId: user.id, isPremium: isPremiumActive })

  // 3. Create Task in DB
  const task = await prisma.tryOnTask.create({
    data: {
      userId: user.id,
      type: type,
      userImageUrl: userBlob.url,
      itemImageUrl: itemBlob.url,
      status: TaskStatus.PENDING,
      metadata: {
        serviceType,
        isAsync,
        originalUserFileName: userImageFile.name,
        originalItemFileName: itemImageFile.name
      }
    }
  })

  // 4. Dispatch to Service
  if (serviceType === 'gemini') {
    // --- Gemini (Synchronous) ---
    try {
      // Trigger Gemini generation
      const result = await generateTryOnImage({
        userImageUrl: userBlob.url,
        itemImageUrl: itemBlob.url,
        prompt
      })

      if (result.success && result.imageUrl) {
        let finalResultUrl = result.imageUrl

        // Upload Gemini result (Data URL) to Vercel Blob for persistence/performance
        try {
          // Convert Data URL to Blob
          const response = await fetch(result.imageUrl)
          const blob = await response.blob()
          const file = new File([blob], `result-${task.id}.png`, { type: blob.type })
          
          // Upload to Vercel Blob
          const uploadedBlob = await put(`tryon/result/${task.userId}/${task.id}.png`, file, { access: 'public' })
          finalResultUrl = uploadedBlob.url
          logger.info('tryon-service', 'Gemini result uploaded to blob', { taskId: task.id, url: finalResultUrl })
        } catch (uploadError) {
          logger.error('tryon-service', 'Failed to upload Gemini result to blob', uploadError as Error)
          // Fallback to Data URL if upload fails
        }

        // Update task as COMPLETED
        await prisma.tryOnTask.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.COMPLETED,
            resultImageUrl: finalResultUrl,
            metadata: {
              ...(task.metadata as any),
              ...(result.metadata || {}), // Save Gemini text/metadata
              originalResultUrl: result.imageUrl, // Keep original URL in metadata
              generationTime: Date.now() - startTime
            }
          }
        })

        return {
          taskId: task.id,
          status: 'completed',
          serviceType,
          isAsync,
          resultImageUrl: finalResultUrl
        }
      } else {
        throw new Error(result.error || "Gemini generation failed")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error('tryon-service', 'Gemini generation failed', error as Error, { taskId: task.id })
      
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          errorMessage
        }
      })

      throw error
    }

  } else {
    // --- GrsAi (Asynchronous) ---
    try {
      // Convert to Data URIs for GrsAi
      // We read from the File objects provided
      const userBuffer = Buffer.from(await userImageFile.arrayBuffer())
      const itemBuffer = Buffer.from(await itemImageFile.arrayBuffer())
      
      const userMime = userImageFile.type || 'image/jpeg'
      const itemMime = itemImageFile.type || 'image/jpeg'
      
      const userDataUri = `data:${userMime};base64,${userBuffer.toString('base64')}`
      const itemDataUri = `data:${itemMime};base64,${itemBuffer.toString('base64')}`

      const externalTaskId = await submitAsyncTask(userDataUri, itemDataUri, prompt || "")

      // Update task with external ID
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.PROCESSING, // Mark as processing immediately
          metadata: {
            ...(task.metadata as any),
            externalTaskId,
            serviceType,
            isAsync
          }
        }
      })

      return {
        taskId: task.id,
        status: 'submitted',
        serviceType,
        isAsync
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error('tryon-service', 'GrsAi submission failed', error as Error, { taskId: task.id })
      
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          errorMessage
        }
      })

      throw error
    }
  }
}

export async function getTryOnResult(taskId: string): Promise<TryOnPollResult> {
  // 1. Fetch task from DB
  const task = await prisma.tryOnTask.findUnique({
    where: { id: taskId }
  })

  if (!task) {
    throw new Error("Task not found")
  }

  // If already completed or failed, return immediately
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
    return {
      status: task.status,
      resultImageUrl: task.resultImageUrl || undefined,
      error: task.errorMessage || undefined
    }
  }

  // If PENDING or PROCESSING, check if we need to poll external service
  const metadata = task.metadata as any
  if (metadata?.serviceType === 'grsai' && metadata?.externalTaskId) {
    // Poll GrsAi
    const pollResult = await pollTaskResult(metadata.externalTaskId)
    
    if (pollResult.status === 'succeeded' && pollResult.imageUrl) {
      // Upload result to Vercel Blob for persistence
      let resultImageUrl = pollResult.imageUrl
      try {
        // Fetch the image from external URL
        const response = await fetch(pollResult.imageUrl)
        if (response.ok) {
          const blob = await response.blob()
          const file = new File([blob], `result-${taskId}.png`, { type: blob.type })
          
          // Upload to Vercel Blob
          const uploadedBlob = await put(`tryon/result/${task.userId}/${taskId}.png`, file, { access: 'public' })
          resultImageUrl = uploadedBlob.url
          logger.info('tryon-service', 'GrsAi result uploaded to blob', { taskId, url: resultImageUrl })
        } else {
          logger.warn('tryon-service', 'Failed to fetch GrsAi result for upload', { taskId, status: response.status })
        }
      } catch (uploadError) {
        logger.error('tryon-service', 'Failed to upload GrsAi result to blob', uploadError as Error)
        // Fallback to original URL if upload fails
      }

      // Update DB to COMPLETED atomically to avoid race conditions
      const updateResult = await prisma.tryOnTask.updateMany({
        where: { 
          id: taskId,
          status: { not: TaskStatus.COMPLETED }
        },
        data: {
          status: TaskStatus.COMPLETED,
          resultImageUrl: resultImageUrl,
          metadata: {
            ...(metadata as any),
            ...(pollResult.metadata || {}), // Save GrsAi text/metadata
            originalResultUrl: pollResult.imageUrl, // Keep original URL in metadata
            completionTime: Date.now()
          }
          // progress: 100
        }
      })
      
      // Only mark as new completion if we actually updated the record
      const isNewCompletion = updateResult.count > 0

      return {
        status: TaskStatus.COMPLETED,
        resultImageUrl: resultImageUrl,
        progress: 100,
        isNewCompletion
      }
    } else if (pollResult.status === 'failed') {
      // Update DB to FAILED
      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          errorMessage: pollResult.error
        }
      })
      
      return {
        status: TaskStatus.FAILED,
        error: pollResult.error
      }
    } else {
      // Still processing
      return {
        status: TaskStatus.PROCESSING,
        progress: pollResult.progress
      }
    }
  }

  // Default fallback
  return {
    status: task.status
  }
}

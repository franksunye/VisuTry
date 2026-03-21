import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { generateTryOnImage } from "@/lib/gemini"
import { submitAsyncTask, pollTaskResult } from "@/lib/grsai"
import { logger } from "@/lib/logger"
import { Prisma, TaskStatus, TryOnType, User } from "@prisma/client"
import { TRY_ON_CONFIGS } from "@/config/try-on-types"
import { createHash } from "node:crypto"

// Service Tiering Config
const ENABLE_SERVICE_TIERING = process.env.ENABLE_SERVICE_TIERING !== 'false' // Default to true, unless explicitly set to false
const GEMINI_PREMIUM_ONLY = process.env.GEMINI_PREMIUM_ONLY !== 'false'
const MAX_GRSAI_TIMEOUT_RETRIES = 1

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

interface FileInspection {
  name: string
  type: string
  size: number
  sha256: string | null
}

type TryOnInputDiagnostics = Prisma.InputJsonObject
type TryOnUploadDiagnostics = Prisma.InputJsonObject
interface TryOnSubmissionOptions {
  clientSubmissionId?: string
}

function shouldRetryGrsAiTimeout(error?: string): boolean {
  if (!error) return false

  const normalizedError = error.toLowerCase()
  return normalizedError.includes('timeout') || normalizedError.includes('timed out')
}

function shouldTreatPollFailureAsTransient(error?: string): boolean {
  if (!error) return false

  const normalizedError = error.toLowerCase()
  return (
    normalizedError.includes('network error') ||
    normalizedError.includes('fetch failed') ||
    normalizedError.includes('socket hang up') ||
    normalizedError.includes('econnreset') ||
    normalizedError.includes('etimedout') ||
    normalizedError.includes('timed out')
  )
}

async function inspectFile(file: File): Promise<FileInspection> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Optimization: Skip expensive SHA256 calculation in production to save CPU duration
  // Only calculate if explicitly enabled or in development
  const shouldHash = process.env.NODE_ENV === 'development' || process.env.ENABLE_HEAVY_DIAGNOSTICS === 'true'
  const sha256 = shouldHash 
    ? createHash('sha256').update(buffer).digest('hex')
    : null

  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    sha256: sha256,
  }
}

export async function submitTryOnTask(
  user: User,
  userImageFile: File,
  itemImageFile: File,
  type: TryOnType,
  prompt?: string,
  options?: TryOnSubmissionOptions
): Promise<TryOnSubmissionResult> {
  const clientSubmissionId = options?.clientSubmissionId
  const startTime = Date.now()
  logger.info('tryon-service', `Starting try-on task for user ${user.id}`, { type, clientSubmissionId })

  // Use provided prompt or fallback to type-specific default prompt
  const effectivePrompt = prompt || TRY_ON_CONFIGS[type].aiPrompt

  const [userInspection, itemInspection] = await Promise.all([
    inspectFile(userImageFile),
    inspectFile(itemImageFile),
  ])

  const inputDiagnostics: TryOnInputDiagnostics = {
    userFile: {
      name: userInspection.name,
      type: userInspection.type,
      size: userInspection.size,
      sha256: userInspection.sha256,
    },
    itemFile: {
      name: itemInspection.name,
      type: itemInspection.type,
      size: itemInspection.size,
      sha256: itemInspection.sha256,
    },
    sameObjectReference: userImageFile === itemImageFile,
    sameFileName: userInspection.name === itemInspection.name,
    sameFileSize: userInspection.size === itemInspection.size,
    // Only compute "same content" when real hashes are available
    sameContentSha256:
      userInspection.sha256 && itemInspection.sha256
        ? userInspection.sha256 === itemInspection.sha256
        : undefined,
    hashEnabled: Boolean(userInspection.sha256 && itemInspection.sha256),
  }

  logger.info('tryon-service', 'Try-on input diagnostics collected', {
    userId: user.id,
    clientSubmissionId,
    type,
    ...inputDiagnostics,
  })

  if (inputDiagnostics.sameContentSha256 === true) {
    logger.warn('tryon-service', 'Try-on input files have identical content', {
      userId: user.id,
      clientSubmissionId,
      type,
      userSha256: userInspection.sha256,
      itemSha256: itemInspection.sha256,
    })
  }

  // 1. Upload images to Vercel Blob for persistence
  // Note: We upload regardless of service to ensure we have a record of input
  let userBlob, itemBlob
  try {
    [userBlob, itemBlob] = await Promise.all([
      put(`tryon/user/${user.id}/${Date.now()}-${userImageFile.name}`, userImageFile, { access: 'public' }),
      put(`tryon/item/${user.id}/${Date.now()}-${itemImageFile.name}`, itemImageFile, { access: 'public' })
    ])
  } catch (error) {
    logger.error('tryon-service', 'Failed to upload images to blob storage', error as Error, {
      userId: user.id,
      clientSubmissionId,
      type,
    })
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
  
  if (ENABLE_SERVICE_TIERING && isPremiumActive) {
    serviceType = 'gemini'
    isAsync = false // Gemini is currently synchronous
  }

  logger.info('tryon-service', `Service selection: ${serviceType} (Async: ${isAsync})`, {
    userId: user.id,
    clientSubmissionId,
    isPremium: isPremiumActive
  })

  const uploadDiagnostics: TryOnUploadDiagnostics = {
    userImageUrl: userBlob.url,
    itemImageUrl: itemBlob.url,
    identicalUploadUrls: userBlob.url === itemBlob.url,
  }

  logger.info('tryon-service', 'Try-on upload diagnostics collected', {
    userId: user.id,
    clientSubmissionId,
    type,
    ...uploadDiagnostics,
  })

  if (uploadDiagnostics.identicalUploadUrls) {
    logger.error(
      'tryon-service',
      'Try-on upload produced identical URLs',
      new Error('Identical upload URLs detected'),
      { userId: user.id, clientSubmissionId, type, ...uploadDiagnostics }
    )
  }

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
        effectivePrompt,
        retryCount: 0,
        clientSubmissionId,
        originalUserFileName: userImageFile.name,
        originalItemFileName: itemImageFile.name,
        inputDiagnostics,
        uploadDiagnostics,
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
        prompt: effectivePrompt
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
          logger.info('tryon-service', 'Gemini result uploaded to blob', {
            taskId: task.id,
            clientSubmissionId,
            url: finalResultUrl
          })
        } catch (uploadError) {
          logger.error('tryon-service', 'Failed to upload Gemini result to blob', uploadError as Error, {
            taskId: task.id,
            clientSubmissionId,
          })
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
      logger.error('tryon-service', 'Gemini generation failed', error as Error, {
        taskId: task.id,
        clientSubmissionId,
      })
      
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

      const externalTaskId = await submitAsyncTask(userDataUri, itemDataUri, effectivePrompt)

      // Update task with external ID
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.PROCESSING, // Mark as processing immediately
          metadata: {
            ...(task.metadata as any),
            externalTaskId,
            serviceType,
            isAsync,
            effectivePrompt,
            retryCount: 0,
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
      logger.error('tryon-service', 'GrsAi submission failed', error as Error, {
        taskId: task.id,
        clientSubmissionId,
      })
      
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
  if (task.status === TaskStatus.COMPLETED) {
    return {
      status: task.status,
      resultImageUrl: task.resultImageUrl || undefined,
      error: task.errorMessage || undefined
    }
  }

  const metadata = task.metadata as any

  if (task.status === TaskStatus.FAILED && !metadata?.externalTaskId) {
    return {
      status: task.status,
      resultImageUrl: task.resultImageUrl || undefined,
      error: task.errorMessage || undefined
    }
  }

  // If task has an external GrsAi ID, keep polling even if the local status was marked FAILED.
  if (metadata?.serviceType === 'grsai' && metadata?.externalTaskId) {
    // Poll GrsAi
    const pollResult = await pollTaskResult(metadata.externalTaskId)
    const retryCount = typeof metadata?.retryCount === 'number' ? metadata.retryCount : 0
    const externalPollMetadata = {
      ...(metadata as any),
      lastExternalPollAt: new Date().toISOString(),
      lastExternalStatus: pollResult.status,
      lastExternalProgress: pollResult.progress,
      lastExternalError: pollResult.error,
      lastExternalDiagnostics: pollResult.diagnostics,
    }
    
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
            ...externalPollMetadata,
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
    } else if (pollResult.status === 'succeeded' && !pollResult.imageUrl) {
      const errorMessage = 'GrsAi task succeeded without a result image URL'

      logger.error('tryon-service', errorMessage, undefined, {
        taskId,
        externalTaskId: metadata.externalTaskId,
        diagnostics: pollResult.diagnostics,
      })

      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          errorMessage,
          metadata: externalPollMetadata,
        }
      })

      return {
        status: TaskStatus.FAILED,
        error: errorMessage
      }
    } else if (pollResult.status === 'failed') {
      if (shouldTreatPollFailureAsTransient(pollResult.error)) {
        logger.warn('tryon-service', 'Transient GrsAi polling failure detected, keeping task in processing', {
          taskId,
          externalTaskId: metadata.externalTaskId,
          error: pollResult.error,
        })

        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: TaskStatus.PROCESSING,
            errorMessage: null,
            metadata: externalPollMetadata,
          }
        })

        return {
          status: TaskStatus.PROCESSING,
          progress: pollResult.progress ?? 0,
        }
      }

      if (
        retryCount < MAX_GRSAI_TIMEOUT_RETRIES &&
        shouldRetryGrsAiTimeout(pollResult.error) &&
        task.userImageUrl &&
        task.itemImageUrl
      ) {
        const retryPrompt = metadata?.effectivePrompt || TRY_ON_CONFIGS[task.type].aiPrompt

        logger.warn('tryon-service', 'Retrying GrsAi task after timeout', {
          taskId,
          previousExternalTaskId: metadata.externalTaskId,
          retryCount,
          maxRetries: MAX_GRSAI_TIMEOUT_RETRIES,
          error: pollResult.error,
        })

        try {
          const retriedExternalTaskId = await submitAsyncTask(
            task.userImageUrl,
            task.itemImageUrl,
            retryPrompt
          )

          await prisma.tryOnTask.update({
            where: { id: taskId },
            data: {
              status: TaskStatus.PROCESSING,
              errorMessage: null,
              metadata: {
                ...externalPollMetadata,
                externalTaskId: retriedExternalTaskId,
                retryCount: retryCount + 1,
                lastRetryAt: new Date().toISOString(),
                lastRetryReason: pollResult.error,
                previousExternalTaskId: metadata.externalTaskId,
                effectivePrompt: retryPrompt,
              }
            }
          })

          return {
            status: TaskStatus.PROCESSING,
            progress: 0,
          }
        } catch (retryError) {
          logger.error('tryon-service', 'Failed to resubmit GrsAi task after timeout', retryError as Error, {
            taskId,
            previousExternalTaskId: metadata.externalTaskId,
            retryCount,
          })
        }
      }

      // Update DB to FAILED
      await prisma.tryOnTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          errorMessage: pollResult.error,
          metadata: externalPollMetadata,
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

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { revalidateTag } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { generateTryOnImage } from "@/lib/gemini"
import { isMockMode } from "@/lib/mocks"
import { MockDatabase } from "@/lib/mocks/database"
import { mockBlobUpload } from "@/lib/mocks/blob"
import { mockGenerateTryOnImage } from "@/lib/mocks/gemini"
import { getTestSessionFromRequest } from "@/lib/test-session"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Set maximum duration for this serverless function
// Gemini API can take 4-10 seconds, plus upload/download time
// Free tier: max 10s, Hobby: max 10s, Pro: max 60s
export const maxDuration = 60 // 60 seconds for Pro plan

export async function POST(request: NextRequest) {
  try {
    // Check user authentication (NextAuth or test session)
    const session = await getServerSession(authOptions)
    const testSession = !session ? getTestSessionFromRequest(request) : null

    if (!session && !testSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    // Use session data
    const userId = session?.user?.id || testSession?.id || 'unknown'
    const userEmail = session?.user?.email || testSession?.email || 'test@example.com'

    // Validate user ID
    if (userId === 'unknown' || !userId) {
      return NextResponse.json(
        { success: false, error: "Invalid user session" },
        { status: 401 }
      )
    }

    // Check if user has remaining tries
    let user
    if (testSession) {
      // Use test session data
      console.log('🧪 Test Session: Using test session data')
      user = testSession
    } else if (isMockMode) {
      console.log('🧪 Mock Try-On: Using mock database')
      user = await MockDatabase.findUser({ id: userId })
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId }
      })

      // If user doesn't exist, create automatically (defensive programming)
      if (!user && session?.user) {
        console.log('User not found, creating user:', userId)
        user = await prisma.user.create({
          data: {
            id: userId,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            username: session.user.username,
            freeTrialsUsed: 0,
            isPremium: false,
          }
        })
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found, please log in again" },
        { status: 404 }
      )
    }

    // Check usage limit
    const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
    const isPremiumActive = user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

    if (!isPremiumActive && user.freeTrialsUsed >= freeTrialLimit) {
      return NextResponse.json(
        { success: false, error: "Free trial limit reached, please upgrade to Standard" },
        { status: 403 }
      )
    }

    // Get uploaded files
    const formData = await request.formData()
    const userImageFile = formData.get("userImage") as File
    const glassesImageFile = formData.get("glassesImage") as File

    if (!userImageFile) {
      return NextResponse.json(
        { success: false, error: "User photo is required" },
        { status: 400 }
      )
    }

    if (!glassesImageFile) {
      return NextResponse.json(
        { success: false, error: "Please upload glasses image" },
        { status: 400 }
      )
    }

    // Validate image sizes (should be compressed by frontend, but double-check)
    const MAX_IMAGE_SIZE = 1 * 1024 * 1024 // 1MB (frontend should compress to ~200-300KB)

    if (userImageFile.size > MAX_IMAGE_SIZE) {
      console.warn(`⚠️ User image too large: ${(userImageFile.size / 1024).toFixed(2)}KB`)
      return NextResponse.json(
        { success: false, error: "User image is too large. Please use a smaller image or compress it." },
        { status: 400 }
      )
    }

    if (glassesImageFile.size > MAX_IMAGE_SIZE) {
      console.warn(`⚠️ Glasses image too large: ${(glassesImageFile.size / 1024).toFixed(2)}KB`)
      return NextResponse.json(
        { success: false, error: "Glasses image is too large. Please use a smaller image or compress it." },
        { status: 400 }
      )
    }

    console.log(`📊 Image sizes: user=${(userImageFile.size / 1024).toFixed(2)}KB, glasses=${(glassesImageFile.size / 1024).toFixed(2)}KB`)

    // Upload user image
    const userImageFilename = `try-on/${userId}/${Date.now()}-user.jpg`
    let userImageBlob

    if (isMockMode) {
      userImageBlob = await mockBlobUpload(userImageFilename, userImageFile)
    } else {
      userImageBlob = await put(userImageFilename, userImageFile, {
        access: "public",
      })
    }

    // Upload glasses image
    const glassesImageFilename = `try-on/${userId}/${Date.now()}-glasses.jpg`
    let glassesImageBlob

    if (isMockMode) {
      glassesImageBlob = await mockBlobUpload(glassesImageFilename, glassesImageFile)
    } else {
      glassesImageBlob = await put(glassesImageFilename, glassesImageFile, {
        access: "public",
      })
    }

    const glassesImageUrl = glassesImageBlob.url

    // Create try-on task record
    let tryOnTask
    if (isMockMode) {
      tryOnTask = await MockDatabase.createTryOnTask({
        userId: userId,
        originalImageUrl: userImageBlob.url,
        glassesImageUrl: glassesImageUrl,
        status: "processing"
      })
    } else {
      tryOnTask = await prisma.tryOnTask.create({
        data: {
          userId: userId,
          userImageUrl: userImageBlob.url,
          glassesImageUrl,
          status: "PROCESSING"
        }
      })
    }

    if (!tryOnTask) {
      return NextResponse.json(
        { success: false, error: "Failed to create try-on task" },
        { status: 500 }
      )
    }

    // Process AI try-on synchronously to ensure completion
    // With maxDuration: 60, we have enough time for Gemini API (10-30s)
    console.log(`⏱️ [Task ${tryOnTask.id}] Starting synchronous processing (maxDuration: 60s)`)

    try {
      await processTryOnAsync(tryOnTask.id, userImageBlob.url, glassesImageUrl)
      console.log(`✅ [Task ${tryOnTask.id}] Processing completed successfully`)
    } catch (error) {
      console.error(`❌ [Task ${tryOnTask.id}] Processing failed:`, error)
      // Error handling is done inside processTryOnAsync
    }

    // Update user usage count (free users only)
    if (!isPremiumActive) {
      if (isMockMode) {
        await MockDatabase.updateUser(userId, {
          freeTrialsUsed: user.freeTrialsUsed + 1
        })
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            freeTrialsUsed: user.freeTrialsUsed + 1
          }
        })

        // 清除用户缓存，确保 Dashboard 立即显示最新使用次数
        revalidateTag(`user-${userId}`)
      }
    }

    // Get the final task status to return to client
    const finalTask = isMockMode
      ? await MockDatabase.findTryOnTask(tryOnTask.id)
      : await prisma.tryOnTask.findUnique({
          where: { id: tryOnTask.id },
          select: {
            id: true,
            status: true,
            resultImageUrl: true,
            errorMessage: true
          }
        })

    const taskStatus = finalTask?.status || "COMPLETED"
    const statusLower = typeof taskStatus === 'string' ? taskStatus.toLowerCase() : 'completed'

    return NextResponse.json({
      success: true,
      data: {
        taskId: tryOnTask.id,
        status: statusLower,
        resultImageUrl: finalTask?.resultImageUrl || null,
        errorMessage: isMockMode ? undefined : (finalTask as any)?.errorMessage,
        message: taskStatus === "COMPLETED"
          ? "Try-on completed successfully!"
          : taskStatus === "FAILED"
          ? "Try-on failed, please try again"
          : "Processing..."
      }
    })

  } catch (error) {
    console.error("Try-on API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to upload base64 image to Blob Storage
async function uploadBase64ToBlob(base64Data: string, taskId: string, userId: string): Promise<string> {
  console.log("🔄 Converting base64 image to Blob Storage...")

  // Extract mime type and base64 data
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error("Invalid base64 data format")
  }

  const mimeType = matches[1]
  const base64Content = matches[2]

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64')

  // Determine file extension from mime type
  const extension = mimeType.split('/')[1] || 'png'
  const filename = `try-on/${userId}/${taskId}-result.${extension}`

  console.log(`📤 Uploading to Blob Storage: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`)

  // Upload to Vercel Blob Storage
  if (isMockMode) {
    const blob = await mockBlobUpload(filename, new File([buffer], filename, { type: mimeType }))
    return blob.url
  } else {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mimeType
    })
    return blob.url
  }
}

// Process try-on task asynchronously
async function processTryOnAsync(taskId: string, userImageUrl: string, glassesImageUrl: string) {
  const processStartTime = Date.now()
  console.log(`🚀 [Task ${taskId}] Starting async processing...`)
  console.log(`📍 [Task ${taskId}] Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}`)

  try {
    let result

    if (isMockMode) {
      // 在Mock模式下使用Mock AI服务
      console.log(`🧪 [Task ${taskId}] Using Mock AI service`)
      result = await mockGenerateTryOnImage({
        userImageUrl,
        glassesImageUrl
      })
    } else {
      // 调用Gemini API进行图像处理
      console.log(`🎨 [Task ${taskId}] Calling Gemini API...`)
      const aiStartTime = Date.now()
      result = await generateTryOnImage({
        userImageUrl,
        glassesImageUrl
      })
      const aiTime = Date.now() - aiStartTime
      console.log(`⏱️ [Task ${taskId}] AI processing time: ${aiTime}ms (${(aiTime/1000).toFixed(2)}s)`)
    }

    console.log(`📊 [Task ${taskId}] Try-on result:`, { success: result.success, hasImageUrl: !!result.imageUrl, error: result.error })

    if (result.success && result.imageUrl) {
      console.log(`✅ [Task ${taskId}] Updating task status to COMPLETED...`)

      // Check if the result is base64 and convert to Blob URL
      let finalImageUrl = result.imageUrl
      if (result.imageUrl.startsWith('data:')) {
        const uploadStartTime = Date.now()
        console.log(`⚠️ [Task ${taskId}] Result image is base64 format, converting to Blob Storage...`)

        // Get userId from task
        let userId: string
        if (isMockMode) {
          const task = await MockDatabase.findTryOnTask(taskId)
          userId = task?.userId || 'unknown'
        } else {
          const task = await prisma.tryOnTask.findUnique({
            where: { id: taskId },
            select: { userId: true }
          })
          userId = task?.userId || 'unknown'
        }

        // Upload base64 to Blob Storage
        finalImageUrl = await uploadBase64ToBlob(result.imageUrl, taskId, userId)
        const uploadTime = Date.now() - uploadStartTime
        console.log(`✅ [Task ${taskId}] Base64 converted to Blob URL in ${uploadTime}ms: ${finalImageUrl}`)
      }

      // 更新任务状态为完成
      console.log(`💾 [Task ${taskId}] Updating database status to COMPLETED...`)
      if (isMockMode) {
        await MockDatabase.updateTryOnTask(taskId, {
          status: "completed",
          resultImageUrl: finalImageUrl
        })
      } else {
        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            resultImageUrl: finalImageUrl
          }
        })
      }

      const totalProcessTime = Date.now() - processStartTime
      console.log(`✅ [Task ${taskId}] Task completed in ${totalProcessTime}ms (${(totalProcessTime/1000).toFixed(2)}s) ⭐ TOTAL TIME`)
      console.log(`✅ [Task ${taskId}] Database updated successfully with result URL: ${finalImageUrl.substring(0, 80)}...`)
    } else {
      console.log(`❌ [Task ${taskId}] Try-on failed, updating task status to FAILED...`)
      console.log(`❌ [Task ${taskId}] Error: ${result.error}`)
      // 更新任务状态为失败
      if (isMockMode) {
        await MockDatabase.updateTryOnTask(taskId, {
          status: "failed",
          errorMessage: result.error || "AI处理失败"
        })
      } else {
        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: result.error || "AI处理失败"
          }
        })
      }
      console.log(`💾 [Task ${taskId}] Database updated with FAILED status`)
    }
  } catch (error) {
    console.error(`❌ [Task ${taskId}] Exception in processTryOnAsync:`, error)
    console.error(`❌ [Task ${taskId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')

    // 更新任务状态为失败
    console.log(`💾 [Task ${taskId}] Updating database status to FAILED due to exception...`)
    if (isMockMode) {
      await MockDatabase.updateTryOnTask(taskId, {
        status: "failed",
        errorMessage: "处理过程中发生错误"
      })
    } else {
      try {
        await prisma.tryOnTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "未知错误"
          }
        })
        console.log(`💾 [Task ${taskId}] Database updated with FAILED status after exception`)
      } catch (dbError) {
        console.error(`❌ [Task ${taskId}] Failed to update database after exception:`, dbError)
      }
    }
  }
}

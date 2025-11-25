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
import { QUOTA_CONFIG } from "@/config/pricing"
import { TryOnType, getTryOnConfig, isValidTryOnType } from "@/config/try-on-types"
import { logger, getRequestContext } from "@/lib/logger"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Set maximum duration for this serverless function
// Gemini API can take 4-10 seconds, plus upload/download time
// Free tier: max 10s, Hobby: max 10s, Pro: max 60s
export const maxDuration = 60 // 60 seconds for Pro plan

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
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
      logger.debug('api', 'Test Session: Using test session data', undefined, ctx)
      user = testSession
    } else if (isMockMode) {
      console.log('🧪 Mock Try-On: Using mock database')
      logger.debug('api', 'Mock Try-On: Using mock database', undefined, ctx)
      user = await MockDatabase.findUser({ id: userId })
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId }
      })

      // If user doesn't exist, create automatically (defensive programming)
      if (!user && session?.user) {
        console.log('User not found, creating user:', userId)
        logger.info('api', 'User not found, creating user', { userId }, ctx)
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
    const isPremiumActive = user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

    // Check quota for both Premium and Free users
    if (isPremiumActive && user.currentSubscriptionType) {
      // Premium users: check subscription quota + credits
      const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY'
        ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
        : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
      const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
      const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
      const totalRemaining = subscriptionRemaining + creditsRemaining

      if (totalRemaining <= 0) {
        return NextResponse.json(
          { success: false, error: "No remaining quota. Please purchase Credits Pack." },
          { status: 403 }
        )
      }
    } else if (!isPremiumActive) {
      // Free users: check free trials + credits
      const freeRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed)
      const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
      const totalRemaining = freeRemaining + creditsRemaining

      if (totalRemaining <= 0) {
        return NextResponse.json(
          { success: false, error: "No remaining quota. Please purchase Credits Pack or upgrade to Standard." },
          { status: 403 }
        )
      }
    }

    // Get uploaded files
    const formData = await request.formData()
    const userImageFile = formData.get("userImage") as File
    const itemImageFile = formData.get("itemImage") as File || formData.get("glassesImage") as File // Support both new and legacy field names
    const tryOnTypeParam = formData.get("type") as string || "GLASSES" // Default to GLASSES for backward compatibility

    // Validate try-on type
    const tryOnType = tryOnTypeParam.toUpperCase() as TryOnType
    if (!isValidTryOnType(tryOnType)) {
      return NextResponse.json(
        { success: false, error: `Invalid try-on type: ${tryOnTypeParam}` },
        { status: 400 }
      )
    }

    const config = getTryOnConfig(tryOnType)

    if (!userImageFile) {
      return NextResponse.json(
        { success: false, error: "User photo is required" },
        { status: 400 }
      )
    }

    if (!itemImageFile) {
      return NextResponse.json(
        { success: false, error: `Please upload ${config.name.toLowerCase()} image` },
        { status: 400 }
      )
    }

    // Validate image sizes (should be compressed by frontend, but double-check)
    const MAX_IMAGE_SIZE = 1 * 1024 * 1024 // 1MB (frontend should compress to ~200-300KB)

    if (userImageFile.size > MAX_IMAGE_SIZE) {
      console.warn(`⚠️ User image too large: ${(userImageFile.size / 1024).toFixed(2)}KB`)
      logger.warn('api', 'User image too large', { size: userImageFile.size }, ctx)
      return NextResponse.json(
        { success: false, error: "User image is too large. Please use a smaller image or compress it." },
        { status: 400 }
      )
    }

    if (itemImageFile.size > MAX_IMAGE_SIZE) {
      console.warn(`⚠️ ${config.name} image too large: ${(itemImageFile.size / 1024).toFixed(2)}KB`)
      logger.warn('api', `${config.name} image too large`, { size: itemImageFile.size }, ctx)
      return NextResponse.json(
        { success: false, error: `${config.name} image is too large. Please use a smaller image or compress it.` },
        { status: 400 }
      )
    }

    console.log(`📊 [${tryOnType}] Image sizes: user=${(userImageFile.size / 1024).toFixed(2)}KB, ${config.name.toLowerCase()}=${(itemImageFile.size / 1024).toFixed(2)}KB`)
    logger.debug('api', `Image sizes: user=${(userImageFile.size / 1024).toFixed(2)}KB, ${config.name.toLowerCase()}=${(itemImageFile.size / 1024).toFixed(2)}KB`, { tryOnType }, ctx)

    // 🔍 DEBUG: Log file details to help diagnose upload issues
    console.log(`📸 File details:`)
    console.log(`  User image: name="${userImageFile.name}", size=${userImageFile.size}, type=${userImageFile.type}`)
    console.log(`  ${config.name} image: name="${itemImageFile.name}", size=${itemImageFile.size}, type=${itemImageFile.type}`)
    logger.debug('api', 'File details', { userImage: { name: userImageFile.name, size: userImageFile.size, type: userImageFile.type }, itemImage: { name: itemImageFile.name, size: itemImageFile.size, type: itemImageFile.type } }, ctx)

    // 🔍 CHECK 1: Are they the same File object reference?
    const sameObject = userImageFile === itemImageFile
    console.log(`  Same object reference? ${sameObject ? '❌ YES (PROBLEM!)' : '✅ No'}`)
    logger.debug('api', `Same object reference: ${sameObject ? 'YES (PROBLEM!)' : 'No'}`, undefined, ctx)

    // 🔍 CHECK 2: Do they have identical metadata?
    const sameMetadata = userImageFile.name === itemImageFile.name &&
                         userImageFile.size === itemImageFile.size
    if (sameMetadata) {
      console.warn(`  ⚠️ WARNING: Files have identical name and size!`)
      console.warn(`     This might indicate user uploaded the same file twice`)
      console.warn(`     Or there's a bug in the upload process`)
      logger.warn('api', 'Files have identical name and size - possible duplicate upload or bug', undefined, ctx)
    }

    // 🔍 CHECK 3: Calculate file content fingerprints to detect if content is identical
    // This is critical - even if File objects are different, their content might be the same
    const calculateFileFingerprint = async (file: File): Promise<string> => {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Create fingerprint from first 512 bytes + file size
      let hash = 0
      const sampleSize = Math.min(512, bytes.length)
      for (let i = 0; i < sampleSize; i++) {
        hash = ((hash << 5) - hash) + bytes[i]
        hash = hash & hash // Convert to 32-bit integer
      }

      return `${file.size}-${hash.toString(16)}`
    }

    const userImageFingerprint = await calculateFileFingerprint(userImageFile)
    const itemImageFingerprint = await calculateFileFingerprint(itemImageFile)

    console.log(`  User image fingerprint: ${userImageFingerprint}`)
    console.log(`  ${config.name} image fingerprint: ${itemImageFingerprint}`)
    logger.debug('api', 'File fingerprints', { userImageFingerprint, itemImageFingerprint }, ctx)

    if (userImageFingerprint === itemImageFingerprint) {
      console.error(`  ❌ CRITICAL: File content fingerprints are IDENTICAL!`)
      console.error(`     This means the two files have the same content!`)
      console.error(`     This is the root cause of the duplicate image problem!`)
      logger.error('api', 'CRITICAL: File content fingerprints are IDENTICAL - duplicate image problem detected', new Error('Duplicate fingerprints'), { userImageFingerprint, itemImageFingerprint }, ctx)
    } else {
      console.log(`  ✅ File content fingerprints are different (good)`)
      logger.debug('api', 'File content fingerprints are different (good)', undefined, ctx)
    }

    // 🔥 FIX: Use single timestamp to avoid filename collision
    const timestamp = Date.now()

    // Upload user image
    const userImageFilename = `try-on/${userId}/${timestamp}-user.jpg`
    console.log(`📤 Uploading user image to: ${userImageFilename}`)
    logger.info('api', 'Uploading user image', { filename: userImageFilename }, ctx)

    let userImageBlob

    if (isMockMode) {
      userImageBlob = await mockBlobUpload(userImageFilename, userImageFile)
    } else {
      userImageBlob = await put(userImageFilename, userImageFile, {
        access: "public",
      })
    }

    console.log(`✅ User image uploaded to: ${userImageBlob.url}`)
    logger.info('api', 'User image uploaded successfully', { url: userImageBlob.url }, ctx)

    // Upload item image (glasses, outfit, shoes, etc.)
    const itemImageFilename = `try-on/${userId}/${timestamp}-${tryOnType.toLowerCase()}.jpg`
    console.log(`📤 Uploading ${config.name.toLowerCase()} image to: ${itemImageFilename}`)
    logger.info('api', `Uploading ${config.name.toLowerCase()} image`, { filename: itemImageFilename }, ctx)

    let itemImageBlob

    if (isMockMode) {
      itemImageBlob = await mockBlobUpload(itemImageFilename, itemImageFile)
    } else {
      itemImageBlob = await put(itemImageFilename, itemImageFile, {
        access: "public",
      })
    }

    console.log(`✅ ${config.name} image uploaded to: ${itemImageBlob.url}`)
    logger.info('api', `${config.name} image uploaded successfully`, { url: itemImageBlob.url }, ctx)

    const itemImageUrl = itemImageBlob.url

    // 🔍 DEBUG: Verify URLs are different
    console.log(`🔍 Upload verification:`)
    console.log(`  User URL: ${userImageBlob.url}`)
    console.log(`  ${config.name} URL: ${itemImageUrl}`)
    console.log(`  URLs are ${userImageBlob.url === itemImageUrl ? '❌ SAME (ERROR!)' : '✅ different (OK)'}`)
    logger.debug('api', 'Upload verification', { userUrl: userImageBlob.url, itemUrl: itemImageUrl, same: userImageBlob.url === itemImageUrl }, ctx)

    // Create try-on task record
    let tryOnTask
    if (isMockMode) {
      tryOnTask = await MockDatabase.createTryOnTask({
        userId: userId,
        originalImageUrl: userImageBlob.url,
        glassesImageUrl: itemImageUrl, // Mock DB still uses old field name
        status: "processing"
      })
    } else {
      tryOnTask = await prisma.tryOnTask.create({
        data: {
          userId: userId,
          type: tryOnType,
          userImageUrl: userImageBlob.url,
          itemImageUrl,
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
      await processTryOnAsync(tryOnTask.id, userImageBlob.url, itemImageUrl, tryOnType, ctx)
      console.log(`✅ [Task ${tryOnTask.id}] Processing completed successfully`)
    } catch (error) {
      console.error(`❌ [Task ${tryOnTask.id}] Processing failed:`, error)
      // Error handling is done inside processTryOnAsync
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

    // 🔥 修复：只有试戴成功时才扣减次数
    // 优先级：
    // - Premium用户：增加 premiumUsageCount（订阅配额优先，然后是credits）
    // - 免费用户：优先使用 credits，然后使用免费试用
    // 判断条件：任务状态必须是 COMPLETED（兼容大小写）
    const isTaskSuccessful = taskStatus?.toString().toUpperCase() === "COMPLETED"

    if (isTaskSuccessful) {
      console.log(`✅ [Task ${tryOnTask.id}] Try-on successful, deducting usage count...`)
      logger.info('api', 'Try-on successful, deducting usage count', { taskId: tryOnTask.id }, ctx)

      if (isMockMode) {
        if (!isPremiumActive) {
          await MockDatabase.updateUser(userId, {
            freeTrialsUsed: user.freeTrialsUsed + 1
          })
        }
        // Note: Mock mode doesn't track premiumUsageCount yet
      } else {
        if (!isPremiumActive) {
          // 免费用户：优先消费 credits，如果没有 credits 则消费免费试用
          const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
          const hasCredits = creditsRemaining > 0

          if (hasCredits) {
            // 有 credits：增加已使用计数
            await prisma.user.update({
              where: { id: userId },
              data: {
                creditsUsed: {
                  increment: 1
                }
              }
            })
            console.log(`💳 User ${userId}: Consumed 1 credit (${creditsRemaining} -> ${creditsRemaining - 1})`)
            logger.info('api', 'User consumed credit', { userId, remaining: creditsRemaining - 1 }, ctx)
          } else {
            // 没有 credits：使用免费试用
            await prisma.user.update({
              where: { id: userId },
              data: {
                freeTrialsUsed: {
                  increment: 1
                }
              }
            })
            console.log(`🆓 User ${userId}: Used free trial (${user.freeTrialsUsed} -> ${user.freeTrialsUsed + 1})`)
            logger.info('api', 'User used free trial', { userId, trialsUsed: user.freeTrialsUsed + 1 }, ctx)
          }
        } else {
          // Premium用户：优先使用订阅配额，然后使用 credits
          const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY'
            ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
            : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
          const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
          const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)

          if (subscriptionRemaining > 0) {
            // 有订阅配额：增加 premiumUsageCount
            await prisma.user.update({
              where: { id: userId },
              data: {
                premiumUsageCount: {
                  increment: 1
                }
              }
            })
            console.log(`👑 Premium user ${userId}: Used subscription quota (${subscriptionRemaining} -> ${subscriptionRemaining - 1})`)
            logger.info('api', 'Premium user used subscription quota', { userId, remaining: subscriptionRemaining - 1 }, ctx)
          } else if (creditsRemaining > 0) {
            // 订阅配额用完，使用 credits
            await prisma.user.update({
              where: { id: userId },
              data: {
                creditsUsed: {
                  increment: 1
                }
              }
            })
            console.log(`💳 Premium user ${userId}: Used credit (${creditsRemaining} -> ${creditsRemaining - 1})`)
            logger.info('api', 'Premium user used credit', { userId, remaining: creditsRemaining - 1 }, ctx)
          }
        }

        // 清除用户缓存，确保 Dashboard 立即显示最新使用次数
        revalidateTag(`user-${userId}`)
      }
    } else {
      console.log(`⚠️ [Task ${tryOnTask.id}] Try-on failed (status: ${taskStatus}), NOT deducting usage count`)
    }

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
async function processTryOnAsync(taskId: string, userImageUrl: string, itemImageUrl: string, tryOnType: TryOnType, context?: any) {
  const processStartTime = Date.now()
  const config = getTryOnConfig(tryOnType)
  console.log(`🚀 [Task ${taskId}] Starting async processing for ${tryOnType}...`)
  console.log(`📍 [Task ${taskId}] Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}`)

  try {
    let result

    if (isMockMode) {
      // 在Mock模式下使用Mock AI服务
      console.log(`🧪 [Task ${taskId}] Using Mock AI service`)
      result = await mockGenerateTryOnImage({
        userImageUrl,
        glassesImageUrl: itemImageUrl // Mock still uses old parameter name
      })
    } else {
      // 调用Gemini API进行图像处理
      console.log(`🎨 [Task ${taskId}] Calling Gemini API with ${tryOnType}-specific prompt...`)
      const aiStartTime = Date.now()
      result = await generateTryOnImage({
        userImageUrl,
        itemImageUrl,
        prompt: config.aiPrompt
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
      logger.info('api', 'Updating database status to COMPLETED', { taskId }, context)
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
      logger.info('api', 'Task completed successfully', { taskId, duration: totalProcessTime }, context)
      console.log(`✅ [Task ${taskId}] Database updated successfully with result URL: ${finalImageUrl.substring(0, 80)}...`)
      logger.info('api', 'Database updated successfully with result URL', { taskId, resultUrl: finalImageUrl.substring(0, 80) }, context)
    } else {
      console.log(`❌ [Task ${taskId}] Try-on failed, updating task status to FAILED...`)
      logger.warn('api', 'Try-on failed, updating task status to FAILED', { taskId }, context)
      console.log(`❌ [Task ${taskId}] Error: ${result.error}`)
      logger.warn('api', 'Try-on error', { taskId, error: result.error }, context)
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
      logger.info('api', 'Database updated with FAILED status', { taskId }, context)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`❌ [Task ${taskId}] Exception in processTryOnAsync:`, error)
    logger.error('api', 'Exception in processTryOnAsync', err, { taskId }, context)
    console.error(`❌ [Task ${taskId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    logger.error('api', 'Error stack', err, { taskId, stack: error instanceof Error ? error.stack : 'No stack trace' }, context)

    // 更新任务状态为失败
    console.log(`💾 [Task ${taskId}] Updating database status to FAILED due to exception...`)
    logger.info('api', 'Updating database status to FAILED due to exception', { taskId }, context)
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
        logger.info('api', 'Database updated with FAILED status after exception', { taskId }, context)
      } catch (dbError) {
        const dbErr = dbError instanceof Error ? dbError : new Error(String(dbError))
        console.error(`❌ [Task ${taskId}] Failed to update database after exception:`, dbError)
        logger.error('database', 'Failed to update task status after exception', dbErr, { taskId }, context)
      }
    }
  }
}

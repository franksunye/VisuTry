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
      return NextResponse.json(
        { success: false, error: "User image is too large. Please use a smaller image or compress it." },
        { status: 400 }
      )
    }

    if (itemImageFile.size > MAX_IMAGE_SIZE) {
      console.warn(`⚠️ ${config.name} image too large: ${(itemImageFile.size / 1024).toFixed(2)}KB`)
      return NextResponse.json(
        { success: false, error: `${config.name} image is too large. Please use a smaller image or compress it.` },
        { status: 400 }
      )
    }

    console.log(`📊 [${tryOnType}] Image sizes: user=${(userImageFile.size / 1024).toFixed(2)}KB, ${config.name.toLowerCase()}=${(itemImageFile.size / 1024).toFixed(2)}KB`)

    // 🔍 DEBUG: Log file details to help diagnose upload issues
    console.log(`📸 File details:`)
    console.log(`  User image: name="${userImageFile.name}", size=${userImageFile.size}, type=${userImageFile.type}`)
    console.log(`  ${config.name} image: name="${itemImageFile.name}", size=${itemImageFile.size}, type=${itemImageFile.type}`)

    // 🔍 CHECK 1: Are they the same File object reference?
    const sameObject = userImageFile === itemImageFile
    console.log(`  Same object reference? ${sameObject ? '❌ YES (PROBLEM!)' : '✅ No'}`)

    // 🔍 CHECK 2: Do they have identical metadata?
    const sameMetadata = userImageFile.name === itemImageFile.name &&
                         userImageFile.size === itemImageFile.size
    if (sameMetadata) {
      console.warn(`  ⚠️ WARNING: Files have identical name and size!`)
      console.warn(`     This might indicate user uploaded the same file twice`)
      console.warn(`     Or there's a bug in the upload process`)
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

    if (userImageFingerprint === itemImageFingerprint) {
      console.error(`  ❌ CRITICAL: File content fingerprints are IDENTICAL!`)
      console.error(`     This means the two files have the same content!`)
      console.error(`     This is the root cause of the duplicate image problem!`)
    } else {
      console.log(`  ✅ File content fingerprints are different (good)`)
    }

    // 🔥 FIX: Use single timestamp to avoid filename collision
    const timestamp = Date.now()

    // Upload user image
    const userImageFilename = `try-on/${userId}/${timestamp}-user.jpg`
    console.log(`📤 Uploading user image to: ${userImageFilename}`)

    let userImageBlob

    if (isMockMode) {
      userImageBlob = await mockBlobUpload(userImageFilename, userImageFile)
    } else {
      userImageBlob = await put(userImageFilename, userImageFile, {
        access: "public",
      })
    }

    console.log(`✅ User image uploaded to: ${userImageBlob.url}`)

    // Upload item image (glasses, outfit, shoes, etc.)
    const itemImageFilename = `try-on/${userId}/${timestamp}-${tryOnType.toLowerCase()}.jpg`
    console.log(`📤 Uploading ${config.name.toLowerCase()} image to: ${itemImageFilename}`)

    let itemImageBlob

    if (isMockMode) {
      itemImageBlob = await mockBlobUpload(itemImageFilename, itemImageFile)
    } else {
      itemImageBlob = await put(itemImageFilename, itemImageFile, {
        access: "public",
      })
    }

    console.log(`✅ ${config.name} image uploaded to: ${itemImageBlob.url}`)

    const itemImageUrl = itemImageBlob.url

    // 🔍 DEBUG: Verify URLs are different
    console.log(`🔍 Upload verification:`)
    console.log(`  User URL: ${userImageBlob.url}`)
    console.log(`  ${config.name} URL: ${itemImageUrl}`)
    console.log(`  URLs are ${userImageBlob.url === itemImageUrl ? '❌ SAME (ERROR!)' : '✅ different (OK)'}`)

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
      await processTryOnAsync(tryOnTask.id, userImageBlob.url, itemImageUrl, tryOnType)
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
async function processTryOnAsync(taskId: string, userImageUrl: string, itemImageUrl: string, tryOnType: TryOnType) {
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

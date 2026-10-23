import { NextRequest, NextResponse } from "next/server"
import { requireAuthWithUser } from "@/lib/api-auth"
import { getRequestContext, logger } from "@/lib/logger"
import { prisma } from '@/lib/prisma'
import { checkUserQuota, settleTryOnTaskQuota } from "@/lib/quota"
import { submitTryOnTask } from "@/lib/tryon-service"
import { tryOnMediaPath } from '@/lib/tryon-media'
import { TryOnType, isValidTryOnType } from "@/config/try-on-types"
import { createHash } from "node:crypto"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    // 1. Authentication
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user
    const userId = auth.userId

    // 2. Check quota before any new provider dispatch. Replays may reuse an
    // existing task even after remaining credits have reached zero.
    const quotaCheck = checkUserQuota(user)

    // 3. Parse Request Data
    const formData = await request.formData()
    const userImageFile = formData.get("userImage") as File
    const itemImageFile = formData.get("itemImage") as File || formData.get("glassesImage") as File
    const tryOnTypeParam = formData.get("type") as string || "GLASSES"
    const prompt = formData.get("prompt") as string || undefined
    const clientSubmissionId = formData.get("clientSubmissionId") as string || undefined

    // Validate inputs
    if (!userImageFile || !itemImageFile) {
      return NextResponse.json(
        { success: false, error: "Both user image and item image are required" },
        { status: 400 }
      )
    }

    const tryOnType = tryOnTypeParam.toUpperCase() as TryOnType
    if (!isValidTryOnType(tryOnType)) {
      return NextResponse.json(
        { success: false, error: `Invalid try-on type: ${tryOnTypeParam}` },
        { status: 400 }
      )
    }

    const priorTask = clientSubmissionId
      ? await prisma.tryOnTask.findUnique({
          where: { userId_clientSubmissionId: { userId, clientSubmissionId } },
          select: { id: true, type: true },
        })
      : null
    if (priorTask && priorTask.type !== tryOnType) {
      return NextResponse.json(
        { success: false, error: 'Submission ID belongs to a different Try-On type' },
        { status: 409 },
      )
    }
    if (!quotaCheck.allowed && !priorTask) {
      return NextResponse.json(
        { success: false, error: quotaCheck.reason },
        { status: 403 },
      )
    }

    logger.debug('upload', 'Submit route received try-on files', {
      userId,
      clientSubmissionId,
      tryOnType,
      userImage: {
        name: userImageFile.name,
        size: userImageFile.size,
        type: userImageFile.type,
      },
      itemImage: {
        name: itemImageFile.name,
        size: itemImageFile.size,
        type: itemImageFile.type,
      },
      sameObjectReference: userImageFile === itemImageFile,
      sameFileName: userImageFile.name === itemImageFile.name,
      sameFileSize: userImageFile.size === itemImageFile.size,
    }, ctx)

    const sameMetadata =
      userImageFile.name === itemImageFile.name &&
      userImageFile.size === itemImageFile.size &&
      userImageFile.type === itemImageFile.type

    if (sameMetadata) {
      const [userBuffer, itemBuffer] = await Promise.all([
        userImageFile.arrayBuffer(),
        itemImageFile.arrayBuffer(),
      ])

      const userSha256 = createHash('sha256').update(Buffer.from(userBuffer)).digest('hex')
      const itemSha256 = createHash('sha256').update(Buffer.from(itemBuffer)).digest('hex')
      const sameContent = userSha256 === itemSha256

      logger.debug('upload', 'Submit route duplicate guard checked', {
        userId,
        clientSubmissionId,
        tryOnType,
        sameMetadata,
        sameContentSha256: sameContent,
      }, ctx)

      if (sameContent) {
        logger.warn('upload', 'Submit route blocked request: identical user/item file content', {
          userId,
          clientSubmissionId,
          tryOnType,
          userImageName: userImageFile.name,
          itemImageName: itemImageFile.name,
          userImageSize: userImageFile.size,
          itemImageSize: itemImageFile.size,
        }, ctx)

        return NextResponse.json(
          {
            success: false,
            error: "User image and item image are identical. Please upload two different images.",
          },
          { status: 400 }
        )
      }
    }

    // 4. Submit Task
    const result = await submitTryOnTask(
      user,
      userImageFile,
      itemImageFile,
      tryOnType,
      prompt,
      { clientSubmissionId }
    )

    // 5. Handle Synchronous Completion (e.g. Gemini Premium)
    if (result.status === 'completed') {
      await settleTryOnTaskQuota(result.taskId, userId, ctx)
    }

    const clientResult = {
      ...result,
      resultImageUrl: result.resultImageUrl
        ? tryOnMediaPath(result.taskId, 'result')
        : result.resultImageUrl,
    }

    return NextResponse.json({
      success: true,
      data: clientResult
    })

  } catch (error) {
    console.error("Try-on Submit API error:", error)
    logger.error('api', 'Try-on Submit API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

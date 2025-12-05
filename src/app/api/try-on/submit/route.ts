import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { checkUserQuota, deductUserQuota } from "@/lib/quota"
import { submitTryOnTask } from "@/lib/tryon-service"
import { TryOnType, isValidTryOnType } from "@/config/try-on-types"
import { User } from "@prisma/client"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const userId = user.id

    // 2. Check Quota
    const quotaCheck = checkUserQuota(user)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { success: false, error: quotaCheck.reason },
        { status: 403 }
      )
    }

    // 3. Parse Request Data
    const formData = await request.formData()
    const userImageFile = formData.get("userImage") as File
    const itemImageFile = formData.get("itemImage") as File || formData.get("glassesImage") as File
    const tryOnTypeParam = formData.get("type") as string || "GLASSES"
    const prompt = formData.get("prompt") as string || undefined

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

    // 4. Submit Task
    const result = await submitTryOnTask(
      user,
      userImageFile,
      itemImageFile,
      tryOnType,
      prompt
    )

    // 5. Handle Synchronous Completion (e.g. Gemini Premium)
    if (result.status === 'completed') {
      // Deduct quota immediately for synchronous success
      await deductUserQuota(userId, ctx)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Try-on Submit API error:", error)
    logger.error('api', 'Try-on Submit API error', error, ctx)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

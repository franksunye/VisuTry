import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { deductUserQuota } from "@/lib/quota"
import { getTryOnResult } from "@/lib/tryon-service"

export const dynamic = 'force-dynamic'

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

    // 2. Parse Request
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      )
    }

    // 3. Verify Ownership
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
      select: { userId: true }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this task" },
        { status: 403 }
      )
    }

    // 4. Get/Poll Result
    const result = await getTryOnResult(taskId)

    // 5. Handle Quota Deduction (Atomic)
    if (result.status === 'COMPLETED' && result.isNewCompletion) {
      console.log(`✅ [Task ${taskId}] Async task completed, deducting quota...`)
      await deductUserQuota(userId, ctx)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Try-on Poll API error:", error)
    logger.error('api', 'Try-on Poll API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

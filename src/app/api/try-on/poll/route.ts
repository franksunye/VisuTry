import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { settleTryOnTaskQuota } from "@/lib/quota"
import { getTryOnResult } from "@/lib/tryon-service"
import { tryOnMediaPath } from '@/lib/tryon-media'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const userId = auth.userId
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      )
    }

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

    const result = await getTryOnResult(taskId)

    if (result.status === 'COMPLETED') {
      await settleTryOnTaskQuota(taskId, userId, ctx)
    }

    const clientResult = {
      ...result,
      resultImageUrl: result.resultImageUrl
        ? tryOnMediaPath(taskId, 'result')
        : result.resultImageUrl,
    }

    return NextResponse.json({
      success: true,
      data: clientResult
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

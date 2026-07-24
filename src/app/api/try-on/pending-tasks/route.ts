import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { TaskStatus } from "@prisma/client"
import { isValidTryOnType } from "@/config/try-on-types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    // 1. Authentication
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const userId = auth.userId

    const type = request.nextUrl.searchParams.get('type')?.toUpperCase()
    if (!type || !isValidTryOnType(type)) {
      return NextResponse.json(
        { success: false, error: "A valid Try-On type is required" },
        { status: 400 }
      )
    }

    // 2. Find latest task that is still processing
    // Logic:
    // - ONLY return tasks with status PENDING or PROCESSING
    // - COMPLETED or FAILED tasks should NOT be recovered
    //   (if completed, user already saw the result before leaving)
    //   (user can view completed results in Dashboard/History)
    // - Safety cutoff: 30 minutes to avoid zombie tasks

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const pendingTask = await prisma.tryOnTask.findFirst({
      where: {
        userId: userId,
        type,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.PROCESSING]
        },
        createdAt: {
          gt: thirtyMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!pendingTask) {
      return NextResponse.json([])
    }

    return NextResponse.json([{
      taskId: pendingTask.id,
      status: pendingTask.status,
      createdAt: pendingTask.createdAt,
      serviceType: (pendingTask.metadata as any)?.serviceType,
      isAsync: (pendingTask.metadata as any)?.isAsync
    }])

  } catch (error) {
    console.error("Pending Tasks API error:", error)
    logger.error('api', 'Pending Tasks API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

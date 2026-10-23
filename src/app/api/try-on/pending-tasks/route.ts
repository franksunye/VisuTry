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

    // Recent active tasks keep the original 30-minute recovery behavior.
    // Older ambiguous provider submissions are the exception: aging alone
    // cannot prove a non-idempotent generation POST was rejected or unbilled.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const activeStatus = { in: [TaskStatus.PENDING, TaskStatus.PROCESSING] }

    const [recentTask, olderUnconfirmed] = await Promise.all([
      prisma.tryOnTask.findFirst({
        where: {
          userId,
          origin: 'CONSUMER',
          type,
          status: activeStatus,
          createdAt: { gt: thirtyMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, metadata: true },
      }),
      prisma.tryOnTask.findMany({
        where: {
          userId,
          origin: 'CONSUMER',
          type,
          status: activeStatus,
          createdAt: { lte: thirtyMinutesAgo },
          OR: [
            { metadata: { path: ['dispatchOutcome'], equals: 'UNKNOWN' } },
            { metadata: { path: ['dispatchOutcome'], equals: 'SUBMITTING' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // A bounded, private support queue; never return source media.
        select: { id: true, status: true, createdAt: true, metadata: true },
      }),
    ])

    const summarize = (
      task: NonNullable<typeof recentTask>,
      requiresReconciliation: boolean,
    ) => {
      const metadata = task.metadata && typeof task.metadata === 'object' &&
        !Array.isArray(task.metadata)
        ? task.metadata as Record<string, unknown>
        : {}

      return {
        taskId: task.id,
        status: task.status,
        createdAt: task.createdAt,
        serviceType: typeof metadata.serviceType === 'string' ? metadata.serviceType : undefined,
        isAsync: metadata.isAsync === true,
        requiresReconciliation,
      }
    }

    return NextResponse.json([
      ...(recentTask ? [summarize(recentTask, false)] : []),
      ...olderUnconfirmed.map((task) => summarize(task, true)),
    ])

  } catch (error) {
    console.error("Pending Tasks API error:", error)
    logger.error('api', 'Pending Tasks API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { requireAuthWithUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { getRemainingQuotaCount } from '@/lib/quota'
import { toCompareTaskResponse } from '@/lib/compare-tryon'

export const dynamic = 'force-dynamic'

const RECOVERY_WINDOW_MS = 30 * 60 * 1000

function getMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== 'object') return undefined
  return (metadata as Record<string, unknown>)[key]
}

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user

    const recoveryCutoff = new Date(Date.now() - RECOVERY_WINDOW_MS)
    const pendingCompareTask = await prisma.tryOnTask.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.PROCESSING],
        },
        createdAt: {
          gt: recoveryCutoff,
        },
        metadata: {
          path: ['source'],
          equals: 'frame-compare',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        metadata: true,
      },
    })

    const batchId = getMetadataValue(pendingCompareTask?.metadata, 'batchId')
    if (typeof batchId !== 'string' || !batchId) {
      return NextResponse.json({ success: true, data: null })
    }

    const batchTasks = await prisma.tryOnTask.findMany({
      where: {
        userId: user.id,
        metadata: {
          path: ['batchId'],
          equals: batchId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        status: true,
        userImageUrl: true,
        resultImageUrl: true,
        errorMessage: true,
        createdAt: true,
        metadata: true,
      },
    })

    if (batchTasks.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }

    const startedAt = batchTasks.reduce((earliest, task) => {
      return task.createdAt < earliest ? task.createdAt : earliest
    }, batchTasks[0].createdAt)
    const batchSize = Number(getMetadataValue(batchTasks[0].metadata, 'batchSize')) || batchTasks.length
    const submissionStaggerMs = Number(getMetadataValue(batchTasks[0].metadata, 'submissionStaggerMs')) || null

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        requiredCredits: batchSize,
        creditsUsed: 0,
        remainingCreditsBefore: getRemainingQuotaCount(user),
        submissionStaggerMs,
        recovered: true,
        startedAt: startedAt.toISOString(),
        userImageUrl: batchTasks[0].userImageUrl,
        tasks: batchTasks.map(toCompareTaskResponse),
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare recovery failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

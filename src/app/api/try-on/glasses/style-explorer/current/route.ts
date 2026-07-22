import { NextRequest, NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { requireAuthWithUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { getRemainingQuotaCount } from '@/lib/quota'
import { toCompareTaskResponse } from '@/lib/compare-tryon'

export const dynamic = 'force-dynamic'
const RECOVERY_WINDOW_MS = 30 * 60 * 1000

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== 'object') return undefined
  return (metadata as Record<string, unknown>)[key]
}

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user

    const pending = await prisma.tryOnTask.findFirst({
      where: {
        userId: user.id,
        status: { in: [TaskStatus.PENDING, TaskStatus.PROCESSING] },
        createdAt: { gt: new Date(Date.now() - RECOVERY_WINDOW_MS) },
        metadata: { path: ['source'], equals: 'style-explorer' },
      },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true },
    })
    const batchId = metadataValue(pending?.metadata, 'batchId')
    if (typeof batchId !== 'string' || !batchId) {
      return NextResponse.json({ success: true, data: null })
    }

    const tasks = await prisma.tryOnTask.findMany({
      where: {
        userId: user.id,
        metadata: { path: ['batchId'], equals: batchId },
      },
      orderBy: { createdAt: 'asc' },
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
    if (!tasks.length) return NextResponse.json({ success: true, data: null })

    const firstMetadata = tasks[0].metadata
    return NextResponse.json({
      success: true,
      data: {
        batchId,
        requiredCredits: Number(metadataValue(firstMetadata, 'batchSize')) || tasks.length,
        remainingCreditsBefore: getRemainingQuotaCount(user),
        recovered: true,
        startedAt: tasks[0].createdAt.toISOString(),
        userImageUrl: tasks[0].userImageUrl,
        styleIntent: metadataValue(firstMetadata, 'styleIntent'),
        occasion: metadataValue(firstMetadata, 'occasion'),
        category: metadataValue(firstMetadata, 'category'),
        tasks: tasks.map(toCompareTaskResponse),
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Style Explorer recovery failed', err, ctx)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}

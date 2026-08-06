import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncPendingConsumerTryOnTasks } from '@/lib/cron/sync-pending-consumer-tasks'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: Consumer-only pending GrsAI sync + quota settlement (ADR-007).
 * Store work must never run in this entry point.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('cron', 'Unauthorized consumer sync cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await syncPendingConsumerTryOnTasks()

    return NextResponse.json({
      success: true,
      message: 'Consumer sync completed',
      stats,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('cron', 'Consumer sync pending tasks failed', error as Error, { duration })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 },
    )
  }
}

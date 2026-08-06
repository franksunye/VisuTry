import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncPendingConsumerTryOnTasks } from '@/lib/cron/sync-pending-consumer-tasks'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Legacy combined sync entry point.
 * Prefer dedicated Consumer / Store crons. This route still isolates failure
 * domains so a Store exception cannot abort Consumer processing (ADR-007).
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('cron', 'Unauthorized cron request attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('cron', 'Starting isolated Consumer + Store pending sync')

    let consumerStats: Awaited<ReturnType<typeof syncPendingConsumerTryOnTasks>> | null = null
    let storeStats: Awaited<
      ReturnType<
        typeof import('@/modules/store/infrastructure/cron/sync-pending-store-tasks').syncPendingStoreTryOnTasks
      >
    > | null = null
    let consumerError: string | null = null
    let storeError: string | null = null

    try {
      consumerStats = await syncPendingConsumerTryOnTasks()
    } catch (error) {
      consumerError = error instanceof Error ? error.message : String(error)
      logger.error(
        'cron',
        'Consumer sync failed in combined cron',
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    try {
      const { syncPendingStoreTryOnTasks } = await import(
        '@/modules/store/infrastructure/cron/sync-pending-store-tasks'
      )
      storeStats = await syncPendingStoreTryOnTasks()
    } catch (error) {
      storeError = error instanceof Error ? error.message : String(error)
      logger.error(
        'cron',
        'Store sync failed in combined cron',
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    const duration = Date.now() - startTime
    const success = Boolean(consumerStats) || Boolean(storeStats)

    return NextResponse.json(
      {
        success,
        message: 'Isolated sync completed',
        consumer: consumerStats,
        store: storeStats,
        consumerError,
        storeError,
        duration,
      },
      { status: success ? 200 : 500 },
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('cron', 'Sync pending tasks failed', error as Error, { duration })

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

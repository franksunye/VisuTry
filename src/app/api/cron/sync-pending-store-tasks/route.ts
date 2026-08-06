import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncPendingStoreTryOnTasks } from '@/modules/store/infrastructure/cron/sync-pending-store-tasks'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: Store-only pending GrsAI sync + usage settlement (ADR-007).
 * Isolated from Consumer polling and Consumer quota settlement.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('cron', 'Unauthorized store sync cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await syncPendingStoreTryOnTasks()

    return NextResponse.json({
      success: true,
      message: 'Store sync completed',
      stats,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('cron', 'Store sync pending tasks failed', error as Error, { duration })
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

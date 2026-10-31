import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncPendingStoreTryOnTasks } from '@/modules/store/infrastructure/cron/sync-pending-store-tasks'
import { withFunctionObservation } from '@/lib/function-observability'
import { isAuthorizedCronRequest } from '@/lib/cron/authorize'
import { recordCronRun } from '@/lib/cron/record-run'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: Store-only pending GrsAi/Kie sync + usage settlement (ADR-007).
 * Isolated from Consumer polling and Consumer quota settlement.
 */
async function getHandler(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!isAuthorizedCronRequest(request)) {
      logger.warn('cron', 'Unauthorized store sync cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await syncPendingStoreTryOnTasks()
    const success = !stats.errorMessages?.length
    recordCronRun('sync-pending-store-tasks', success ? 'success' : 'partial_failure', startTime)

    return NextResponse.json({
      success,
      message: 'Store sync completed',
      stats,
      duration: Date.now() - startTime,
    }, { status: success ? 200 : 500 })
  } catch (error) {
    recordCronRun('sync-pending-store-tasks', 'failed', startTime)
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

export const GET = withFunctionObservation('api.cron.sync_pending_store_tasks', 'system', getHandler)

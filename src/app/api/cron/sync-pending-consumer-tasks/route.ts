import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncPendingConsumerTryOnTasks } from '@/lib/cron/sync-pending-consumer-tasks'
import { withFunctionObservation } from '@/lib/function-observability'
import { isAuthorizedCronRequest } from '@/lib/cron/authorize'
import { recordCronRun } from '@/lib/cron/record-run'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: Consumer-only pending GrsAi/Kie sync + quota settlement (ADR-007).
 * Store work must never run in this entry point.
 */
async function getHandler(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!isAuthorizedCronRequest(request)) {
      logger.warn('cron', 'Unauthorized consumer sync cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await syncPendingConsumerTryOnTasks()
    // A terminal FAILED task is a valid reconciliation outcome; only
    // processing exceptions (errorMessages) signal an incomplete cron run.
    const success = !stats.errorMessages?.length
    recordCronRun('sync-pending-consumer-tasks', success ? 'success' : 'partial_failure', startTime)

    return NextResponse.json({
      success,
      message: 'Consumer sync completed',
      stats,
      duration: Date.now() - startTime,
    }, { status: success ? 200 : 500 })
  } catch (error) {
    recordCronRun('sync-pending-consumer-tasks', 'failed', startTime)
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

export const GET = withFunctionObservation('api.cron.sync_pending_consumer_tasks', 'system', getHandler)

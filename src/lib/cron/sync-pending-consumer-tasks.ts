/**
 * Consumer-only pending Try-On sync (ADR-007).
 * MUST NOT import Store modules — Store failure domains stay isolated.
 */

import { prisma } from '@/lib/prisma'
import { getTryOnResult } from '@/lib/tryon-service'
import { logger } from '@/lib/logger'
import { TaskStatus } from '@prisma/client'
import { settleTryOnTaskQuota } from '@/lib/quota'
import {
  reconcileStaleConsumerDispatch,
  STALE_CONSUMER_DISPATCH_MS,
} from '@/lib/generation/reconcile-stale-consumer-dispatch'

export type SyncPendingConsumerStats = {
  scope: 'consumer'
  total: number
  successful: number
  errors: number
  stalePendingFailed: number
  duration: number
  errorMessages?: string[]
}

const STALE_PENDING_BATCH_SIZE = 100

async function failStalePendingDispatches(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_CONSUMER_DISPATCH_MS)
  const candidates = await prisma.tryOnTask.findMany({
    where: {
      origin: 'CONSUMER',
      status: TaskStatus.PENDING,
      createdAt: { lte: cutoff },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
    orderBy: { createdAt: 'asc' },
    take: STALE_PENDING_BATCH_SIZE,
  })

  let failed = 0
  for (const task of candidates) {
    const reconciled = await reconcileStaleConsumerDispatch(
      { ...task, origin: 'CONSUMER', status: TaskStatus.PENDING },
      now,
      'cron',
    )
    if (reconciled) failed++
  }

  return failed
}

export async function syncPendingConsumerTryOnTasks(): Promise<SyncPendingConsumerStats> {
  const startTime = Date.now()
  const stalePendingFailed = await failStalePendingDispatches(new Date(startTime))

  const pendingTasks = await prisma.tryOnTask.findMany({
    where: {
      origin: 'CONSUMER',
      OR: [
        {
          status: TaskStatus.PROCESSING,
          metadata: {
            path: ['serviceType'],
            equals: 'grsai',
          },
        },
        {
          status: TaskStatus.COMPLETED,
          quotaSettledAt: null,
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      origin: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (pendingTasks.length === 0 && stalePendingFailed === 0) {
    logger.debug('cron', 'No pending consumer GrsAi tasks found')
    return {
      scope: 'consumer',
      total: 0,
      successful: 0,
      errors: 0,
      stalePendingFailed: 0,
      duration: Date.now() - startTime,
    }
  }

  logger.debug('cron', `Found ${pendingTasks.length} pending consumer GrsAi tasks`)

  let successCount = 0
  let errorCount = stalePendingFailed
  const errors: string[] = []

  const processTask = async (task: (typeof pendingTasks)[number]) => {
    try {
      logger.debug('cron', `Processing consumer task ${task.id}`)

      const result = await getTryOnResult(task.id)

      if (result.status === TaskStatus.COMPLETED) {
        if (task.userId) {
          const settlement = await settleTryOnTaskQuota(task.id, task.userId)
          successCount++
          if (result.isNewCompletion || settlement.settled) {
            logger.info('cron', `Consumer task ${task.id} completed successfully`, {
              isNewCompletion: result.isNewCompletion,
              quotaSettled: settlement.settled,
              quotaAlreadySettled: settlement.alreadySettled,
            })
          } else {
            logger.debug('cron', `Consumer task ${task.id} already settled`, {
              quotaAlreadySettled: settlement.alreadySettled,
            })
          }
        } else {
          successCount++
          logger.warn('cron', `Consumer task ${task.id} completed without userId`, {
            isNewCompletion: result.isNewCompletion,
          })
        }
      } else if (result.status === TaskStatus.FAILED) {
        errorCount++
        logger.warn('cron', `Consumer task ${task.id} failed`, { error: result.error })
      } else {
        logger.debug('cron', `Consumer task ${task.id} still processing`, {
          progress: result.progress,
        })
      }
    } catch (error) {
      errorCount++
      const errorMsg = `Task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      logger.error('cron', `Error processing consumer task ${task.id}`, error as Error)
    }
  }

  const CONCURRENCY = 5
  for (let i = 0; i < pendingTasks.length; i += CONCURRENCY) {
    const batch = pendingTasks.slice(i, i + CONCURRENCY)
    await Promise.allSettled(batch.map((task) => processTask(task)))
  }

  const duration = Date.now() - startTime
  if (successCount > 0 || errorCount > 0) {
    logger.info('cron', 'Sync pending consumer tasks completed', {
      total: pendingTasks.length + stalePendingFailed,
      successful: successCount,
      errors: errorCount,
      stalePendingFailed,
      duration,
    })
  } else {
    logger.debug('cron', 'Sync pending consumer tasks completed with no state changes', {
      total: pendingTasks.length + stalePendingFailed,
      duration,
    })
  }

  return {
    scope: 'consumer',
    total: pendingTasks.length + stalePendingFailed,
    successful: successCount,
    errors: errorCount,
    stalePendingFailed,
    duration,
    errorMessages: errors.length > 0 ? errors : undefined,
  }
}

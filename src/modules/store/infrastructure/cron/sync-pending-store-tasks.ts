/**
 * Store-only pending Try-On sync (ADR-007).
 * Isolated from Consumer polling and Consumer quota settlement.
 */

import { prisma } from '@/lib/prisma'
import { getTryOnResult } from '@/lib/tryon-service'
import { logger } from '@/lib/logger'
import { TaskStatus } from '@prisma/client'
import { createPrismaStoreUsageRepository } from '@/modules/store/infrastructure'
import { settleStoreTryOnUsage } from '@/modules/store/application/settle-store-usage'
import { reconcileStaleStoreClaims } from '@/modules/store/application/reconcile-stale-store-claims'
import { ensureStoreTryOnPersistRegistered } from '@/modules/store/infrastructure/generation/ensure-store-tryon-persist-registered'

export type SyncPendingStoreStats = {
  scope: 'store'
  total: number
  successful: number
  errors: number
  duration: number
  staleClaimsMarkedFailed: number
  errorMessages?: string[]
}

export async function syncPendingStoreTryOnTasks(): Promise<SyncPendingStoreStats> {
  const startTime = Date.now()
  ensureStoreTryOnPersistRegistered()

  let staleClaimsMarkedFailed = 0
  try {
    const staleClaims = await reconcileStaleStoreClaims({ limit: 50 })
    staleClaimsMarkedFailed = staleClaims.markedFailed
    if (staleClaims.markedFailed > 0) {
      logger.warn('cron', 'Reconciled stale Store claim placeholders', {
        scanned: staleClaims.scanned,
        markedFailed: staleClaims.markedFailed,
      })
    }
  } catch (error) {
    logger.error(
      'cron',
      'Stale Store claim reconcile failed; continuing Store sync',
      error instanceof Error ? error : new Error(String(error)),
    )
  }

  const pendingTasks = await prisma.tryOnTask.findMany({
    where: {
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
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
      origin: true,
      merchantId: true,
      merchantSessionId: true,
      createdAt: true,
      metadata: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (pendingTasks.length === 0) {
    logger.debug('cron', 'No pending store GrsAi tasks found')
    return {
      scope: 'store',
      total: 0,
      successful: 0,
      errors: 0,
      duration: Date.now() - startTime,
      staleClaimsMarkedFailed,
    }
  }

  logger.debug('cron', `Found ${pendingTasks.length} pending store GrsAi tasks`)

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  const processTask = async (task: (typeof pendingTasks)[number]) => {
    try {
      logger.debug('cron', `Processing store task ${task.id}`)

      const result = await getTryOnResult(task.id)

      if (result.status === TaskStatus.COMPLETED) {
        if (task.merchantId && task.merchantSessionId) {
          const usagePolicy =
            (task.metadata as Record<string, unknown> | null)?.usagePolicyKind === 'merchant_sponsored'
              ? { kind: 'merchant_sponsored' as const, merchantId: task.merchantId }
              : task.origin === 'STORE_PILOT'
                ? { kind: 'merchant_allowance' as const, merchantId: task.merchantId }
                : { kind: 'store_demo_allowance' as const, merchantId: task.merchantId }
          const settlement = await settleStoreTryOnUsage({
            taskId: task.id,
            merchantId: task.merchantId,
            merchantSessionId: task.merchantSessionId,
            usagePolicy,
            usage: createPrismaStoreUsageRepository(),
          })
          successCount++
          if (result.isNewCompletion || settlement.settled) {
            logger.info('cron', `Store task ${task.id} completed successfully`, {
              isNewCompletion: result.isNewCompletion,
              origin: task.origin,
              quotaSettled: settlement.settled,
              quotaAlreadySettled: settlement.alreadySettled,
            })
          } else {
            logger.debug('cron', `Store task ${task.id} already settled`, {
              origin: task.origin,
              quotaAlreadySettled: settlement.alreadySettled,
            })
          }
        } else {
          successCount++
          logger.warn('cron', `Store task ${task.id} completed without settlement context`, {
            isNewCompletion: result.isNewCompletion,
            origin: task.origin,
          })
        }
      } else if (result.status === TaskStatus.FAILED) {
        errorCount++
        logger.warn('cron', `Store task ${task.id} failed`, { error: result.error })
      } else {
        logger.debug('cron', `Store task ${task.id} still processing`, {
          progress: result.progress,
        })
      }
    } catch (error) {
      errorCount++
      const errorMsg = `Task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      logger.error('cron', `Error processing store task ${task.id}`, error as Error)
    }
  }

  const CONCURRENCY = 5
  for (let i = 0; i < pendingTasks.length; i += CONCURRENCY) {
    const batch = pendingTasks.slice(i, i + CONCURRENCY)
    await Promise.allSettled(batch.map((task) => processTask(task)))
  }

  const duration = Date.now() - startTime
  if (successCount > 0 || errorCount > 0 || staleClaimsMarkedFailed > 0) {
    logger.info('cron', 'Sync pending store tasks completed', {
      total: pendingTasks.length,
      successful: successCount,
      errors: errorCount,
      staleClaimsMarkedFailed,
      duration,
    })
  } else {
    logger.debug('cron', 'Sync pending store tasks completed with no state changes', {
      total: pendingTasks.length,
      duration,
    })
  }

  return {
    scope: 'store',
    total: pendingTasks.length,
    successful: successCount,
    errors: errorCount,
    duration,
    staleClaimsMarkedFailed,
    errorMessages: errors.length > 0 ? errors : undefined,
  }
}

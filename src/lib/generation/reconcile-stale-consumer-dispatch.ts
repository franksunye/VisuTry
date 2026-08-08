import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const STALE_CONSUMER_DISPATCH_MS = 2 * 60 * 1000
export const STALE_CONSUMER_DISPATCH_ERROR =
  'Provider submission was interrupted before an external task ID was saved. Please retry.'

type ConsumerDispatchCandidate = {
  id: string
  origin: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  metadata: unknown
}

export async function reconcileStaleConsumerDispatch(
  task: ConsumerDispatchCandidate,
  now: Date,
  source: 'poll' | 'cron',
): Promise<boolean> {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const cutoff = new Date(now.getTime() - STALE_CONSUMER_DISPATCH_MS)

  if (
    task.origin !== 'CONSUMER' ||
    task.status !== TaskStatus.PENDING ||
    task.createdAt > cutoff ||
    metadata.serviceType !== 'grsai' ||
    metadata.externalTaskId
  ) {
    return false
  }

  // updatedAt is a concurrency fence: a live dispatch that saves an external
  // ID between the read and this update wins, and reconciliation skips it.
  const result = await prisma.tryOnTask.updateMany({
    where: {
      id: task.id,
      origin: 'CONSUMER',
      status: TaskStatus.PENDING,
      updatedAt: task.updatedAt,
      createdAt: { lte: cutoff },
    },
    data: {
      status: TaskStatus.FAILED,
      errorMessage: STALE_CONSUMER_DISPATCH_ERROR,
      metadata: {
        ...metadata,
        dispatchReconciledAt: now.toISOString(),
        dispatchReconcileReason: 'missing_external_task_id',
      },
    },
  })

  if (result.count !== 1) return false

  logger.warn(source === 'cron' ? 'cron' : 'tryon-service', 'Marked stale Consumer dispatch as failed', {
    taskId: task.id,
    source,
    createdAt: task.createdAt,
    staleForMs: now.getTime() - task.createdAt.getTime(),
  })
  return true
}

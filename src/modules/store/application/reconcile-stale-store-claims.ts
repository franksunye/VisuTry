/**
 * Mark Store claim placeholders that never dispatched as FAILED.
 * Covers process crash after Serializable claim / lease expiry with no takeover.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { TaskStatus } from '@prisma/client'

export type ReconcileStaleStoreClaimsResult = {
  scanned: number
  markedFailed: number
  taskIds: string[]
}

export async function reconcileStaleStoreClaims(input?: {
  now?: Date
  limit?: number
}): Promise<ReconcileStaleStoreClaimsResult> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? 50
  const result: ReconcileStaleStoreClaimsResult = {
    scanned: 0,
    markedFailed: 0,
    taskIds: [],
  }

  const candidates = await prisma.tryOnTask.findMany({
    where: {
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: TaskStatus.PENDING,
      userImageUrl: { startsWith: 'pending:' },
      OR: [{ dispatchLeaseUntil: null }, { dispatchLeaseUntil: { lte: now } }],
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      metadata: true,
      createdAt: true,
      dispatchLeaseOwner: true,
      dispatchVersion: true,
    },
  })

  result.scanned = candidates.length

  for (const task of candidates) {
    const metadata = (task.metadata ?? {}) as Record<string, unknown>
    if (
      typeof metadata.externalTaskId === 'string' &&
      metadata.externalTaskId.length > 0
    ) {
      continue
    }
    const updated = await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        status: TaskStatus.PENDING,
        userImageUrl: { startsWith: 'pending:' },
        dispatchLeaseOwner: task.dispatchLeaseOwner,
        dispatchVersion: task.dispatchVersion,
        OR: [{ dispatchLeaseUntil: null }, { dispatchLeaseUntil: { lte: now } }],
      },
      data: {
        status: TaskStatus.FAILED,
        errorMessage: 'Store try-on claim expired before provider dispatch.',
        dispatchLeaseUntil: null,
        metadata: {
          ...metadata,
          staleClaimReconciledAt: now.toISOString(),
          claimFailedAt: now.toISOString(),
          claimFailureReason: 'stale_placeholder_reconcile',
        },
      },
    })

    if (updated.count > 0) {
      result.markedFailed += 1
      result.taskIds.push(task.id)
      logger.warn('api', 'Reconciled stale Store try-on placeholder', {
        taskId: task.id,
      })
    }
  }

  return result
}

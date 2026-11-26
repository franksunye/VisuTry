/**
 * Blob-first TryOnTask retention cleanup shared by Store and Consumer.
 * Never deletes DB URL state before Blob deletion succeeds or is confirmed missing.
 *
 * Lives in shared core (ADR-007): Consumer must not depend on modules/store for retention.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { isMockMode } from '@/lib/mocks'
import { resolveTryOnBlobAccessMode } from '@/lib/tryon-blob-access'
import { deleteOwnedBlob, retentionDeleteErrorMessage } from './blob-delete'
import {
  retentionBackoffMs,
  shouldMarkDeleteBlocked,
} from './backoff'
import { collectTryOnRetentionDeleteTargets } from './tryon-retention-targets'
import type { Prisma, TryOnOrigin } from '@prisma/client'
import { pinnedTryOnResultStorage, r2Key, r2TryOnResultReference } from '@/lib/consumer-media-reference'
import { deleteR2Media } from '@/lib/consumer-r2-media'
import { trackConsumerMedia } from '@/lib/consumer-media-staging'
import { queueDeletionNotice } from './deletion-notices'

export type CleanupExpiredTryOnTasksResult = {
  scanned: number
  deleted: number
  failed: number
  blockedRetried: number
  deletedTaskIds: string[]
  deletedUserIds: string[]
}

export type CleanupExpiredTryOnTasksInput = {
  now?: Date
  limit?: number
  maxRounds?: number
  /** When set, only tasks with these origins are processed (failure-domain isolation). */
  origins?: TryOnOrigin[]
  notify?: boolean
}

type TryOnDeletionTask = {
  id: string
  userId?: string | null
  origin?: TryOnOrigin
  userImageUrl: string
  itemImageUrl: string
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
  resultPersistLeaseUntil?: Date | null
  metadata?: unknown
}

/** A fenced result writer is still active. Cron retries after its lease. */
class TryOnDeletionPending extends Error {}

export async function deleteTryOnBlobFirst(task: TryOnDeletionTask, notifyAt?: Date): Promise<number> {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const deletionFields = [
    [task.userImageUrl, 'user'],
    [task.itemImageUrl, 'item'],
    [task.glassesImageUrl, 'item'],
    [task.resultImageUrl, 'result'],
  ] as const
  const r2Targets = new Set<string>()
  for (const [reference, kind] of deletionFields) {
    if (reference && r2Key(reference, kind)) r2Targets.add(reference)
  }
  const r2Result = pinnedTryOnResultStorage(metadata) === 'r2' ? r2TryOnResultReference(task.id) : null
  if (r2Result) {
    if (task.resultPersistLeaseUntil && task.resultPersistLeaseUntil.getTime() > Date.now()) {
      throw new TryOnDeletionPending()
    }
    r2Targets.add(r2Result)
  }

  const blobTargets = collectTryOnRetentionDeleteTargets({
    ...task,
    metadata: r2Result ? { ...metadata, resultPathname: null } : metadata,
  })
  if (!isMockMode) {
    if (r2Result && !task.resultImageUrl) {
      // An aborted PUT can commit after the lease. Keep a delayed idempotent
      // delete even after removing the task, now that publication is fenced.
      await trackConsumerMedia([r2Result])
    }
    for (const target of r2Targets) await deleteR2Media(target)
    for (const target of blobTargets) await deleteOwnedBlob(target, resolveTryOnBlobAccessMode())
  }

  const remove = async (db: Prisma.TransactionClient) => {
    await db.tryOnTask.delete({ where: { id: task.id } })
    if (notifyAt && task.userId) await queueDeletionNotice(db, task.userId, notifyAt)
  }
  if (notifyAt && task.userId) await prisma.$transaction(remove)
  else await remove(prisma)
  return r2Targets.size + blobTargets.length
}

export async function requestTryOnDeletion(task: TryOnDeletionTask): Promise<number | null> {
  const now = new Date()
  await prisma.tryOnTask.updateMany({
    where: { id: task.id, origin: 'CONSUMER', retentionStatus: 'ACTIVE' },
    data: { retentionStatus: 'PENDING_DELETE', expiresAt: now },
  })
  const current = await prisma.tryOnTask.findUnique({ where: { id: task.id } })
  if (!current) return 0
  try {
    return await deleteTryOnBlobFirst(current)
  } catch (error) {
    if (error instanceof TryOnDeletionPending) return null
    throw error
  }
}

export async function cleanupExpiredTryOnTasks(
  input?: CleanupExpiredTryOnTasksInput,
): Promise<CleanupExpiredTryOnTasksResult> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? 100
  const maxRounds = input?.maxRounds ?? 5
  const origins = input?.origins
  const result: CleanupExpiredTryOnTasksResult = {
    scanned: 0,
    deleted: 0,
    failed: 0,
    blockedRetried: 0,
    deletedTaskIds: [],
    deletedUserIds: [],
  }

  const processBatch = async (includeBlocked: boolean) => {
    const backoff = retentionBackoffMs(includeBlocked ? 'blocked_slow' : 'active_or_pending')
    const backoffBefore = new Date(now.getTime() - backoff)

    const tasks = await prisma.tryOnTask.findMany({
      where: {
        ...(origins && origins.length > 0 ? { origin: { in: origins } } : {}),
        expiresAt: { lte: now },
        retentionStatus: includeBlocked
          ? 'DELETE_BLOCKED'
          : { in: ['ACTIVE', 'PENDING_DELETE'] },
        OR: [
          { lastDeleteAttemptAt: null },
          { lastDeleteAttemptAt: { lte: backoffBefore } },
        ],
      },
      take: limit,
      orderBy: [{ expiresAt: 'asc' }, { lastDeleteAttemptAt: 'asc' }],
      select: {
        id: true,
        userId: true,
        origin: true,
        resultPersistLeaseUntil: true,
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
        deleteFailCount: true,
        retentionStatus: true,
        metadata: true,
      },
    })

    if (includeBlocked) result.blockedRetried += tasks.length
    else result.scanned += tasks.length

    for (const task of tasks) {
      const attemptedAt = new Date()
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: {
          retentionStatus:
            task.retentionStatus === 'DELETE_BLOCKED' ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
          lastDeleteAttemptAt: attemptedAt,
        },
      })

      let blobOk = true
      let lastError: string | undefined

      try {
        // Re-read after fencing to include a concurrent result that won before
        // the retention transition. Store cleanup retains its existing flow.
        const current = task.origin === 'CONSUMER'
          ? await prisma.tryOnTask.findUnique({ where: { id: task.id } })
          : task
        if (!current) continue
        await deleteTryOnBlobFirst(current, input?.notify ? now : undefined)
      } catch (error) {
        if (error instanceof TryOnDeletionPending) continue
        blobOk = false
        lastError = retentionDeleteErrorMessage(error)
      }

      if (!blobOk) {
        const nextFail = task.deleteFailCount + 1
        const blocked = shouldMarkDeleteBlocked(nextFail)
        await prisma.tryOnTask.update({
          where: { id: task.id },
          data: {
            deleteFailCount: nextFail,
            lastDeleteError: lastError,
            lastDeleteAttemptAt: attemptedAt,
            retentionStatus: blocked ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
          },
        })
        result.failed += 1
        if (blocked) {
          logger.warn('api', 'TryOnTask retention entered DELETE_BLOCKED', {
            taskId: task.id,
            failCount: nextFail,
            error: lastError,
          })
        }
        continue
      }

      result.deleted += 1
      result.deletedTaskIds.push(task.id)
      if (task.userId) result.deletedUserIds.push(task.userId)
    }

    return tasks.length
  }

  for (let round = 0; round < maxRounds; round++) {
    const n = await processBatch(false)
    if (n === 0) break
  }
  await processBatch(true)

  return result
}

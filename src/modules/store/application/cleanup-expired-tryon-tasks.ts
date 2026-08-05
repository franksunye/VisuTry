/**
 * Blob-first TryOnTask retention cleanup shared by Store and Consumer.
 * Never deletes DB URL state before Blob deletion succeeds or is confirmed missing.
 */

import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { isMockMode } from '@/lib/mocks'
import {
  retentionBackoffMs,
  shouldMarkDeleteBlocked,
} from '../domain/retention'
import { collectTryOnRetentionDeleteTargets } from './store-retention-targets'

function isBlobNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'BlobNotFoundError' ||
    message.includes('not found') ||
    message.includes('404')
  )
}

export type CleanupExpiredTryOnTasksResult = {
  scanned: number
  deleted: number
  failed: number
  blockedRetried: number
  deletedTaskIds: string[]
  deletedUserIds: string[]
}

export async function cleanupExpiredTryOnTasks(input?: {
  now?: Date
  limit?: number
  maxRounds?: number
}): Promise<CleanupExpiredTryOnTasksResult> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? 100
  const maxRounds = input?.maxRounds ?? 5
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

      const metadata = (task.metadata ?? {}) as Record<string, unknown>
      const targets = collectTryOnRetentionDeleteTargets({
        userImageUrl: task.userImageUrl,
        itemImageUrl: task.itemImageUrl,
        glassesImageUrl: task.glassesImageUrl,
        resultImageUrl: task.resultImageUrl,
        metadata,
      })
      let blobOk = true
      let lastError: string | undefined

      if (!isMockMode) {
        for (const target of targets) {
          try {
            await del(target)
          } catch (error) {
            if (!isBlobNotFoundError(error)) {
              blobOk = false
              lastError =
                error instanceof Error ? error.message.slice(0, 500) : 'blob_delete_failed'
              break
            }
          }
        }
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

      await prisma.tryOnTask.delete({ where: { id: task.id } })
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

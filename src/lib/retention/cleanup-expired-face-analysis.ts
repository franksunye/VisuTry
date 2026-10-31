/** Blob-first retention for FaceAnalysisTask, including historical public photos. */
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { isMockMode } from '@/lib/mocks'
import { resolveFaceAnalysisBlobAccessMode } from '@/lib/face-analysis-blob-access'
import { retentionBackoffMs, shouldMarkDeleteBlocked } from './backoff'
import { deleteOwnedBlob, retentionDeleteErrorMessage } from './blob-delete'
import { isOwnedBlobReference } from './blob-reference'

type FaceTask = {
  id: string
  userId: string
  userImageUrl: string
  metadata: unknown
}

/** Throws on unknown nonempty URLs: never lose the only durable Blob reference. */
export async function deleteFaceAnalysisBlobFirst(task: FaceTask): Promise<number> {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const pathname = typeof metadata.blobPathname === 'string' ? metadata.blobPathname : null
  const target = isOwnedBlobReference(task.userImageUrl, 'face-analysis/')
    ? task.userImageUrl
    : isOwnedBlobReference(pathname, 'face-analysis/') ? pathname : null
  if (task.userImageUrl && !target) throw new Error('Unrecognized Face Analysis media; refusing record deletion')

  const access = metadata.blobAccess === 'public' || metadata.blobAccess === 'private'
    ? metadata.blobAccess
    : resolveFaceAnalysisBlobAccessMode()
  if (target && !isMockMode) await deleteOwnedBlob(target, access)
  await prisma.faceAnalysisTask.delete({ where: { id: task.id } })
  return target ? 1 : 0
}

export type CleanupExpiredFaceAnalysisResult = {
  scanned: number
  deleted: number
  failed: number
  blockedRetried: number
  deletedUserIds: string[]
}

export async function cleanupExpiredFaceAnalysis(input?: {
  now?: Date
  limit?: number
  maxRounds?: number
}): Promise<CleanupExpiredFaceAnalysisResult> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? 100
  const maxRounds = input?.maxRounds ?? 3
  const result: CleanupExpiredFaceAnalysisResult = {
    scanned: 0, deleted: 0, failed: 0, blockedRetried: 0, deletedUserIds: [],
  }

  const processBatch = async (includeBlocked: boolean) => {
    const backoffBefore = new Date(now.getTime() - retentionBackoffMs(includeBlocked ? 'blocked_slow' : 'active_or_pending'))
    const tasks = await prisma.faceAnalysisTask.findMany({
      where: {
        expiresAt: { lte: now },
        retentionStatus: includeBlocked ? 'DELETE_BLOCKED' : { in: ['ACTIVE', 'PENDING_DELETE'] },
        OR: [{ lastDeleteAttemptAt: null }, { lastDeleteAttemptAt: { lte: backoffBefore } }],
      },
      orderBy: [{ expiresAt: 'asc' }, { lastDeleteAttemptAt: 'asc' }],
      take: limit,
      select: {
        id: true, userId: true, userImageUrl: true, metadata: true,
        deleteFailCount: true, retentionStatus: true,
      },
    })
    if (includeBlocked) result.blockedRetried += tasks.length
    else result.scanned += tasks.length

    for (const task of tasks) {
      const attemptedAt = new Date()
      await prisma.faceAnalysisTask.update({
        where: { id: task.id },
        data: {
          retentionStatus: task.retentionStatus === 'DELETE_BLOCKED' ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
          lastDeleteAttemptAt: attemptedAt,
        },
      })
      try {
        await deleteFaceAnalysisBlobFirst(task)
        result.deleted++
        result.deletedUserIds.push(task.userId)
      } catch (error) {
        const failCount = task.deleteFailCount + 1
        const blocked = shouldMarkDeleteBlocked(failCount)
        const message = retentionDeleteErrorMessage(error)
        await prisma.faceAnalysisTask.update({
          where: { id: task.id },
          data: {
            retentionStatus: blocked ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
            deleteFailCount: failCount,
            lastDeleteAttemptAt: attemptedAt,
            lastDeleteError: message,
          },
        })
        result.failed++
        if (blocked) logger.warn('api', 'FaceAnalysisTask retention entered DELETE_BLOCKED', {
          taskId: task.id, failCount, error: message,
        })
      }
    }
    return tasks.length
  }

  for (let round = 0; round < maxRounds; round++) {
    if (await processBatch(false) === 0) break
  }
  await processBatch(true)
  return result
}

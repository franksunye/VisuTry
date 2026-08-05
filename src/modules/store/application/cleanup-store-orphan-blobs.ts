/**
 * Reconcile orphan Blobs recorded after failed claim/upload races.
 */

import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { isMockMode } from '@/lib/mocks'
import {
  retentionBackoffMs,
  shouldMarkDeleteBlocked,
} from '../domain/retention'

function isBlobNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'BlobNotFoundError' ||
    message.includes('not found') ||
    message.includes('404')
  )
}

export async function recordStoreOrphanBlob(input: {
  url: string
  pathname?: string | null
  merchantId?: string | null
  tryOnTaskId?: string | null
  error?: string | null
}): Promise<void> {
  if (!input.url || input.url.startsWith('pending:')) return
  try {
    await prisma.storeOrphanBlob.upsert({
      where: { url: input.url },
      create: {
        url: input.url,
        pathname: input.pathname ?? null,
        merchantId: input.merchantId ?? null,
        tryOnTaskId: input.tryOnTaskId ?? null,
        lastError: input.error ?? null,
      },
      update: {
        lastError: input.error ?? null,
        merchantId: input.merchantId ?? undefined,
        tryOnTaskId: input.tryOnTaskId ?? undefined,
      },
    })
  } catch {
    // best-effort ledger
  }
}

export async function cleanupStoreOrphanBlobs(input?: {
  now?: Date
  limit?: number
}): Promise<{ scanned: number; deleted: number; failed: number }> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? 100
  const backoffBefore = new Date(now.getTime() - retentionBackoffMs('active_or_pending'))

  const rows = await prisma.storeOrphanBlob.findMany({
    where: {
      deletedAt: null,
      OR: [
        { lastDeleteAttemptAt: null },
        { lastDeleteAttemptAt: { lte: backoffBefore } },
      ],
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  let deleted = 0
  let failed = 0

  for (const row of rows) {
    const attemptedAt = new Date()
    if (!isMockMode) {
      try {
        await del(row.pathname || row.url)
      } catch (error) {
        if (!isBlobNotFoundError(error)) {
          const message =
            error instanceof Error ? error.message.slice(0, 500) : 'blob_delete_failed'
          const nextFail = row.failCount + 1
          await prisma.storeOrphanBlob.update({
            where: { id: row.id },
            data: {
              failCount: nextFail,
              lastError: message,
              lastDeleteAttemptAt: attemptedAt,
            },
          })
          failed += 1
          if (shouldMarkDeleteBlocked(nextFail)) {
            // keep retrying forever; failCount only affects backoff observability
          }
          continue
        }
      }
    }

    await prisma.storeOrphanBlob.update({
      where: { id: row.id },
      data: { deletedAt: attemptedAt, lastDeleteAttemptAt: attemptedAt, lastError: null },
    })
    deleted += 1
  }

  return { scanned: rows.length, deleted, failed }
}

/**
 * Vercel Blob adapter for Store assets — physically private objects.
 * Shopper delivery is capability-authenticated; provider URL is not authorization.
 * Private put fails closed (no silent public fallback).
 */

import { del, get, put } from '@vercel/blob'
import type { StoreAsset } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isMockMode } from '@/lib/mocks'
import { mockBlobUpload } from '@/lib/mocks/blob'
import type {
  AssetStore,
  DeleteStoreAssetResult,
  ListExpiredAssetsOptions,
  PutStoreAssetInput,
  StoreAssetBytes,
} from '../../application/ports/asset-store'
import type { StoreAssetRecord } from '../../application/ports/repositories'
import type { StoreAssetAccessMode, StoreAssetPurpose } from '../../domain/enums'
import {
  RETENTION_SOFT_FAIL_CAP,
  retentionBackoffMs,
  shouldMarkDeleteBlocked,
  type RetentionSelectMode,
} from '../../domain/retention'
import { merchantInactive, sessionUnauthorized, StoreDomainError } from '../../domain/errors'

function mapAsset(row: StoreAsset): StoreAssetRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    merchantSessionId: row.merchantSessionId,
    ownerType: row.ownerType,
    ownerId: row.ownerId,
    purpose: row.purpose as StoreAssetPurpose,
    storageKey: row.storageKey,
    accessMode: row.accessMode as StoreAssetAccessMode,
    providerUrl: row.providerUrl,
    expiresAt: row.expiresAt,
    deletedAt: row.deletedAt,
    retentionStatus: row.retentionStatus,
    deleteFailCount: row.deleteFailCount,
    lastDeleteError: row.lastDeleteError,
    lastDeleteAttemptAt: row.lastDeleteAttemptAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function controlledDeliveryUrl(assetId: string): string {
  return `/api/store/sessions/assets/${assetId}`
}

function isBlobNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'BlobNotFoundError' ||
    message.includes('not found') ||
    message.includes('404')
  )
}

async function readPrivateOrPublicBytes(
  storageKey: string,
  providerUrl: string | null,
  accessMode: StoreAssetAccessMode,
): Promise<StoreAssetBytes> {
  if (isMockMode) {
    if (!providerUrl) throw new Error('Mock asset missing providerUrl')
    const response = await fetch(providerUrl)
    if (!response.ok) throw new Error(`Failed to read mock asset (${response.status})`)
    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      storageKey,
    }
  }

  if (accessMode === 'PRIVATE_SIGNED') {
    const result = await get(storageKey, { access: 'private' })
    if (!result?.stream) {
      throw new Error('Private store asset not found')
    }
    const reader = result.stream.getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return {
      body: Buffer.concat(chunks.map((c) => Buffer.from(c))),
      contentType: result.blob.contentType || 'application/octet-stream',
      storageKey,
    }
  }

  if (!providerUrl) throw new Error('Asset missing providerUrl')
  const response = await fetch(providerUrl)
  if (!response.ok) throw new Error(`Failed to read store asset (${response.status})`)
  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    storageKey,
  }
}

export function createVercelBlobAssetStore(): AssetStore {
  return {
    async put(input: PutStoreAssetInput) {
      let providerUrl: string
      if (isMockMode) {
        const blob = await mockBlobUpload(input.storageKey, input.body as File)
        providerUrl = blob.url
      } else if (input.accessMode === 'PRIVATE_SIGNED') {
        try {
          const blob = await put(input.storageKey, input.body, {
            access: 'private',
            contentType: input.contentType,
          })
          providerUrl = blob.url
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Private blob upload failed'
          throw new StoreDomainError(
            'INTERNAL_ERROR',
            'Private object storage is required for Store photos. Upload aborted.',
            503,
            message,
          )
        }
      } else {
        const blob = await put(input.storageKey, input.body, {
          access: 'public',
          contentType: input.contentType,
        })
        providerUrl = blob.url
      }

      const row = await prisma.storeAsset.create({
        data: {
          merchantId: input.merchantId,
          merchantSessionId: input.merchantSessionId ?? null,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          purpose: input.purpose,
          storageKey: input.storageKey,
          accessMode: input.accessMode,
          providerUrl,
          expiresAt: input.expiresAt,
          retentionStatus: 'ACTIVE',
        },
      })

      const asset = mapAsset(row)
      const deliveryUrl = controlledDeliveryUrl(asset.id)
      return { asset, deliveryUrl }
    },

    async getProviderDeliveryUrl(assetId, merchantId) {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId, deletedAt: null, retentionStatus: { not: 'DELETED' } },
      })
      return row?.providerUrl ?? null
    },

    async getBytes(assetId, merchantId): Promise<StoreAssetBytes | null> {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId, deletedAt: null, retentionStatus: { not: 'DELETED' } },
      })
      if (!row) return null
      return readPrivateOrPublicBytes(
        row.storageKey,
        row.providerUrl,
        row.accessMode as StoreAssetAccessMode,
      )
    },

    async delete(assetId, merchantId): Promise<DeleteStoreAssetResult> {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId },
      })
      if (!row) {
        return { deleted: false, retryable: false, error: 'not_found' }
      }
      if (row.deletedAt || row.retentionStatus === 'DELETED') {
        return { deleted: true, retryable: false }
      }

      const attemptedAt = new Date()
      await prisma.storeAsset.updateMany({
        where: { id: assetId, merchantId, deletedAt: null },
        data: {
          retentionStatus:
            row.retentionStatus === 'DELETE_BLOCKED' ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
          lastDeleteAttemptAt: attemptedAt,
        },
      })

      if (row.providerUrl && !isMockMode) {
        try {
          await del(row.accessMode === 'PRIVATE_SIGNED' ? row.storageKey : row.providerUrl)
        } catch (error) {
          if (!isBlobNotFoundError(error)) {
            const message =
              error instanceof Error ? error.message.slice(0, 500) : 'blob_delete_failed'
            const nextFail = row.deleteFailCount + 1
            const blocked = shouldMarkDeleteBlocked(nextFail)
            await prisma.storeAsset.updateMany({
              where: { id: assetId, merchantId, deletedAt: null },
              data: {
                deleteFailCount: nextFail,
                lastDeleteError: message,
                lastDeleteAttemptAt: attemptedAt,
                retentionStatus: blocked ? 'DELETE_BLOCKED' : 'PENDING_DELETE',
              },
            })
            return { deleted: false, retryable: true, error: message }
          }
        }
      }

      await prisma.storeAsset.updateMany({
        where: { id: assetId, merchantId, deletedAt: null },
        data: {
          deletedAt: attemptedAt,
          retentionStatus: 'DELETED',
          lastDeleteError: null,
          lastDeleteAttemptAt: attemptedAt,
        },
      })

      return { deleted: true, retryable: false }
    },

    async assertAccess(input) {
      const row = await prisma.storeAsset.findFirst({
        where: {
          id: input.assetId,
          merchantId: input.merchantId,
          deletedAt: null,
          retentionStatus: { not: 'DELETED' },
        },
      })
      if (!row) throw sessionUnauthorized()

      if (
        input.merchantSessionId &&
        row.merchantSessionId &&
        row.merchantSessionId !== input.merchantSessionId
      ) {
        throw sessionUnauthorized()
      }

      if (row.expiresAt.getTime() <= Date.now()) {
        throw merchantInactive()
      }

      return mapAsset(row)
    },

    async listExpired(now, limit = 100, options?: ListExpiredAssetsOptions) {
      const mode: RetentionSelectMode = options?.includeBlocked
        ? 'blocked_slow'
        : 'active_or_pending'
      const backoffMs = options?.backoffMs ?? retentionBackoffMs(mode)
      const backoffBefore = new Date(now.getTime() - backoffMs)

      const rows = await prisma.storeAsset.findMany({
        where:
          mode === 'blocked_slow'
            ? {
                expiresAt: { lte: now },
                deletedAt: null,
                retentionStatus: 'DELETE_BLOCKED',
                OR: [
                  { lastDeleteAttemptAt: null },
                  { lastDeleteAttemptAt: { lte: backoffBefore } },
                ],
              }
            : {
                expiresAt: { lte: now },
                deletedAt: null,
                retentionStatus: { in: ['ACTIVE', 'PENDING_DELETE'] },
                OR: [
                  { lastDeleteAttemptAt: null },
                  { lastDeleteAttemptAt: { lte: backoffBefore } },
                ],
              },
        take: limit,
        orderBy: [{ expiresAt: 'asc' }, { lastDeleteAttemptAt: 'asc' }],
      })
      return rows.map(mapAsset)
    },
  }
}

export { RETENTION_SOFT_FAIL_CAP }

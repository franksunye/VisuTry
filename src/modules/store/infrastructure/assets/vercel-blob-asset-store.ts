/**
 * Vercel Blob adapter for Store assets.
 *
 * Shopper-facing delivery uses capability-authenticated app routes.
 * Provider URLs must never be treated as authorization.
 */

import { del, put } from '@vercel/blob'
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
import { merchantInactive, sessionUnauthorized } from '../../domain/errors'

const DEFAULT_MAX_DELETE_FAILS = 10
const DEFAULT_DELETE_BACKOFF_MS = 15 * 60 * 1000

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

async function fetchProviderBytes(
  providerUrl: string,
  storageKey: string,
): Promise<StoreAssetBytes> {
  const response = await fetch(providerUrl)
  if (!response.ok) {
    throw new Error(`Failed to read store asset (${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return {
    body: Buffer.from(arrayBuffer),
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
      } else {
        // Current @vercel/blob 1.x store is public-read; we still never treat the URL as auth.
        // Shopper delivery goes through controlledDeliveryUrl only.
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
        },
      })

      const asset = mapAsset(row)
      const deliveryUrl =
        input.accessMode === 'PRIVATE_SIGNED' || input.accessMode === 'PUBLIC_TEMPORARY'
          ? controlledDeliveryUrl(asset.id)
          : providerUrl

      return { asset, deliveryUrl }
    },

    async getProviderDeliveryUrl(assetId, merchantId) {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId, deletedAt: null },
      })
      return row?.providerUrl ?? null
    },

    async getBytes(assetId, merchantId): Promise<StoreAssetBytes | null> {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId, deletedAt: null },
      })
      if (!row?.providerUrl) return null
      return fetchProviderBytes(row.providerUrl, row.storageKey)
    },

    async delete(assetId, merchantId): Promise<DeleteStoreAssetResult> {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId },
      })
      if (!row) {
        return { deleted: false, retryable: false, error: 'not_found' }
      }
      if (row.deletedAt) {
        return { deleted: true, retryable: false }
      }

      const attemptedAt = new Date()

      if (row.providerUrl && !isMockMode) {
        try {
          await del(row.providerUrl)
        } catch (error) {
          if (!isBlobNotFoundError(error)) {
            const message =
              error instanceof Error ? error.message.slice(0, 500) : 'blob_delete_failed'
            await prisma.storeAsset.updateMany({
              where: { id: assetId, merchantId, deletedAt: null },
              data: {
                deleteFailCount: { increment: 1 },
                lastDeleteError: message,
                lastDeleteAttemptAt: attemptedAt,
              },
            })
            return { deleted: false, retryable: true, error: message }
          }
          // Blob already gone — safe to soft-delete the row.
        }
      }

      await prisma.storeAsset.updateMany({
        where: { id: assetId, merchantId, deletedAt: null },
        data: {
          deletedAt: attemptedAt,
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
      const maxFailCount = options?.maxFailCount ?? DEFAULT_MAX_DELETE_FAILS
      const backoffMs = options?.backoffMs ?? DEFAULT_DELETE_BACKOFF_MS
      const backoffBefore = new Date(now.getTime() - backoffMs)

      const rows = await prisma.storeAsset.findMany({
        where: {
          expiresAt: { lte: now },
          deletedAt: null,
          deleteFailCount: { lt: maxFailCount },
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

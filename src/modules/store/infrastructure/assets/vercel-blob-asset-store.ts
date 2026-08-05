/**
 * Vercel Blob adapter for Store assets.
 *
 * D0 limitation: Blob uploads may still use publicly addressable URLs.
 * Permanent public URLs MUST NOT be treated as authorization.
 * Gate A1 (external shopper traffic) remains closed until access is controlled.
 * See docs/ops/store-d0-operator-note.md.
 */

import { del, put } from '@vercel/blob'
import type { StoreAsset } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { AssetStore, PutStoreAssetInput } from '../../application/ports/asset-store'
import type { StoreAssetRecord } from '../../application/ports/repositories'
import type { StoreAssetAccessMode, StoreAssetPurpose } from '../../domain/enums'
import { merchantInactive, sessionUnauthorized } from '../../domain/errors'

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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createVercelBlobAssetStore(): AssetStore {
  return {
    async put(input: PutStoreAssetInput) {
      const blob = await put(input.storageKey, input.body, {
        access: 'public',
        contentType: input.contentType,
      })

      const row = await prisma.storeAsset.create({
        data: {
          merchantId: input.merchantId,
          merchantSessionId: input.merchantSessionId ?? null,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          purpose: input.purpose,
          storageKey: input.storageKey,
          accessMode: input.accessMode,
          providerUrl: blob.url,
          expiresAt: input.expiresAt,
        },
      })

      return { asset: mapAsset(row), deliveryUrl: blob.url }
    },

    async getProviderDeliveryUrl(assetId, merchantId) {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId, deletedAt: null },
      })
      return row?.providerUrl ?? null
    },

    async delete(assetId, merchantId) {
      const row = await prisma.storeAsset.findFirst({
        where: { id: assetId, merchantId },
      })
      if (!row || row.deletedAt) return

      if (row.providerUrl) {
        try {
          await del(row.providerUrl)
        } catch {
          // Deletion is idempotent and observable via deletedAt.
        }
      }

      await prisma.storeAsset.updateMany({
        where: { id: assetId, merchantId, deletedAt: null },
        data: { deletedAt: new Date() },
      })
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

    async listExpired(now, limit = 100) {
      const rows = await prisma.storeAsset.findMany({
        where: {
          expiresAt: { lte: now },
          deletedAt: null,
        },
        take: limit,
        orderBy: { expiresAt: 'asc' },
      })
      return rows.map(mapAsset)
    },
  }
}

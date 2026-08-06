/**
 * Resolve a StoreAsset for the capability-authenticated shopper session and stream bytes.
 */

import { logger } from '@/lib/logger'
import { StoreDomainError, merchantInactive, merchantNotFound } from '../domain'
import type { AssetStore } from './ports/asset-store'
import type {
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export type ResolveStoreSessionAssetResult = {
  assetId: string
  contentType: string
  body: Buffer
  expiresAt: Date
}

export async function resolveStoreSessionAsset(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  assets: AssetStore
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  assetId: string
}): Promise<ResolveStoreSessionAssetResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const asset = await input.assets.assertAccess({
    assetId: input.assetId,
    merchantId: merchant.id,
    merchantSessionId: session.id,
  })

  if (asset.merchantSessionId && asset.merchantSessionId !== session.id) {
    logger.warn('store', 'Store asset access denied (session mismatch)', {
      merchantId: merchant.id,
      merchantSessionId: session.id,
      assetId: input.assetId,
      assetSessionId: asset.merchantSessionId,
    })
    throw new StoreDomainError('SESSION_UNAUTHORIZED', 'Asset is not part of this session.', 403)
  }

  const bytes = await input.assets.getBytes(asset.id, merchant.id)
  if (!bytes) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'This photo is no longer available.',
      404,
    )
  }

  return {
    assetId: asset.id,
    contentType: bytes.contentType,
    body: bytes.body,
    expiresAt: asset.expiresAt,
  }
}

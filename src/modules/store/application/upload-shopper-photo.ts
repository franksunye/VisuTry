import { randomUUID } from 'node:crypto'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  merchantInactive,
  merchantNotFound,
} from '../domain'
import type { StoreAssetAccessMode } from '../domain/enums'
import type { AssetStore } from './ports/asset-store'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export type UploadShopperPhotoInput = {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  assets: AssetStore
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  file: File
  locale?: string | null
  deviceType?: string | null
  /** Retention expiry — computed by infrastructure/config before calling. */
  assetExpiresAt: Date
  /** Explicit infrastructure-selected policy; private remains the default. */
  assetAccessMode: StoreAssetAccessMode
}

export type UploadShopperPhotoResult = {
  merchantSessionId: string
  photoAssetId: string
  /** Preview delivery URL for the shopper only — never returned in merchant insights. */
  previewUrl: string
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024

export async function uploadShopperPhoto(
  input: UploadShopperPhotoInput,
): Promise<UploadShopperPhotoResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  if (!ALLOWED_TYPES.has(input.file.type)) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'Only JPEG, PNG, and WebP images are supported.',
      400,
    )
  }
  if (input.file.size > MAX_BYTES) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'Image must be 5MB or smaller.',
      400,
    )
  }

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const extension = extensionForType(input.file.type)
  const storageKey = `store/${merchant.id}/sessions/${session.id}/photo-${randomUUID()}.${extension}`

  const { asset, deliveryUrl } = await input.assets.put({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    ownerType: 'SESSION',
    ownerId: session.id,
    purpose: 'SHOPPER_PHOTO',
    storageKey,
    accessMode: input.assetAccessMode,
    body: input.file,
    contentType: input.file.type,
    expiresAt: input.assetExpiresAt,
  })

  await input.sessions.attachPhotoAsset({
    merchantId: merchant.id,
    sessionId: session.id,
    photoAssetId: asset.id,
  })

  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_photo_uploaded',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      clientActionId: `photo:${asset.id}`,
    }),
    type: 'merchant_photo_uploaded',
    merchantId: merchant.id,
    merchantSessionId: session.id,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: {
      contentType: input.file.type,
      byteSize: input.file.size,
      accessMode: input.assetAccessMode,
    },
  })

  // Always return capability-bound app URL (never raw Blob URL as auth).
  const previewUrl = `${deliveryUrl}?merchantSlug=${encodeURIComponent(merchant.slug)}&merchantSessionId=${encodeURIComponent(session.id)}`

  return {
    merchantSessionId: session.id,
    photoAssetId: asset.id,
    previewUrl,
  }
}

function extensionForType(contentType: string): string {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

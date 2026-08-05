/**
 * Store domain enums — pure values, no infrastructure imports.
 */

export const MERCHANT_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number]

export const MERCHANT_FRAME_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const
export type MerchantFrameStatus = (typeof MERCHANT_FRAME_STATUSES)[number]

export const MERCHANT_FRAME_SOURCES = ['SEED', 'MANUAL', 'CSV', 'EXTERNAL'] as const
export type MerchantFrameSource = (typeof MERCHANT_FRAME_SOURCES)[number]

export const ENRICHMENT_STATUSES = [
  'NOT_REQUIRED',
  'PENDING',
  'REVIEW_REQUIRED',
  'APPROVED',
] as const
export type EnrichmentStatus = (typeof ENRICHMENT_STATUSES)[number]

export const MERCHANT_SESSION_STATUSES = ['ACTIVE', 'COMPLETED', 'EXPIRED'] as const
export type MerchantSessionStatus = (typeof MERCHANT_SESSION_STATUSES)[number]

export const MERCHANT_INTENT_TYPES = ['FAVORITE', 'PRODUCT_CLICK', 'INQUIRY'] as const
export type MerchantIntentType = (typeof MERCHANT_INTENT_TYPES)[number]

export const TRY_ON_ORIGINS = ['CONSUMER', 'STORE_DEMO', 'STORE_PILOT'] as const
export type TryOnOrigin = (typeof TRY_ON_ORIGINS)[number]

export const STORE_ASSET_PURPOSES = [
  'SHOPPER_PHOTO',
  'FRAME_INPUT',
  'GENERATED_RESULT',
] as const
export type StoreAssetPurpose = (typeof STORE_ASSET_PURPOSES)[number]

export const STORE_ASSET_ACCESS_MODES = [
  'PUBLIC_TEMPORARY',
  'PRIVATE_SIGNED',
] as const
export type StoreAssetAccessMode = (typeof STORE_ASSET_ACCESS_MODES)[number]

export const STORE_EVENT_SOURCES = ['CLIENT', 'SERVER'] as const
export type StoreEventSource = (typeof STORE_EVENT_SOURCES)[number]

/** Canonical Store funnel event names (authoritative DB records). */
export const STORE_EVENT_TYPES = [
  'merchant_page_viewed',
  'merchant_photo_uploaded',
  'merchant_recommendation_started',
  'merchant_recommendation_completed',
  'merchant_frame_selected',
  'merchant_tryon_started',
  'merchant_tryon_completed',
  'merchant_tryon_failed',
  'merchant_compare_started',
  'merchant_favorite_saved',
  'merchant_product_clicked',
  'merchant_inquiry_submitted',
  'merchant_insights_viewed',
] as const
export type StoreEventType = (typeof STORE_EVENT_TYPES)[number]

export const STORE_USAGE_KINDS = [
  'RENDER_ATTEMPT',
  'RENDER_SUCCESS',
  'RENDER_FAILURE',
  'SESSION',
] as const
export type StoreUsageKind = (typeof STORE_USAGE_KINDS)[number]

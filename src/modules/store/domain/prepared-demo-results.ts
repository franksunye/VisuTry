import { isExplicitVisuTryDemoMerchant } from './merchant-commercial-state'

export const CANONICAL_DEMO_MERCHANT_SLUG = 'visutry-demo-optical'
export const CANONICAL_DEMO_SHOPPER_PROFILE_ID = 'visutry-demo-shopper-v1'
export const CANONICAL_DEMO_SHOPPER_PROFILE_VERSION = '1'

export type DemoTryOnExecutionMode = 'PREPARED_DEMO' | 'LIVE_PROVIDER' | 'LIVE_TRYON'

export type DemoMerchantIdentity = {
  slug: string
  classification?: string | null
  pilotType?: string | null
  commercialExceptionCode?: string | null
}

export function isCanonicalVisuTryDemo(merchant: DemoMerchantIdentity): boolean {
  return merchant.slug.trim().toLowerCase() === CANONICAL_DEMO_MERCHANT_SLUG
    && isExplicitVisuTryDemoMerchant(merchant)
}

export type PreparedDemoResultReferenceInput = {
  source: 'PREPARED_DEMO'
  sourceRef: {
    assetKey: string
    provenanceId: string
    manifestVersion: string
    shopperProfileId: string
    shopperProfileVersion: string
  }
  frameId: string
  status: 'PREPARED'
  presentedAt: string
}

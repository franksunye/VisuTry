import { publicMerchantImageUrl } from '@/lib/is-loopback-image-url'
import {
  validateMerchantFrameStoreReadiness,
} from './merchant-frame-store-readiness'
import type { MerchantFrameReadinessInput } from './merchant-frame-readiness'

type HandoffExperience = {
  type: 'STORE' | 'CAMPAIGN'
  slug: string
  status: string
  updatedAt: Date
  heroAssetUrl: string | null
  frames: Array<{ merchantFrame: MerchantFrameReadinessInput }>
}

export type MerchantSupportHandoffSnapshot = {
  slug: string
  name: string
  classification: string
  logoUrl: string | null
  accentColor: string | null
  frames: MerchantFrameReadinessInput[]
  experiences: HandoffExperience[]
}

/**
 * A sanitized, human-operated handoff snapshot, not a commercial
 * certification. Public render, identity, billing and external asset health
 * cannot be established from a database read.
 */
export function buildMerchantSupportHandoffV1(snapshot: MerchantSupportHandoffSnapshot) {
  const activeFrames = snapshot.frames.filter(frame => frame.status === 'ACTIVE')
  const eligibleFrames = activeFrames.filter(frame =>
    validateMerchantFrameStoreReadiness(frame).storeEligible,
  )
  const stores = snapshot.experiences.filter(item => item.type === 'STORE')
  const activeStores = stores.filter(item => item.status === 'ACTIVE')
  const store = [...(activeStores.length ? activeStores : stores)].sort((a, b) =>
    activeStores.length
      ? a.slug.localeCompare(b.slug) || b.updatedAt.getTime() - a.updatedAt.getTime()
      : b.updatedAt.getTime() - a.updatedAt.getTime(),
  )[0] ?? null
  const selected = store?.frames.map(row => row.merchantFrame) ?? []
  const displayEligible = selected.filter(frame =>
    validateMerchantFrameStoreReadiness(frame).storeEligible,
  )
  const blockers: string[] = []
  if (activeFrames.length === 0) blockers.push('NO_ACTIVE_CATALOG_PRODUCTS')
  if (!store) blockers.push('STORE_NOT_CREATED')
  else {
    if (activeStores.length > 1) blockers.push('MULTIPLE_ACTIVE_STORES')
    if (selected.length === 0) blockers.push('STORE_HAS_NO_SELECTED_PRODUCTS')
    if (displayEligible.length !== selected.length) blockers.push('STORE_HAS_INELIGIBLE_PRODUCTS')
    if (store.status !== 'ACTIVE') blockers.push('STORE_NOT_PUBLISHED')
  }
  const campaigns = snapshot.experiences.filter(item => item.type === 'CAMPAIGN')
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(item => ({
      slug: item.slug,
      status: item.status,
      publicPath: item.status === 'ACTIVE'
        ? `/en/c/${snapshot.slug}/${item.slug}`
        : null,
      productCount: item.frames.length,
      publicRender: 'NOT_VERIFIED' as const,
    }))

  return {
    version: 1 as const,
    scope: 'AUTHENTICATED_MERCHANT_DB_SNAPSHOT_ONLY' as const,
    merchant: {
      name: snapshot.name,
      slug: snapshot.slug,
      classification: snapshot.classification,
    },
    brand: {
      logoConfigured: Boolean(publicMerchantImageUrl(snapshot.logoUrl)),
      accentConfigured: Boolean(snapshot.accentColor),
    },
    catalog: {
      total: snapshot.frames.length,
      active: activeFrames.length,
      storeEligible: eligibleFrames.length,
    },
    store: {
      status: store?.status ?? null,
      selectedProductCount: selected.length,
      displayEligibleProductCount: displayEligible.length,
      heroConfigured: Boolean(publicMerchantImageUrl(store?.heroAssetUrl)),
      publicPath: store?.status === 'ACTIVE'
        ? `/en/store/${snapshot.slug}`
        : null,
      publicRender: 'NOT_VERIFIED' as const,
    },
    campaigns,
    blockers,
    verification: {
      publicStoreImageDecode: 'NOT_EXECUTED' as const,
      publicCampaignRender: 'NOT_EXECUTED' as const,
      ownerAuthCallback: 'NOT_EXECUTED' as const,
      billingLive: 'NOT_EXECUTED' as const,
    },
    nextAction: blockers.length
      ? 'Resolve the listed workspace blockers, then verify the guest Store in a browser.'
      : 'Review the guest Store, Result/Handoff and applicable billing evidence before customer handoff.',
    releaseReady: false as const,
  }
}

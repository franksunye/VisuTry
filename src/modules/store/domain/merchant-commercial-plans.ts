/**
 * G4-A canonical Merchant commercial contract.
 *
 * This file is the versioned source of truth for plan entitlements. UI and
 * infrastructure code should consume these definitions instead of declaring
 * plan limits locally.
 */

export const COMMERCIAL_PLAN_VERSION = 'v1' as const

export const MERCHANT_PLAN_CODES = [
  'FREE',
  'LAUNCH',
  'GROWTH',
  'SCALE',
  'ENTERPRISE',
  'FOUNDING_PILOT',
] as const

export type MerchantPlanCode = (typeof MERCHANT_PLAN_CODES)[number]
export type AnalyticsEntitlement = 'none' | 'basic' | 'advanced'

export type MerchantPlanDefinition = {
  code: MerchantPlanCode
  name: string
  priceCents: number | null
  priceLabel: string
  billing: 'free' | 'monthly' | 'fixed_30_days' | 'custom'
  stores: number | null
  catalogItems: number | null
  activeCampaigns: number | null
  aiCommerceSessions: number | null
  standardTryOnGenerations: number | null
  generativeTryOn: boolean
  recommendation: boolean
  compare: boolean
  analytics: AnalyticsEntitlement
  sourceAttribution: boolean
  normalStoreTraffic: 'unlimited'
  pilotCatalogRange?: { min: number; max: number }
  setupLabel?: string
}

const plan = <T extends MerchantPlanDefinition>(definition: T): T => definition

export const MERCHANT_COMMERCIAL_PLANS: Readonly<Record<MerchantPlanCode, MerchantPlanDefinition>> = {
  FREE: plan({
    code: 'FREE', name: 'Free', priceCents: 0, priceLabel: '$0', billing: 'free',
    stores: 1, catalogItems: 50, activeCampaigns: 0, aiCommerceSessions: null,
    standardTryOnGenerations: null, generativeTryOn: false, recommendation: true,
    compare: false, analytics: 'basic', sourceAttribution: false, normalStoreTraffic: 'unlimited',
  }),
  LAUNCH: plan({
    code: 'LAUNCH', name: 'Launch', priceCents: 19900, priceLabel: '$199/month', billing: 'monthly',
    stores: 1, catalogItems: 100, activeCampaigns: 1, aiCommerceSessions: 1000,
    standardTryOnGenerations: null, generativeTryOn: true, recommendation: true,
    compare: true, analytics: 'basic', sourceAttribution: true, normalStoreTraffic: 'unlimited',
  }),
  GROWTH: plan({
    code: 'GROWTH', name: 'Growth', priceCents: 49900, priceLabel: '$499/month', billing: 'monthly',
    stores: 1, catalogItems: 500, activeCampaigns: 3, aiCommerceSessions: 5000,
    standardTryOnGenerations: null, generativeTryOn: true, recommendation: true,
    compare: true, analytics: 'advanced', sourceAttribution: true, normalStoreTraffic: 'unlimited',
  }),
  SCALE: plan({
    code: 'SCALE', name: 'Scale', priceCents: 99900, priceLabel: '$999/month', billing: 'monthly',
    stores: 1, catalogItems: 2000, activeCampaigns: 10, aiCommerceSessions: 10000,
    standardTryOnGenerations: null, generativeTryOn: true, recommendation: true,
    compare: true, analytics: 'advanced', sourceAttribution: true, normalStoreTraffic: 'unlimited',
  }),
  ENTERPRISE: plan({
    code: 'ENTERPRISE', name: 'Enterprise', priceCents: null, priceLabel: 'Custom · $2,500+', billing: 'custom',
    stores: 1, catalogItems: null, activeCampaigns: null, aiCommerceSessions: null,
    standardTryOnGenerations: null, generativeTryOn: true, recommendation: true,
    compare: true, analytics: 'advanced', sourceAttribution: true, normalStoreTraffic: 'unlimited',
  }),
  FOUNDING_PILOT: plan({
    code: 'FOUNDING_PILOT', name: 'Founding Pilot', priceCents: 14900, priceLabel: '$149 / 30 days', billing: 'fixed_30_days',
    stores: 1, catalogItems: 50, activeCampaigns: 1, aiCommerceSessions: 1500,
    standardTryOnGenerations: 3500, generativeTryOn: true, recommendation: true,
    compare: true, analytics: 'basic', sourceAttribution: true, normalStoreTraffic: 'unlimited',
    pilotCatalogRange: { min: 8, max: 50 }, setupLabel: 'Assisted setup + weekly review',
  }),
} as const

export const FOUNDING_PILOT_OFFER = Object.freeze({
  priceLabel: '$149 / 30 days',
  aiAssistedShoppers: 1500,
  standardTryOnGenerations: 3500,
  catalogFrames: { min: 8, max: 50 },
  included: ['Recommendation', 'Try-On', 'Compare'] as const,
  setup: 'Assisted setup + weekly review',
})

export function isMerchantPlanCode(value: unknown): value is MerchantPlanCode {
  return typeof value === 'string' && (MERCHANT_PLAN_CODES as readonly string[]).includes(value.toUpperCase())
}

export function resolveMerchantPlanCode(value: string | null | undefined): MerchantPlanCode {
  const normalized = value?.trim().toUpperCase()
  return isMerchantPlanCode(normalized) ? normalized : 'FREE'
}

export function getMerchantPlanDefinition(value: string | null | undefined): MerchantPlanDefinition {
  return MERCHANT_COMMERCIAL_PLANS[resolveMerchantPlanCode(value)]
}

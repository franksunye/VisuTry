import {
  canUseCommercialFeature,
  percentageUsed,
  resolveMerchantCommercialState,
  resolveMerchantCommercialPeriod,
  usageThreshold,
} from '@/modules/store/domain/merchant-commercial-state'
import { getMerchantPlanDefinition } from '@/modules/store/domain/merchant-commercial-plans'

const now = new Date('2026-08-27T00:00:00.000Z')

describe('G4-A canonical Merchant commercial contract', () => {
  it('keeps normal plan definitions canonical and separate from Pilot', () => {
    expect(getMerchantPlanDefinition('FREE')).toMatchObject({ catalogItems: 50, activeCampaigns: 0, generativeTryOn: false, recommendation: true })
    expect(getMerchantPlanDefinition('LAUNCH')).toMatchObject({ priceLabel: '$199/month', catalogItems: 100, activeCampaigns: 1, aiCommerceSessions: 1000 })
    expect(getMerchantPlanDefinition('GROWTH')).toMatchObject({ priceLabel: '$499/month', catalogItems: 500, activeCampaigns: 3, aiCommerceSessions: 5000 })
    expect(getMerchantPlanDefinition('SCALE')).toMatchObject({ priceLabel: '$999/month', catalogItems: 2000, activeCampaigns: 10, aiCommerceSessions: 10000 })
    expect(getMerchantPlanDefinition('FOUNDING_PILOT')).toMatchObject({ priceLabel: '$149 / 30 days', aiCommerceSessions: 1500, standardTryOnGenerations: 3500 })
  })

  it.each([
    [69, 'NORMAL'], [70, 'NOTICE'], [89, 'NOTICE'], [90, 'WARNING'], [99, 'WARNING'], [100, 'LIMIT_REACHED'], [101, 'LIMIT_REACHED'],
  ] as const)('maps %d%% to %s', (used, expected) => {
    expect(usageThreshold(used, 100)).toBe(expected)
  })

  it('keeps Free useful while excluding paid Try-On and Campaigns', () => {
    const state = resolveMerchantCommercialState({ planCode: 'FREE', commercialStatus: 'FREE' }, { catalogItems: 12 }, now)
    expect(state.status).toBe('FREE')
    expect(state.featureAvailability.STORE).toBe(true)
    expect(state.featureAvailability.RECOMMENDATION).toBe(true)
    expect(state.featureAvailability.GENERATIVE_TRY_ON).toBe(false)
    expect(state.featureAvailability.CAMPAIGN).toBe(false)
    expect(canUseCommercialFeature(state, 'GENERATIVE_TRY_ON').code).toBe('FEATURE_NOT_INCLUDED')
  })

  it('pauses Try-On at paid session exhaustion without taking Store offline', () => {
    const state = resolveMerchantCommercialState({ planCode: 'GROWTH', entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-09-01T00:00:00.000Z') }, { aiCommerceSessions: 5000 }, now)
    expect(state.status).toBe('USAGE_EXHAUSTED')
    expect(state.featureAvailability.STORE).toBe(true)
    expect(state.featureAvailability.CATALOG).toBe(true)
    expect(state.featureAvailability.GENERATIVE_TRY_ON).toBe(false)
    expect(canUseCommercialFeature(state, 'GENERATIVE_TRY_ON').code).toBe('AI_USAGE_LIMIT_REACHED')
  })

  it('supports an anchored monthly period without relying on calendar-month assumptions', () => {
    const period = resolveMerchantCommercialPeriod({ planCode: 'LAUNCH', createdAt: new Date('2026-08-15T12:00:00.000Z') }, now)
    expect(period.kind).toBe('monthly')
    expect(period.start?.toISOString()).toBe('2026-08-15T12:00:00.000Z')
    expect(period.end?.toISOString()).toBe('2026-09-15T12:00:00.000Z')
  })

  it('supports fixed 30-day Pilot periods and near-expiry usage states', () => {
    const state = resolveMerchantCommercialState({ planCode: 'FOUNDING_PILOT', createdAt: new Date('2026-08-01T00:00:00.000Z') }, { aiCommerceSessions: 1100 }, now)
    expect(state.period.kind).toBe('fixed_30_days')
    expect(state.period.end?.toISOString()).toBe('2026-08-31T00:00:00.000Z')
    expect(state.status).toBe('USAGE_WARNING')
    expect(state.threshold).toBe('NOTICE')
  })

  it('reports remaining sessions without rollover', () => {
    const state = resolveMerchantCommercialState({ planCode: 'LAUNCH', entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-09-01T00:00:00.000Z') }, { aiCommerceSessions: 420 }, now)
    expect(state.aiCommerceSessionRemaining).toBe(580)
    expect(state.aiCommerceSessionPercentage).toBe(42)
    expect(percentageUsed(1001, 1000)).toBe(100)
  })

  it('returns structured campaign and catalog decisions at their plan limits', () => {
    const launch = resolveMerchantCommercialState({ planCode: 'LAUNCH', entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-09-01T00:00:00.000Z') }, { activeCampaigns: 1, catalogItems: 100 }, now)
    const campaign = canUseCommercialFeature(launch, 'CAMPAIGN')
    const catalog = canUseCommercialFeature(launch, 'CATALOG')
    expect(campaign).toMatchObject({ allowed: false, code: 'CAMPAIGN_LIMIT_REACHED', current: 1, limit: 1, recommendedPlan: 'GROWTH' })
    expect(catalog).toMatchObject({ allowed: false, code: 'CATALOG_LIMIT_REACHED', current: 100, limit: 100, recommendedPlan: 'GROWTH' })
  })

  it('expires a cancelled paid period at its boundary without changing the stored policy', () => {
    const state = resolveMerchantCommercialState({ planCode: 'LAUNCH', commercialStatus: 'CANCEL_AT_PERIOD_END', entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-08-27T00:00:00.000Z') }, {}, now)
    expect(state.status).toBe('EXPIRED')
    expect(state.featureAvailability.STORE).toBe(true)
    expect(state.featureAvailability.GENERATIVE_TRY_ON).toBe(false)
  })

  it('keeps ordinary Store traffic unmetered in the canonical plan contract', () => {
    expect(getMerchantPlanDefinition('FREE').normalStoreTraffic).toBe('unlimited')
    expect(getMerchantPlanDefinition('GROWTH').normalStoreTraffic).toBe('unlimited')
  })
})

import {
  canUseCommercialFeature,
  percentageUsed,
  commercialStateForPresentation,
  isCanonicalMerchantCommercialFields,
  resolveMerchantCommercialState,
  resolveMerchantCommercialPeriod,
  usageThreshold,
} from '@/modules/store/domain/merchant-commercial-state'
import { getMerchantPlanDefinition } from '@/modules/store/domain/merchant-commercial-plans'
import { merchantFeatureAvailable, resolveMerchantCommercialCapability } from '@/modules/store/domain/merchant-commercial-capability'

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

  it('distinguishes canonical Free enrollment from a legacy merchant', () => {
    const free = resolveMerchantCommercialState({ planCode: 'FREE', commercialStatus: 'FREE' }, {}, now)
    const legacy = resolveMerchantCommercialState({ planCode: null, commercialStatus: null }, {}, now)

    expect(isCanonicalMerchantCommercialFields({ planCode: 'FREE' })).toBe(true)
    expect(isCanonicalMerchantCommercialFields({ planCode: null, commercialStatus: null })).toBe(false)
    expect(free).toMatchObject({ commercialState: 'CANONICAL', planCode: 'FREE', status: 'FREE' })
    expect(legacy).toMatchObject({ commercialState: 'LEGACY_UNMIGRATED', planCode: null, plan: null, status: 'LEGACY_UNMIGRATED', primaryAction: 'ENROLL_PLAN' })
    expect(commercialStateForPresentation(legacy)).toMatchObject({ isCanonical: false, planName: 'Legacy · not enrolled', status: 'LEGACY_UNMIGRATED' })
    expect(canUseCommercialFeature(legacy, 'GENERATIVE_TRY_ON').allowed).toBe(true)
  })

  it('uses one capability decision for public projection and Store runtime while isolating origin as persistence compatibility', () => {
    const launchFields = { planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' }
    const freeFields = { planCode: 'FREE', commercialStatus: 'FREE' }
    const launch = resolveMerchantCommercialCapability(launchFields, {}, now)
    const free = resolveMerchantCommercialCapability(freeFields, {}, now)
    const legacy = resolveMerchantCommercialCapability({ planCode: 'DEMO', commercialStatus: null }, {}, now)

    expect(launch.decisions.GENERATIVE_TRY_ON.allowed).toBe(true)
    expect(merchantFeatureAvailable(launchFields, 'GENERATIVE_TRY_ON', {}, now)).toBe(true)
    expect(free.decisions.GENERATIVE_TRY_ON.allowed).toBe(false)
    expect(merchantFeatureAvailable(freeFields, 'GENERATIVE_TRY_ON', {}, now)).toBe(false)
    expect(legacy.state.commercialState).toBe('LEGACY_UNMIGRATED')
    expect(legacy.decisions.GENERATIVE_TRY_ON.allowed).toBe(true)
    expect(legacy.storeRuntime).toMatchObject({
      persistedGenerationOrigin: 'STORE_DEMO',
      enforceLegacyRenderLimits: true,
      renderLimits: { maxSuccessfulRendersPerMerchant: 500, maxSuccessfulRendersPerSession: 8, maxAttemptsPerSession: 16 },
    })
  })

  it('retains expired legacy Founding Pilot enforcement without misclassifying the row as Free', () => {
    const fields = {
      planCode: null,
      commercialStage: 'MARKET_CAPTURE',
      entitlementEffectiveFrom: new Date('2026-07-01T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-07-31T00:00:00.000Z'),
    }
    const capability = resolveMerchantCommercialCapability(fields, {}, now)

    expect(capability.state).toMatchObject({ commercialState: 'LEGACY_UNMIGRATED', status: 'LEGACY_UNMIGRATED' })
    expect(capability.storeRuntime.persistedGenerationOrigin).toBe('STORE_PILOT')
    expect(capability.decisions.GENERATIVE_TRY_ON).toMatchObject({ allowed: false, code: 'COMMERCIAL_PERIOD_EXPIRED' })
    expect(merchantFeatureAvailable(fields, 'GENERATIVE_TRY_ON', {}, now)).toBe(false)
  })

  it('treats a persisted USAGE_EXHAUSTED status as authoritative without a usage snapshot', () => {
    const state = resolveMerchantCommercialState({ planCode: 'LAUNCH', commercialStatus: 'USAGE_EXHAUSTED' }, {}, now)

    expect(state.status).toBe('USAGE_EXHAUSTED')
    expect(resolveMerchantCommercialCapability({ planCode: 'LAUNCH', commercialStatus: 'USAGE_EXHAUSTED' }, {}, now)
      .decisions.GENERATIVE_TRY_ON).toMatchObject({ allowed: false, code: 'AI_USAGE_LIMIT_REACHED' })
  })

  it('pauses Try-On at paid session exhaustion without taking Store offline', () => {
    const state = resolveMerchantCommercialState({ planCode: 'GROWTH', entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-09-01T00:00:00.000Z') }, { aiCommerceSessions: 5000 }, now)
    expect(state.status).toBe('USAGE_EXHAUSTED')
    expect(state.featureAvailability.STORE).toBe(true)
    expect(state.featureAvailability.CATALOG).toBe(true)
    expect(state.featureAvailability.GENERATIVE_TRY_ON).toBe(false)
    expect(canUseCommercialFeature(state, 'GENERATIVE_TRY_ON').code).toBe('AI_USAGE_LIMIT_REACHED')
  })

  it('preserves default and exceptional Founding Pilot render allowances in canonical decisions and runtime claims', () => {
    const baseFields = {
      planCode: 'FOUNDING_PILOT',
      commercialStatus: 'PILOT_ACTIVE',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    const belowBoth = resolveMerchantCommercialCapability(baseFields, {
      aiCommerceSessions: 1499,
      standardTryOnGenerations: 3499,
    }, now)
    const sessionsExhausted = resolveMerchantCommercialCapability(baseFields, {
      aiCommerceSessions: 1500,
      standardTryOnGenerations: 100,
    }, now)
    const normalLimitReached = resolveMerchantCommercialCapability(baseFields, {
      aiCommerceSessions: 0,
      standardTryOnGenerations: 3500,
    }, now)
    const bonusFields = { ...baseFields, commercialExceptionCode: 'FOUNDING_LAUNCH_BONUS' }
    const bonusUnderLimit = resolveMerchantCommercialCapability(bonusFields, { standardTryOnGenerations: 4999 }, now)
    const bonusLimitReached = resolveMerchantCommercialCapability(bonusFields, { standardTryOnGenerations: 5000 }, now)
    const explicitFields = { ...baseFields, standardRenderAllowance: 4200 }
    const explicitUnderLimit = resolveMerchantCommercialCapability(explicitFields, { standardTryOnGenerations: 4199 }, now)
    const explicitLimitReached = resolveMerchantCommercialCapability(explicitFields, { standardTryOnGenerations: 4200 }, now)

    expect(belowBoth.decisions.GENERATIVE_TRY_ON.allowed).toBe(true)
    expect(sessionsExhausted.decisions.GENERATIVE_TRY_ON).toMatchObject({ allowed: false, current: 1500, limit: 1500 })
    expect(normalLimitReached.state).toMatchObject({ status: 'USAGE_EXHAUSTED', standardTryOnGenerationLimit: 3500 })
    expect(normalLimitReached.decisions.GENERATIVE_TRY_ON).toMatchObject({ allowed: false, current: 3500, limit: 3500 })
    expect(normalLimitReached.storeRuntime.renderLimits.maxSuccessfulRendersPerMerchant).toBe(3500)
    expect(bonusUnderLimit).toMatchObject({ state: { standardTryOnGenerationLimit: 5000 }, storeRuntime: { renderLimits: { maxSuccessfulRendersPerMerchant: 5000 } }, decisions: { GENERATIVE_TRY_ON: { allowed: true } } })
    expect(bonusLimitReached).toMatchObject({ state: { status: 'USAGE_EXHAUSTED', standardTryOnGenerationLimit: 5000 }, storeRuntime: { renderLimits: { maxSuccessfulRendersPerMerchant: 5000 } }, decisions: { GENERATIVE_TRY_ON: { allowed: false, current: 5000, limit: 5000 } } })
    expect(explicitUnderLimit).toMatchObject({ state: { standardTryOnGenerationLimit: 4200 }, storeRuntime: { renderLimits: { maxSuccessfulRendersPerMerchant: 4200 } }, decisions: { GENERATIVE_TRY_ON: { allowed: true } } })
    expect(explicitLimitReached).toMatchObject({ state: { status: 'USAGE_EXHAUSTED', standardTryOnGenerationLimit: 4200 }, storeRuntime: { renderLimits: { maxSuccessfulRendersPerMerchant: 4200 } }, decisions: { GENERATIVE_TRY_ON: { allowed: false, current: 4200, limit: 4200 } } })
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
    expect(state.primaryAction).toBe('CONTINUE_AFTER_PILOT')
  })

  it('keeps an expired Pilot non-destructive and reports a period decision', () => {
    const state = resolveMerchantCommercialState({ planCode: 'FOUNDING_PILOT', entitlementEffectiveFrom: new Date('2026-07-01T00:00:00.000Z'), billingPeriodEnd: new Date('2026-07-31T00:00:00.000Z') }, { catalogItems: 50 }, now)
    expect(state.status).toBe('PILOT_EXPIRED')
    expect(state.featureAvailability.STORE).toBe(true)
    expect(canUseCommercialFeature(state, 'CATALOG')).toMatchObject({ code: 'COMMERCIAL_PERIOD_EXPIRED' })
    expect(state.primaryAction).toBe('CONTINUE_AFTER_PILOT')
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

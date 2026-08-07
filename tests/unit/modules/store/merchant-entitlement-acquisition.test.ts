import {
  FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS,
  FOUNDING_PILOT_V8,
  isMerchantEntitlementActive,
  merchantUsageCreatedAtFilter,
  resolveMerchantEntitlement,
} from '@/modules/store/domain/merchant-entitlement'
import {
  inferAiReferralSource,
  sanitizeSessionAcquisition,
  sessionAcquisitionToMetadata,
} from '@/modules/store/domain/session-acquisition'

describe('merchant commercial entitlement', () => {
  it('defaults missing commercial fields to DEMO / STORE_DEMO', () => {
    const resolved = resolveMerchantEntitlement({})
    expect(resolved.planCode).toBe('DEMO')
    expect(resolved.tryOnOrigin).toBe('STORE_DEMO')
    expect(resolved.renderLimits.maxSuccessfulRendersPerMerchant).toBe(500)
    expect(Number.isFinite(resolved.commerceSessionAllowance)).toBe(false)
    expect(merchantUsageCreatedAtFilter(resolved)).toBeUndefined()
    expect(isMerchantEntitlementActive(resolved)).toBe(true)
  })

  it('resolves FOUNDING_PILOT Market Capture v8 allowances', () => {
    const now = new Date('2026-08-07T00:00:00.000Z')
    const resolved = resolveMerchantEntitlement(
      {
        planCode: 'FOUNDING_PILOT',
        commercialStage: 'MARKET_CAPTURE',
        pricingVersion: 'v8',
        entitlementVersion: 'v8',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      now,
    )
    expect(resolved.tryOnOrigin).toBe('STORE_PILOT')
    expect(resolved.commerceSessionAllowance).toBe(
      FOUNDING_PILOT_V8.commerceSessionAllowance,
    )
    expect(resolved.standardRenderAllowance).toBe(
      FOUNDING_PILOT_V8.standardRenderAllowance,
    )
    expect(resolved.renderLimits.maxSuccessfulRendersPerMerchant).toBe(3500)
    expect(resolved.usagePeriodStart?.toISOString()).toBe('2026-08-01T00:00:00.000Z')
    expect(resolved.usagePeriodEnd?.toISOString()).toBe('2026-08-31T00:00:00.000Z')
    expect(isMerchantEntitlementActive(resolved, now)).toBe(true)
  })

  it('uses explicit entitlement dates as the usage window', () => {
    const start = new Date('2026-09-01T00:00:00.000Z')
    const end = new Date('2026-10-01T00:00:00.000Z')
    const resolved = resolveMerchantEntitlement({
      planCode: 'FOUNDING_PILOT',
      entitlementEffectiveFrom: start,
      billingPeriodEnd: end,
    })
    expect(merchantUsageCreatedAtFilter(resolved)).toEqual({ gte: start, lt: end })
  })

  it('rejects a Pilot entitlement outside its explicit billing period', () => {
    const resolved = resolveMerchantEntitlement({
      planCode: 'FOUNDING_PILOT',
      entitlementEffectiveFrom: new Date('2026-07-01T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-07-31T00:00:00.000Z'),
    })
    expect(
      isMerchantEntitlementActive(resolved, new Date('2026-08-07T00:00:00.000Z')),
    ).toBe(false)
  })

  it('rolls a legacy Pilot row into the current 30-day period from createdAt', () => {
    const resolved = resolveMerchantEntitlement(
      {
        planCode: 'FOUNDING_PILOT',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      new Date('2026-08-07T00:00:00.000Z'),
    )
    expect(resolved.usagePeriodStart?.toISOString()).toBe('2026-07-31T00:00:00.000Z')
    expect(resolved.usagePeriodEnd?.toISOString()).toBe('2026-08-30T00:00:00.000Z')
  })

  it('applies FOUNDING_LAUNCH_BONUS render exception when allowance omitted', () => {
    const resolved = resolveMerchantEntitlement({
      planCode: 'FOUNDING_PILOT',
      commercialExceptionCode: 'FOUNDING_LAUNCH_BONUS',
    })
    expect(resolved.standardRenderAllowance).toBe(
      FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS,
    )
  })

  it('honors explicit standardRenderAllowance over bonus default', () => {
    const resolved = resolveMerchantEntitlement({
      planCode: 'FOUNDING_PILOT',
      commercialExceptionCode: 'FOUNDING_LAUNCH_BONUS',
      standardRenderAllowance: 4200,
    })
    expect(resolved.standardRenderAllowance).toBe(4200)
  })
})

describe('session acquisition sanitize', () => {
  it('accepts Store field names and UTM aliases and classifies explicit AI source', () => {
    const acquisition = sanitizeSessionAcquisition({
      utm_source: 'chatgpt',
      utm_medium: 'ai-assistant',
      utm_campaign: 'pilot-launch',
      referrer: 'https://example.com/ref',
      landing_page: '/store/luna?utm_source=chatgpt',
      aiAgentSource: 'chatgpt',
    })
    expect(acquisition).toEqual({
      source: 'chatgpt',
      medium: 'ai-assistant',
      campaign: 'pilot-launch',
      referrer: 'https://example.com/ref',
      landingUrl: '/store/luna?utm_source=chatgpt',
      aiAgentSource: 'chatgpt',
    })
    expect(sessionAcquisitionToMetadata(acquisition)).toMatchObject({
      source: 'chatgpt',
      campaign: 'pilot-launch',
      aiAgentSource: 'chatgpt',
    })
  })

  it('classifies trusted AI referrers when source is absent', () => {
    expect(
      inferAiReferralSource({
        source: null,
        referrer: 'https://www.perplexity.ai/search/example',
        aiAgentHint: null,
      }),
    ).toBe('perplexity')

    const acquisition = sanitizeSessionAcquisition({
      referrer: 'https://chatgpt.com/c/abc',
    })
    expect(acquisition.aiAgentSource).toBe('chatgpt')
  })

  it('does not promote an uncorroborated UA-style AI hint to shopper attribution', () => {
    const acquisition = sanitizeSessionAcquisition({
      aiAgentSource: 'chatgpt',
      referrer: '',
    })
    expect(acquisition.aiAgentSource).toBeNull()
  })

  it('preserves an AI hint only when an AI-assistant medium corroborates it', () => {
    const acquisition = sanitizeSessionAcquisition({
      medium: 'ai-assistant',
      aiAgentSource: 'claude',
    })
    expect(acquisition.aiAgentSource).toBe('claude')
  })

  it('returns empty null fields for invalid input', () => {
    expect(sanitizeSessionAcquisition(null)).toEqual({
      source: null,
      medium: null,
      campaign: null,
      referrer: null,
      landingUrl: null,
      aiAgentSource: null,
    })
    expect(sessionAcquisitionToMetadata(sanitizeSessionAcquisition({}))).toBeNull()
  })
})

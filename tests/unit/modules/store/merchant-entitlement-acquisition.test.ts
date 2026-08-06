import {
  FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS,
  FOUNDING_PILOT_V8,
  resolveMerchantEntitlement,
} from '@/modules/store/domain/merchant-entitlement'
import {
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
  })

  it('resolves FOUNDING_PILOT Market Capture v8 allowances', () => {
    const resolved = resolveMerchantEntitlement({
      planCode: 'FOUNDING_PILOT',
      commercialStage: 'MARKET_CAPTURE',
      pricingVersion: 'v8',
      entitlementVersion: 'v8',
    })
    expect(resolved.tryOnOrigin).toBe('STORE_PILOT')
    expect(resolved.commerceSessionAllowance).toBe(
      FOUNDING_PILOT_V8.commerceSessionAllowance,
    )
    expect(resolved.standardRenderAllowance).toBe(
      FOUNDING_PILOT_V8.standardRenderAllowance,
    )
    expect(resolved.renderLimits.maxSuccessfulRendersPerMerchant).toBe(3500)
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
  it('accepts Store field names and UTM aliases', () => {
    const acquisition = sanitizeSessionAcquisition({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'pilot-launch',
      referrer: 'https://example.com/ref',
      landing_page: '/store/luna?utm_source=google',
      aiAgentSource: 'chatgpt',
    })
    expect(acquisition).toEqual({
      source: 'google',
      medium: 'cpc',
      campaign: 'pilot-launch',
      referrer: 'https://example.com/ref',
      landingUrl: '/store/luna?utm_source=google',
      aiAgentSource: 'chatgpt',
    })
    expect(sessionAcquisitionToMetadata(acquisition)).toMatchObject({
      source: 'google',
      campaign: 'pilot-launch',
    })
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

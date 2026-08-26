import {
  DISABLED_MERCHANT_SPONSORED_POLICY,
  VISUTRY_OWNED_SPONSORED_POLICY,
  isMerchantSponsoredUsageEnabled,
  resolveMerchantSponsoredUsagePolicy,
  sponsoredUsageLimitFor,
  sponsoredUsageFailureAction,
} from '@/modules/store/domain/merchant-sponsored-usage'

describe('Merchant sponsored usage policy', () => {
  const originalFlag = process.env.MERCHANT_SPONSORED_USAGE_ENABLED
  const originalNodeEnv = process.env.NODE_ENV
  const mutableEnv = process.env as Record<string, string | undefined>

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.MERCHANT_SPONSORED_USAGE_ENABLED
    else process.env.MERCHANT_SPONSORED_USAGE_ENABLED = originalFlag
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV
    else mutableEnv.NODE_ENV = originalNodeEnv
  })

  it('is disabled by default, including for reference pilots', () => {
    delete process.env.MERCHANT_SPONSORED_USAGE_ENABLED

    expect(isMerchantSponsoredUsageEnabled()).toBe(false)
    expect(resolveMerchantSponsoredUsagePolicy({})).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)
  })

  it('requires the global flag and explicit VisuTry-owned policy key', () => {
    process.env.MERCHANT_SPONSORED_USAGE_ENABLED = 'true'

    expect(isMerchantSponsoredUsageEnabled()).toBe(true)
    expect(resolveMerchantSponsoredUsagePolicy({})).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)
    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    })).toEqual(VISUTRY_OWNED_SPONSORED_POLICY)
  })

  it('defaults production to explicit merchant policy while preserving the false kill switch', () => {
    mutableEnv.NODE_ENV = 'production'
    delete process.env.MERCHANT_SPONSORED_USAGE_ENABLED

    expect(isMerchantSponsoredUsageEnabled()).toBe(true)
    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    })).toEqual(VISUTRY_OWNED_SPONSORED_POLICY)

    process.env.MERCHANT_SPONSORED_USAGE_ENABLED = 'false'
    expect(isMerchantSponsoredUsageEnabled()).toBe(false)
    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    })).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)
  })

  it('supports explicit policy keys without using merchant slugs or provenance', () => {
    process.env.MERCHANT_SPONSORED_USAGE_ENABLED = 'true'

    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    })).toEqual(VISUTRY_OWNED_SPONSORED_POLICY)

    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'UNKNOWN_POLICY',
    })).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)

    expect(resolveMerchantSponsoredUsagePolicy({})).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)
  })

  it('keeps Compare sponsorship at zero while generation has one allowance', () => {
    expect(sponsoredUsageLimitFor(VISUTRY_OWNED_SPONSORED_POLICY, 'SPONSORED_GENERATION')).toBe(1)
    expect(sponsoredUsageLimitFor(VISUTRY_OWNED_SPONSORED_POLICY, 'SPONSORED_COMPARE')).toBe(0)
  })

  it('releases on a definite pre-provider failure', () => {
    expect(sponsoredUsageFailureAction(new Error('blob upload failed'))).toBe('RELEASE')
  })

  it('retains the reservation when provider delivery is uncertain', () => {
    const error = Object.assign(new Error('provider request timed out'), {
      providerStarted: true,
    })
    expect(sponsoredUsageFailureAction(error)).toBe('RETAIN')
  })
})

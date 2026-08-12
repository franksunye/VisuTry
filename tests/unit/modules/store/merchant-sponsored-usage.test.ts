import {
  DISABLED_MERCHANT_SPONSORED_POLICY,
  VISUTRY_OWNED_SPONSORED_POLICY,
  resolveMerchantSponsoredUsagePolicy,
  sponsoredUsageLimitFor,
} from '@/modules/store/domain/merchant-sponsored-usage'

describe('Merchant sponsored usage policy', () => {
  it('enables the conservative VisuTry-owned reference policy', () => {
    const policy = resolveMerchantSponsoredUsagePolicy({ pilotType: 'REFERENCE' })

    expect(policy).toEqual(VISUTRY_OWNED_SPONSORED_POLICY)
    expect(policy.sponsoredGenerationLimit).toBe(1)
    expect(policy.rollingWindowHours).toBe(24)
    expect(policy.sponsoredCompareLimit).toBe(0)
  })

  it('supports explicit policy keys without using merchant slugs or provenance', () => {
    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
      pilotType: 'LIVE',
    })).toEqual(VISUTRY_OWNED_SPONSORED_POLICY)

    expect(resolveMerchantSponsoredUsagePolicy({
      sponsoredUsagePolicyKey: 'UNKNOWN_POLICY',
      pilotType: 'REFERENCE',
    })).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)

    expect(resolveMerchantSponsoredUsagePolicy({
      pilotType: 'LIVE',
    })).toEqual(DISABLED_MERCHANT_SPONSORED_POLICY)
  })

  it('keeps Compare sponsorship at zero while generation has one allowance', () => {
    expect(sponsoredUsageLimitFor(VISUTRY_OWNED_SPONSORED_POLICY, 'SPONSORED_GENERATION')).toBe(1)
    expect(sponsoredUsageLimitFor(VISUTRY_OWNED_SPONSORED_POLICY, 'SPONSORED_COMPARE')).toBe(0)
  })
})

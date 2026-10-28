import { expectedPremiumPlan, isPremiumCheckoutReady } from '@/lib/payment-entitlement'

describe('Premium checkout readiness (display-only)', () => {
  it.each(['PREMIUM_MONTHLY', 'PREMIUM_YEARLY', 'PREMIUM_MONTHLY_PROMO', 'PREMIUM_YEARLY_PROMO'])(
    'recognizes the subscription plan %s', (plan) => {
      expect(expectedPremiumPlan(plan)).toBe(plan)
      expect(isPremiumCheckoutReady(plan, { isPremiumActive: true, currentSubscriptionType: plan })).toBe(true)
    },
  )

  it('does not treat an inactive or mismatched subscription as ready', () => {
    expect(isPremiumCheckoutReady('PREMIUM_MONTHLY', { isPremiumActive: false, currentSubscriptionType: 'PREMIUM_MONTHLY' })).toBe(false)
    expect(isPremiumCheckoutReady('PREMIUM_YEARLY', { isPremiumActive: true, currentSubscriptionType: 'PREMIUM_MONTHLY' })).toBe(false)
  })

  it('rejects arbitrary query values and credit packs', () => {
    expect(expectedPremiumPlan('CREDITS_PACK')).toBeNull()
    expect(expectedPremiumPlan('PREMIUM_GIFT')).toBeNull()
    expect(expectedPremiumPlan(null)).toBeNull()
  })
})

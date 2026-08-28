import { billingTypeForMerchantPlan, commercialStatusForSubscription } from '@/modules/merchant/domain/merchant-billing'
import { merchantStripePriceMap } from '@/modules/merchant/application/merchant-billing-shared'

describe('Merchant billing runtime parity contract', () => {
  it('uses the same provider-independent plan and lifecycle semantics for both adapters', () => {
    const env = {
      STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID: 'price_launch',
      STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID: 'price_growth',
      STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID: 'price_scale',
      STRIPE_FOUNDING_PILOT_PRICE_ID: 'price_pilot',
    }
    const mapping = [...merchantStripePriceMap(env).values()]
    expect(mapping.map(({ planCode, billingType }) => [planCode, billingType])).toEqual([
      ['LAUNCH', billingTypeForMerchantPlan('LAUNCH')],
      ['GROWTH', billingTypeForMerchantPlan('GROWTH')],
      ['SCALE', billingTypeForMerchantPlan('SCALE')],
      ['FOUNDING_PILOT', billingTypeForMerchantPlan('FOUNDING_PILOT')],
    ])
    expect(commercialStatusForSubscription({ status: 'active' })).toBe('PAID_ACTIVE')
    expect(commercialStatusForSubscription({ status: 'active', cancelAtPeriodEnd: true })).toBe('CANCEL_AT_PERIOD_END')
    expect(commercialStatusForSubscription({ status: 'past_due' })).toBe('PAST_DUE')
  })
})

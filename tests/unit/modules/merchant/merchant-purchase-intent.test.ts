import {
  merchantPurchasePath,
  parseMerchantPurchaseIntent,
  resolveMerchantPurchaseAction,
} from '@/modules/merchant/domain/merchant-purchase-intent'

describe('Merchant self-service purchase intent', () => {
  it('accepts only canonical plan intents and never treats provider data as intent', () => {
    expect(parseMerchantPurchaseIntent('growth')).toBe('GROWTH')
    expect(parseMerchantPurchaseIntent('FOUNDING_PILOT')).toBe('FOUNDING_PILOT')
    expect(parseMerchantPurchaseIntent('price_live_123')).toBeNull()
    expect(parseMerchantPurchaseIntent('199')).toBeNull()
    expect(parseMerchantPurchaseIntent('ENTERPRISE')).toBeNull()
    expect(merchantPurchasePath('GROWTH')).toBe('/merchant?commercialIntent=GROWTH')
  })

  it('keeps Free outside Stripe and sends paid intents through checkout', () => {
    expect(resolveMerchantPurchaseAction({ intent: 'FREE' })).toBe('WORKSPACE')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', currentPlanCode: null, commercialStatus: null })).toBe('CHECKOUT')
  })

  it('uses the existing billing path instead of creating a second subscription', () => {
    expect(resolveMerchantPurchaseAction({
      intent: 'GROWTH', currentPlanCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
      stripeSubscriptionId: 'sub_1', subscriptionStatus: 'active',
    })).toBe('CHANGE_PLAN')
    expect(resolveMerchantPurchaseAction({
      intent: 'LAUNCH', currentPlanCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
      stripeSubscriptionId: 'sub_1', subscriptionStatus: 'active',
    })).toBe('CURRENT')
    expect(resolveMerchantPurchaseAction({
      intent: 'LAUNCH', currentPlanCode: 'LAUNCH', commercialStatus: 'PAST_DUE',
      stripeSubscriptionId: 'sub_1', subscriptionStatus: 'past_due',
    })).toBe('MANAGE_BILLING')
  })

  it('blocks duplicate Pilot purchase only while the canonical Pilot is active', () => {
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'LAUNCH', currentPlanCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })).toBe('CHECKOUT')
  })
})

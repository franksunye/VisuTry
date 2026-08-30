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

  it('maps normalized billing states to safe purchase actions', () => {
    const base = { reason: null, providerPlanCode: null, providerSubscriptionStatus: null, cancelAtPeriodEnd: false } as const
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', currentPlanCode: 'LAUNCH', billingState: { kind: 'VALID_SUBSCRIPTION', ...base, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'active' } })).toBe('CHANGE_PLAN')
    expect(resolveMerchantPurchaseAction({ intent: 'LAUNCH', currentPlanCode: 'LAUNCH', billingState: { kind: 'VALID_SUBSCRIPTION', ...base, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'active' } })).toBe('CURRENT')
    expect(resolveMerchantPurchaseAction({ intent: 'SCALE', currentPlanCode: 'SCALE', billingState: { kind: 'VALID_SUBSCRIPTION', ...base, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'active' } })).toBe('BILLING_RECOVERY')
    expect(resolveMerchantPurchaseAction({ intent: 'SCALE', currentPlanCode: 'LAUNCH', billingState: { kind: 'VALID_SUBSCRIPTION', ...base, providerPlanCode: 'SCALE', providerSubscriptionStatus: 'active' } })).toBe('BILLING_RECOVERY')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', currentPlanCode: 'LAUNCH', billingState: { kind: 'PAYMENT_ATTENTION', ...base, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'past_due' } })).toBe('MANAGE_BILLING')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', billingState: { kind: 'BILLING_DISABLED', ...base, reason: 'BILLING_POLICY_DISABLED' } })).toBe('BILLING_DISABLED')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', currentPlanCode: 'LAUNCH', billingState: { kind: 'SUBSCRIPTION_MISSING', ...base, reason: 'SUBSCRIPTION_NOT_FOUND', providerSubscriptionStatus: 'active' } })).toBe('BILLING_RECOVERY')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', currentPlanCode: 'LAUNCH', billingState: { kind: 'SUBSCRIPTION_INVALID', ...base, reason: 'WRONG_STRIPE_MODE' } })).toBe('BILLING_RECOVERY')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', billingState: { kind: 'PROVIDER_UNAVAILABLE', ...base, reason: 'PROVIDER_UNAVAILABLE' } })).toBe('BILLING_RECOVERY')
    expect(resolveMerchantPurchaseAction({ intent: 'GROWTH', billingState: { kind: 'NO_SUBSCRIPTION', ...base } })).toBe('CHECKOUT')
  })

  it('keeps the one-time Pilot guard ahead of billing recovery and policy states', () => {
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'LAUNCH', foundingPilotConsumed: true, billingState: { kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND', providerPlanCode: null, providerSubscriptionStatus: 'active', cancelAtPeriodEnd: false } })).toBe('DUPLICATE_PILOT')
  })

  it('allows the first Pilot and blocks every later Pilot purchase', () => {
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: null, commercialStatus: null, foundingPilotConsumed: false })).toBe('CHECKOUT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_EXPIRED' })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', foundingPilotConsumed: true })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'GROWTH', commercialStatus: 'PAID_ACTIVE', foundingPilotConsumed: true })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'SCALE', commercialStatus: 'PAID_ACTIVE', foundingPilotConsumed: true })).toBe('DUPLICATE_PILOT')
    expect(resolveMerchantPurchaseAction({ intent: 'FOUNDING_PILOT', currentPlanCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', foundingPilotConsumed: false })).toBe('CHECKOUT')
    expect(resolveMerchantPurchaseAction({ intent: 'LAUNCH', currentPlanCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })).toBe('CHECKOUT')
  })
})

import { normalizeMerchantBillingState } from '@/modules/merchant/domain/merchant-billing-state'
import { resolveMerchantBillingPolicy } from '@/modules/merchant/domain/merchant-billing-policy'

const policy = (overrides: Partial<Parameters<typeof resolveMerchantBillingPolicy>[0]> = {}) => resolveMerchantBillingPolicy({ environment: 'production', stripeMode: 'live', classification: 'REAL', ...overrides })

describe('Merchant normalized billing state', () => {
  it('distinguishes no subscription from an active-looking broken reference', () => {
    expect(normalizeMerchantBillingState({ policy: policy(), account: { stripeSubscriptionId: null, subscriptionStatus: null } })).toMatchObject({ kind: 'NO_SUBSCRIPTION' })
    expect(normalizeMerchantBillingState({ policy: policy(), account: { stripeSubscriptionId: null, subscriptionStatus: 'active' } })).toMatchObject({ kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND' })
  })

  it('requires an explicit provider verification result for an existing reference', () => {
    const account = { stripeSubscriptionId: 'sub-1', subscriptionStatus: 'active' }
    expect(normalizeMerchantBillingState({ policy: policy(), account, provider: { kind: 'VALID_SUBSCRIPTION', subscriptionId: 'sub-1', customerId: 'cus-1', priceId: 'price-launch', planCode: 'LAUNCH', subscriptionStatus: 'active', cancelAtPeriodEnd: false, currentPeriodStart: null, currentPeriodEnd: null } })).toMatchObject({ kind: 'VALID_SUBSCRIPTION', providerPlanCode: 'LAUNCH' })
    expect(normalizeMerchantBillingState({ policy: policy(), account, provider: { kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND' } })).toMatchObject({ kind: 'SUBSCRIPTION_MISSING' })
    expect(normalizeMerchantBillingState({ policy: policy(), account, provider: { kind: 'SUBSCRIPTION_INVALID', reason: 'WRONG_STRIPE_MODE' } })).toMatchObject({ kind: 'SUBSCRIPTION_INVALID', reason: 'WRONG_STRIPE_MODE' })
    expect(normalizeMerchantBillingState({ policy: policy(), account, provider: { kind: 'PROVIDER_UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' } })).toMatchObject({ kind: 'PROVIDER_UNAVAILABLE' })
  })

  it('keeps payment attention separate from a valid healthy subscription', () => {
    const account = { stripeSubscriptionId: 'sub-1', subscriptionStatus: 'past_due' }
    expect(normalizeMerchantBillingState({ policy: policy(), account, provider: { kind: 'PAYMENT_ATTENTION', subscriptionId: 'sub-1', customerId: 'cus-1', priceId: 'price-launch', planCode: 'LAUNCH', subscriptionStatus: 'past_due', cancelAtPeriodEnd: false, currentPeriodStart: null, currentPeriodEnd: null } })).toMatchObject({ kind: 'PAYMENT_ATTENTION' })
  })

  it('disables live billing for TEST/INTERNAL production workspaces without changing authorization', () => {
    expect(resolveMerchantBillingPolicy({ classification: 'TEST', environment: 'production', stripeMode: 'live' })).toMatchObject({ liveBillingAllowed: false, billingWritesAllowed: false })
    expect(resolveMerchantBillingPolicy({ classification: 'INTERNAL', environment: 'production', stripeMode: 'live' })).toMatchObject({ liveBillingAllowed: false, billingWritesAllowed: false })
    expect(resolveMerchantBillingPolicy({ classification: 'TEST', environment: 'preview', stripeMode: 'test' })).toMatchObject({ liveBillingAllowed: false, testBillingAllowed: true, billingWritesAllowed: true })
    expect(normalizeMerchantBillingState({ policy: resolveMerchantBillingPolicy({ classification: 'TEST', environment: 'production', stripeMode: 'live' }), account: { stripeSubscriptionId: 'sub-test', subscriptionStatus: 'active' } })).toMatchObject({ kind: 'BILLING_DISABLED' })
  })
})

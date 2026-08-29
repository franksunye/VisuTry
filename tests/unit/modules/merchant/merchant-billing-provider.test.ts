import { verifyMerchantSubscription } from '@/modules/merchant/application/merchant-billing-provider'

const env = {
  APP_ENV: 'production',
  VERCEL_ENV: 'production',
  STRIPE_MERCHANT_BILLING_MODE: 'live',
  STRIPE_SECRET_KEY: 'sk_live_test',
  STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID: 'price_launch',
  STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID: 'price_growth',
  STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID: 'price_scale',
  STRIPE_FOUNDING_PILOT_PRICE_ID: 'price_pilot',
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    livemode: true,
    customer: 'cus-1',
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: 1_700_000_000,
    current_period_end: 1_703_000_000,
    items: { data: [{ id: 'si-1', price: { id: 'price_launch' } }] },
    ...overrides,
  }
}

function reader(value: unknown) {
  return { subscriptions: { retrieve: jest.fn().mockResolvedValue(value) } }
}

describe('Merchant billing provider verification', () => {
  it('accepts only a matching Live, supported, manageable subscription', async () => {
    const result = await verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription()) })
    expect(result).toMatchObject({ kind: 'VALID_SUBSCRIPTION', planCode: 'LAUNCH', subscriptionStatus: 'active' })
  })

  it('detects a provider object from the wrong Stripe mode', async () => {
    const result = await verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription({ livemode: false })) })
    expect(result).toEqual({ kind: 'SUBSCRIPTION_INVALID', reason: 'WRONG_STRIPE_MODE' })
  })

  it('distinguishes missing provider objects from provider outages', async () => {
    const missing = await verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(Promise.reject(Object.assign(new Error('missing'), { code: 'resource_missing' }))) })
    expect(missing).toEqual({ kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND' })

    const outage = await verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(Promise.reject(Object.assign(new Error('rate limited'), { type: 'StripeRateLimitError' }))) })
    expect(outage).toEqual({ kind: 'PROVIDER_UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' })
  })

  it('detects customer, price, and lifecycle inconsistencies', async () => {
    await expect(verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription({ customer: 'cus-other' })) })).resolves.toEqual({ kind: 'SUBSCRIPTION_INVALID', reason: 'CUSTOMER_MISMATCH' })
    await expect(verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription({ items: { data: [{ id: 'si-1', price: { id: 'price_unknown' } }] } })) })).resolves.toEqual({ kind: 'SUBSCRIPTION_INVALID', reason: 'UNSUPPORTED_SUBSCRIPTION_PRICE' })
    await expect(verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription({ status: 'canceled' })) })).resolves.toEqual({ kind: 'SUBSCRIPTION_INVALID', reason: 'SUBSCRIPTION_STATUS_INVALID' })
    await expect(verifyMerchantSubscription({ subscriptionId: 'sub-1', customerId: 'cus-1', env, reader: reader(subscription({ status: 'past_due' })) })).resolves.toMatchObject({ kind: 'PAYMENT_ATTENTION' })
  })
})

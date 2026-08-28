/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantBillingAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    merchantBillingEvent: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { createMerchantCheckoutSession, processMerchantStripeEvent } from '@/modules/merchant/application/merchant-billing'
import { merchantStripePriceForPlan, merchantStripePriceMap } from '@/modules/merchant/application/merchant-billing-shared'

const account = {
  id: 'billing-account-1', merchantId: 'merchant-1', provider: 'STRIPE', stripeCustomerId: 'cus_merchant_1',
  stripeSubscriptionId: null, stripePriceId: null, stripeCheckoutSessionId: null, subscriptionStatus: null,
  cancelAtPeriodEnd: false, currentPeriodStart: null, currentPeriodEnd: null, lastEventCreatedAt: null, lastEventId: null,
}

const tx = {
  merchantBillingAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  merchantBillingEvent: { findUnique: jest.fn(), create: jest.fn() },
  merchant: { update: jest.fn() },
}

function configurePrices() {
  process.env.STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID = 'price_merchant_launch'
  process.env.STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID = 'price_merchant_growth'
  process.env.STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID = 'price_merchant_scale'
  process.env.STRIPE_FOUNDING_PILOT_PRICE_ID = 'price_founding_pilot'
}

describe('Merchant Stripe billing boundary', () => {
  beforeEach(() => {
    configurePrices(); jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear' })
    ;(prisma.merchantBillingAccount.findUnique as jest.Mock).mockResolvedValue(account)
    ;(prisma.merchantBillingAccount.create as jest.Mock).mockResolvedValue(account)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => callback(tx))
    tx.merchantBillingAccount.findUnique.mockResolvedValue(account)
    tx.merchantBillingEvent.findUnique.mockResolvedValue(null)
    tx.merchantBillingEvent.create.mockResolvedValue({ id: 'event-ledger-1' })
    tx.merchantBillingAccount.update.mockResolvedValue(account)
    tx.merchant.update.mockResolvedValue({ id: 'merchant-1', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' })
  })

  it('maps canonical Merchant plans only from server Price ID configuration', () => {
    expect(merchantStripePriceMap()).toMatchObject(new Map([
      ['price_merchant_launch', { priceId: 'price_merchant_launch', planCode: 'LAUNCH', billingType: 'subscription' }],
      ['price_merchant_growth', { priceId: 'price_merchant_growth', planCode: 'GROWTH', billingType: 'subscription' }],
      ['price_merchant_scale', { priceId: 'price_merchant_scale', planCode: 'SCALE', billingType: 'subscription' }],
      ['price_founding_pilot', { priceId: 'price_founding_pilot', planCode: 'FOUNDING_PILOT', billingType: 'one_time' }],
    ]))
    expect(merchantStripePriceForPlan('LAUNCH').priceId).toBe('price_merchant_launch')
  })

  it('creates checkout with a stable Merchant identity and server metadata', async () => {
    const result = await createMerchantCheckoutSession({ merchantId: 'merchant-1', planCode: 'LAUNCH', successUrl: 'http://localhost/en/merchant?billing=processing', cancelUrl: 'http://localhost/en/merchant?billing=cancelled' })
    expect(result).toMatchObject({ kind: 'checkout', planCode: 'LAUNCH', priceId: 'price_merchant_launch' })
    expect(result.url).toContain('/mock/checkout/')
  })

  it('enrolls only from a Merchant subscription webhook and ignores duplicate delivery', async () => {
    const event = {
      id: 'evt_merchant_subscription_1', created: 1_725_000_000, type: 'customer.subscription.updated',
      data: { object: { id: 'sub_merchant_1', customer: 'cus_merchant_1', status: 'active', cancel_at_period_end: false, current_period_start: 1_725_000_000, current_period_end: 1_727_592_000, metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1' }, items: { data: [{ id: 'si_1', price: { id: 'price_merchant_launch' } }] } } },
    } as any
    const first = await processMerchantStripeEvent(event)
    expect(first).toMatchObject({ handled: true, duplicate: false, merchantId: 'merchant-1' })
    expect(tx.merchant.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' }) }))

    tx.merchantBillingEvent.findUnique.mockResolvedValue({ id: 'event-ledger-1' })
    const second = await processMerchantStripeEvent(event)
    expect(second).toMatchObject({ handled: true, duplicate: true })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })
})

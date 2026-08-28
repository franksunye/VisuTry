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
import { compareBillingEvent } from '@/modules/merchant/domain/merchant-billing'

type TestBillingAccount = {
  id: string
  merchantId: string
  provider: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  stripeCheckoutSessionId: string | null
  subscriptionStatus: string | null
  cancelAtPeriodEnd: boolean
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  lastEventCreatedAt: number | null
  lastEventId: string | null
}

const account: TestBillingAccount = {
  id: 'billing-account-1', merchantId: 'merchant-1', provider: 'STRIPE', stripeCustomerId: 'cus_merchant_1',
  stripeSubscriptionId: null, stripePriceId: null, stripeCheckoutSessionId: null, subscriptionStatus: null,
  cancelAtPeriodEnd: false, currentPeriodStart: null, currentPeriodEnd: null, lastEventCreatedAt: null, lastEventId: null,
}

const tx = {
  merchantBillingAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  merchantBillingEvent: { findUnique: jest.fn(), create: jest.fn() },
  merchant: { update: jest.fn() },
}

let persistedAccount = { ...account }
let persistedMerchant = { planCode: null as string | null, commercialStatus: null as string | null, billingPeriodEnd: null as Date | null }
const eventLedger = new Set<string>()

function configurePrices() {
  process.env.STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID = 'price_merchant_launch'
  process.env.STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID = 'price_merchant_growth'
  process.env.STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID = 'price_merchant_scale'
  process.env.STRIPE_FOUNDING_PILOT_PRICE_ID = 'price_founding_pilot'
}

describe('Merchant Stripe billing boundary', () => {
  beforeEach(() => {
    configurePrices(); jest.clearAllMocks()
    persistedAccount = { ...account }
    persistedMerchant = { planCode: null, commercialStatus: null, billingPeriodEnd: null }
    eventLedger.clear()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear' })
    ;(prisma.merchantBillingAccount.findUnique as jest.Mock).mockResolvedValue(account)
    ;(prisma.merchantBillingAccount.create as jest.Mock).mockResolvedValue(account)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => callback(tx))
    tx.merchantBillingAccount.findUnique.mockImplementation(async () => ({ ...persistedAccount }))
    tx.merchantBillingEvent.findUnique.mockImplementation(async (input: any) => {
      const eventId = input.where?.provider_providerEventId?.providerEventId
      return eventId && eventLedger.has(eventId) ? { id: `event-ledger-${eventId}` } : null
    })
    tx.merchantBillingEvent.create.mockImplementation(async (input: any) => {
      eventLedger.add(input.data.providerEventId)
      return { id: `event-ledger-${input.data.providerEventId}` }
    })
    tx.merchantBillingAccount.update.mockImplementation(async (input: any) => {
      persistedAccount = { ...persistedAccount, ...input.data }
      return { ...persistedAccount }
    })
    tx.merchant.update.mockImplementation(async (input: any) => {
      persistedMerchant = { ...persistedMerchant, ...input.data }
      return { id: 'merchant-1', ...persistedMerchant }
    })
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

    const second = await processMerchantStripeEvent(event)
    expect(second).toMatchObject({ handled: true, duplicate: true })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })

  it('uses event id as the deterministic tie-breaker for same-second events', () => {
    expect(compareBillingEvent({ incomingCreated: 100, incomingEventId: 'evt_b', storedCreated: 100, storedEventId: 'evt_a' })).toBe(1)
    expect(compareBillingEvent({ incomingCreated: 100, incomingEventId: 'evt_a', storedCreated: 100, storedEventId: 'evt_b' })).toBe(-1)
    expect(compareBillingEvent({ incomingCreated: 100, incomingEventId: 'evt_a', storedCreated: 100, storedEventId: 'evt_a' })).toBe(0)
  })

  it('produces the same final state regardless of arrival order for same-second subscription events', async () => {
    const deleted = subscriptionEvent({ id: 'evt_a_deleted', type: 'customer.subscription.deleted', status: 'canceled' })
    const updated = subscriptionEvent({ id: 'evt_b_updated', type: 'customer.subscription.updated', status: 'active' })

    await processMerchantStripeEvent(deleted)
    await processMerchantStripeEvent(updated)
    const forward = billingState()

    persistedAccount = { ...account }
    persistedMerchant = { planCode: null, commercialStatus: null, billingPeriodEnd: null }
    eventLedger.clear()
    await processMerchantStripeEvent(updated)
    await processMerchantStripeEvent(deleted)
    const reverse = billingState()

    expect(reverse).toEqual(forward)
    expect(reverse).toMatchObject({ subscriptionStatus: 'active', merchantCommercialStatus: 'PAID_ACTIVE', lastEventId: 'evt_b_updated' })
  })

  it('ignores an older subscription event after a newer event', async () => {
    await processMerchantStripeEvent(subscriptionEvent({ id: 'evt_newer', created: 200, status: 'active' }))
    await processMerchantStripeEvent(subscriptionEvent({ id: 'evt_older', created: 100, status: 'canceled', type: 'customer.subscription.deleted' }))

    expect(billingState()).toMatchObject({ subscriptionStatus: 'active', merchantCommercialStatus: 'PAID_ACTIVE', lastEventId: 'evt_newer' })
    expect(tx.merchantBillingAccount.update).toHaveBeenCalledTimes(1)
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })

  it('applies the same cursor rule to stale invoice state transitions', async () => {
    persistedAccount = {
      ...account,
      stripeSubscriptionId: 'sub_merchant_1',
      stripePriceId: 'price_merchant_launch',
      lastEventCreatedAt: 200,
      lastEventId: 'evt_newer',
    }
    const event = {
      id: 'evt_older_invoice',
      created: 100,
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_merchant_1',
          customer: 'cus_merchant_1',
          subscription: 'sub_merchant_1',
          metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1' },
        },
      },
    } as any

    await processMerchantStripeEvent(event)

    expect(billingState()).toMatchObject({ lastEventCreatedAt: 200, lastEventId: 'evt_newer' })
    expect(tx.merchantBillingAccount.update).not.toHaveBeenCalled()
    expect(tx.merchant.update).not.toHaveBeenCalled()
  })

  it('does not extend a fixed 30-day Pilot period when the same Checkout is delivered again', async () => {
    const first = checkoutEvent({ id: 'evt_pilot_first', created: 1_725_000_000 })
    const replayedSession = checkoutEvent({ id: 'evt_pilot_replayed', created: 1_725_100_000 })

    await processMerchantStripeEvent(first)
    const firstPeriodEnd = persistedAccount.currentPeriodEnd
    await processMerchantStripeEvent(replayedSession)

    expect(firstPeriodEnd).toEqual(new Date(1_725_000_000 * 1000 + 30 * 86_400_000))
    expect(persistedAccount.currentPeriodEnd).toEqual(firstPeriodEnd)
    expect(persistedMerchant).toMatchObject({ planCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })
    expect(tx.merchantBillingAccount.update).toHaveBeenCalledTimes(1)
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })
})

function subscriptionEvent(input: { id: string; created?: number; type?: string; status?: string }) {
  return {
    id: input.id,
    created: input.created ?? 1_725_000_000,
    type: input.type ?? 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_merchant_1',
        customer: 'cus_merchant_1',
        status: input.status ?? 'active',
        cancel_at_period_end: false,
        current_period_start: 1_725_000_000,
        current_period_end: 1_727_592_000,
        metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1' },
        items: { data: [{ id: 'si_1', price: { id: 'price_merchant_launch' } }] },
      },
    },
  } as any
}

function checkoutEvent(input: { id: string; created: number }) {
  return {
    id: input.id,
    created: input.created,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_pilot_1',
        customer: 'cus_merchant_1',
        client_reference_id: 'merchant-1',
        payment_status: 'paid',
        metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1', stripePriceId: 'price_founding_pilot' },
      },
    },
  } as any
}

function billingState() {
  return {
    subscriptionStatus: persistedAccount.subscriptionStatus,
    stripeSubscriptionId: persistedAccount.stripeSubscriptionId,
    lastEventCreatedAt: persistedAccount.lastEventCreatedAt,
    lastEventId: persistedAccount.lastEventId,
    merchantCommercialStatus: persistedMerchant.commercialStatus,
    merchantPlanCode: persistedMerchant.planCode,
    merchantBillingPeriodEnd: persistedMerchant.billingPeriodEnd,
  }
}

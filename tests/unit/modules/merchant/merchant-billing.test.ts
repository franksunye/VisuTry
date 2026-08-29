/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantBillingAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    merchantBillingEvent: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
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
  $queryRaw: jest.fn(),
  merchantBillingAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  merchantBillingEvent: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  merchant: { update: jest.fn() },
}

let persistedAccount = { ...account }
let persistedMerchant = { planCode: null as string | null, commercialStatus: null as string | null, billingPeriodEnd: null as Date | null }
const eventLedger = new Map<string, { id: string; status: string; processingReason: string | null; duplicateCount: number; [key: string]: unknown }>()
const retrieveSubscription = jest.spyOn((stripe as any).subscriptions, 'retrieve')

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
    eventLedger.clear(); retrieveSubscription.mockReset()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear' })
    ;(prisma.merchantBillingAccount.findUnique as jest.Mock).mockResolvedValue(account)
    ;(prisma.merchantBillingAccount.create as jest.Mock).mockResolvedValue(account)
    ;(prisma.merchantBillingEvent.findUnique as jest.Mock).mockImplementation(async (input: any) => {
      const eventId = input.where?.provider_providerEventId?.providerEventId
      return eventId ? eventLedger.get(eventId) ?? null : null
    })
    ;(prisma.merchantBillingEvent.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.merchantBillingEvent.create as jest.Mock).mockImplementation(async (input: any) => {
      const id = `event-ledger-${input.data.providerEventId}`
      eventLedger.set(input.data.providerEventId, { id, status: input.data.status, processingReason: input.data.processingReason ?? null, duplicateCount: 0, ...input.data })
      return { id }
    })
    ;(prisma.merchantBillingEvent.update as jest.Mock).mockImplementation(async (input: any) => {
      const event = [...eventLedger.values()].find((row) => row.id === input.where?.id || row.id === `event-ledger-${input.where?.provider_providerEventId?.providerEventId}`)
      if (!event) return {}
      const next = { ...event, ...input.data }
      if (input.data.duplicateCount?.increment != null) next.duplicateCount = event.duplicateCount + input.data.duplicateCount.increment
      eventLedger.set(String(event.providerEventId), next)
      return next
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => {
      const ledgerSnapshot = new Map([...eventLedger.entries()].map(([key, value]) => [key, { ...value }]))
      const accountSnapshot = { ...persistedAccount }
      const merchantSnapshot = { ...persistedMerchant }
      try {
        return await callback(tx)
      } catch (error) {
        eventLedger.clear(); for (const [key, value] of ledgerSnapshot) eventLedger.set(key, value)
        persistedAccount = accountSnapshot
        persistedMerchant = merchantSnapshot
        throw error
      }
    })
    tx.merchantBillingAccount.findUnique.mockImplementation(async () => ({ ...persistedAccount }))
    tx.$queryRaw.mockImplementation(async () => [{ ...persistedAccount }])
    tx.merchantBillingEvent.findUnique.mockImplementation(async (input: any) => {
      const eventId = input.where?.provider_providerEventId?.providerEventId
      return eventId ? eventLedger.get(eventId) ?? null : null
    })
    tx.merchantBillingEvent.create.mockImplementation(async (input: any) => {
      const id = `event-ledger-${input.data.providerEventId}`
      eventLedger.set(input.data.providerEventId, { id, status: input.data.status, processingReason: input.data.processingReason ?? null, duplicateCount: 0, ...input.data })
      return { id }
    })
    tx.merchantBillingEvent.update.mockImplementation(async (input: any) => {
      const event = [...eventLedger.values()].find((row) => row.id === input.where?.id || row.id === `event-ledger-${input.where?.provider_providerEventId?.providerEventId}`)
      if (!event) return {}
      const next = { ...event, ...input.data }
      if (input.data.duplicateCount?.increment != null) next.duplicateCount = event.duplicateCount + input.data.duplicateCount.increment
      eventLedger.set(String(event.providerEventId), next)
      return next
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

  it('blocks a second Founding Pilot from an already active canonical Pilot', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE' })

    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).rejects.toMatchObject({ code: 'PILOT_EXISTS' })
  })

  it('blocks a second Founding Pilot from an expired canonical Pilot even without a receipt lookup hit', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_EXPIRED' })

    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).rejects.toMatchObject({ code: 'PILOT_EXISTS' })
  })

  it.each([
    ['former Pilot after Launch', { planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' }],
    ['former Pilot after Growth', { planCode: 'GROWTH', commercialStatus: 'PAID_ACTIVE' }],
  ])('blocks a second Founding Pilot for %s using canonical receipt history', async (_label, state) => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', ...state })
    ;(prisma.merchantBillingEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'pilot-receipt-1' })

    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).rejects.toMatchObject({ code: 'PILOT_EXISTS' })
    expect(prisma.merchantBillingEvent.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        merchantId: 'merchant-1',
        planCode: 'FOUNDING_PILOT',
        status: 'PROCESSED',
        stripeCheckoutSessionId: { not: null },
      }),
    }))
    expect((prisma.merchantBillingEvent.findFirst as jest.Mock).mock.calls[0][0].where.stripePriceId).toBeUndefined()
  })

  it('blocks a former Pilot after Stripe Price rotation using the canonical ledger plan identity', async () => {
    process.env.STRIPE_FOUNDING_PILOT_PRICE_ID = 'price_founding_pilot_replacement'
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: 'SCALE', commercialStatus: 'PAID_ACTIVE' })
    ;(prisma.merchantBillingEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'pilot-receipt-old-price', planCode: 'FOUNDING_PILOT', stripePriceId: 'price_founding_pilot_old' })

    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).rejects.toMatchObject({ code: 'PILOT_EXISTS' })
    expect(prisma.merchantBillingEvent.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ planCode: 'FOUNDING_PILOT' }) }))
  })

  it.each(['TEST', 'REAL'])('blocks a second Founding Pilot regardless of Merchant classification (%s)', async (classification) => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', classification })
    ;(prisma.merchantBillingEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'pilot-receipt-1' })

    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).rejects.toMatchObject({ code: 'PILOT_EXISTS' })
  })

  it('allows a first Founding Pilot when no canonical state or processed receipt exists', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: null, commercialStatus: null })
    await expect(createMerchantCheckoutSession({
      merchantId: 'merchant-1',
      planCode: 'FOUNDING_PILOT',
      successUrl: 'http://localhost/en/merchant?billing=processing',
      cancelUrl: 'http://localhost/en/merchant?billing=cancelled',
    })).resolves.toMatchObject({ kind: 'checkout', planCode: 'FOUNDING_PILOT', priceId: 'price_founding_pilot' })
  })

  it('returns one Stripe Checkout Session for duplicate browser Pilot requests before activation', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-1', name: 'North Star Eyewear', planCode: null, commercialStatus: null })
    const input = { merchantId: 'merchant-1', planCode: 'FOUNDING_PILOT' as const, successUrl: 'http://localhost/en/merchant?billing=processing', cancelUrl: 'http://localhost/en/merchant?billing=cancelled' }
    const [first, second] = await Promise.all([createMerchantCheckoutSession(input), createMerchantCheckoutSession(input)])
    expect(second.sessionId).toBe(first.sessionId)
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

  it('serializes concurrent delivery of the same event and applies entitlement once', async () => {
    let lockTail = Promise.resolve()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => {
      const previous = lockTail
      let release!: () => void
      lockTail = new Promise<void>((resolve) => { release = resolve })
      await previous
      try { return await callback(tx) } finally { release() }
    })

    const event = subscriptionEvent({ id: 'evt_concurrent_replay' })
    const results = await Promise.all(Array.from({ length: 50 }, () => processMerchantStripeEvent(event)))

    expect(results.filter((result) => !result.duplicate)).toHaveLength(1)
    expect(results.filter((result) => result.duplicate)).toHaveLength(49)
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'PROCESSED', duplicateCount: 49 })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
    expect(tx.merchantBillingAccount.update).toHaveBeenCalledTimes(1)
  })

  it('serializes overlapping checkout and subscription events without a plan regression', async () => {
    const checkout = checkoutSubscriptionEvent({ id: 'evt_checkout_overlap', created: 1_725_000_000 })
    const subscription = subscriptionEvent({ id: 'evt_subscription_overlap', created: 1_725_000_001 })
    retrieveSubscription.mockResolvedValue(subscription.data.object)
    let lockTail = Promise.resolve()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => {
      const previous = lockTail
      let release!: () => void
      lockTail = new Promise<void>((resolve) => { release = resolve })
      await previous
      try { return await callback(tx) } finally { release() }
    })

    await Promise.all([processMerchantStripeEvent(checkout), processMerchantStripeEvent(subscription)])

    expect(billingState()).toMatchObject({
      subscriptionStatus: 'active',
      merchantCommercialStatus: 'PAID_ACTIVE',
      lastEventId: 'evt_subscription_overlap',
    })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
    expect([eventLedger.get(checkout.id)?.status, eventLedger.get(subscription.id)?.status].sort()).toEqual(['IGNORED', 'PROCESSED'])
  })

  it('serializes overlapping subscription and invoice events with one final period', async () => {
    const subscription = subscriptionEvent({ id: 'evt_subscription_invoice', created: 1_725_000_001 })
    const invoice = invoiceEvent({ id: 'evt_invoice_overlap', created: 1_725_000_002 })
    retrieveSubscription.mockResolvedValue(subscription.data.object)
    let lockTail = Promise.resolve()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => {
      const previous = lockTail
      let release!: () => void
      lockTail = new Promise<void>((resolve) => { release = resolve })
      await previous
      try { return await callback(tx) } finally { release() }
    })

    await Promise.all([processMerchantStripeEvent(subscription), processMerchantStripeEvent(invoice)])

    expect(billingState()).toMatchObject({
      subscriptionStatus: 'active',
      merchantCommercialStatus: 'PAID_ACTIVE',
      lastEventId: 'evt_invoice_overlap',
    })
    expect(eventLedger.get(subscription.id)).toMatchObject({ status: 'PROCESSED' })
    expect(eventLedger.get(invoice.id)).toMatchObject({ status: 'PROCESSED' })
  })

  it('retries only recognized database concurrency failures with bounded attempts', async () => {
    const event = subscriptionEvent({ id: 'evt_db_retry' })
    let attempts = 0
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: unknown) => unknown) => {
      attempts += 1
      if (attempts < 3) throw Object.assign(new Error('deadlock detected'), { code: '40P01' })
      return callback(tx)
    })

    const result = await processMerchantStripeEvent(event)

    expect(result).toMatchObject({ handled: true, duplicate: false })
    expect(attempts).toBe(3)
    expect(persistedMerchant).toMatchObject({ planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' })
  })

  it('returns a retryable failure after concurrency retries are exhausted without canonical mutation', async () => {
    const event = subscriptionEvent({ id: 'evt_db_retry_exhausted' })
    let attempts = 0
    ;(prisma.$transaction as jest.Mock).mockImplementation(async () => {
      attempts += 1
      throw Object.assign(new Error('serialization failure'), { code: 'P2034' })
    })

    await expect(processMerchantStripeEvent(event)).rejects.toMatchObject({ code: 'DATABASE_SERIALIZATION_FAILURE', httpStatus: 503 })
    expect(attempts).toBe(3)
    expect(persistedMerchant).toMatchObject({ planCode: null, commercialStatus: null })
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'REJECTED', processingReason: 'DATABASE_SERIALIZATION_FAILURE' })
  })

  it('does not retry terminal billing validation errors', async () => {
    const event = subscriptionEvent({ id: 'evt_terminal_no_retry' })
    event.data.object.items.data[0].price.id = 'price_not_allowlisted'

    await expect(processMerchantStripeEvent(event)).rejects.toMatchObject({ code: 'UNSUPPORTED_PRICE' })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'REJECTED', processingReason: 'UNSUPPORTED_PRICE' })
  })

  it('retries a retryable rejected checkout event and activates exactly once', async () => {
    const event = checkoutSubscriptionEvent({ id: 'evt_retryable_checkout', created: 1_725_000_000 })
    const subscription = subscriptionEvent({ id: 'evt_subscription_for_checkout' }).data.object
    retrieveSubscription.mockRejectedValueOnce(new Error('Stripe subscription is not ready'))
      .mockResolvedValueOnce(subscription)

    await expect(processMerchantStripeEvent(event)).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_READY' })
    expect(persistedMerchant.planCode).toBeNull()
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'REJECTED', processingReason: 'SUBSCRIPTION_NOT_READY' })

    const retry = await processMerchantStripeEvent(event)

    expect(retry).toMatchObject({ handled: true, duplicate: false })
    expect(persistedMerchant).toMatchObject({ planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'PROCESSED', processingReason: null })
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
    expect(eventLedger.get(first.id)).toMatchObject({ planCode: 'FOUNDING_PILOT' })
    expect(tx.merchantBillingAccount.update).toHaveBeenCalledTimes(1)
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })

  it('records identity or price rejection without mutating the canonical Merchant state', async () => {
    const event = subscriptionEvent({ id: 'evt_unsupported_price' })
    event.data.object.items.data[0].price.id = 'price_not_allowlisted'

    await expect(processMerchantStripeEvent(event)).rejects.toMatchObject({ code: 'UNSUPPORTED_PRICE' })
    expect(tx.merchant.update).not.toHaveBeenCalled()
    expect(prisma.merchantBillingEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', processingReason: 'UNSUPPORTED_PRICE' }) }))

    const replay = await processMerchantStripeEvent(event)
    expect(replay).toMatchObject({ handled: true, duplicate: true })
    expect(tx.merchant.update).not.toHaveBeenCalled()
    expect(eventLedger.get(event.id)).toMatchObject({ status: 'REJECTED', processingReason: 'UNSUPPORTED_PRICE', duplicateCount: 1 })
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

function checkoutSubscriptionEvent(input: { id: string; created: number }) {
  return {
    id: input.id,
    created: input.created,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_subscription_1',
        customer: 'cus_merchant_1',
        client_reference_id: 'merchant-1',
        payment_status: 'paid',
        subscription: 'sub_merchant_1',
        metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1', stripePriceId: 'price_merchant_launch' },
      },
    },
  } as any
}

function invoiceEvent(input: { id: string; created: number }) {
  return {
    id: input.id,
    created: input.created,
    type: 'invoice.paid',
    data: {
      object: {
        id: `in_${input.id}`,
        customer: 'cus_merchant_1',
        subscription: 'sub_merchant_1',
        metadata: { billingPurpose: 'MERCHANT_PLAN', merchantId: 'merchant-1' },
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

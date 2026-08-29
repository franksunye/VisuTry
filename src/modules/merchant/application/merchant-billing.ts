import { Prisma } from '@prisma/client'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { isMockMode } from '@/lib/mocks'
import { COMMERCIAL_PLAN_VERSION, getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import { addDays, compareBillingEvent, commercialStatusForSubscription, type MerchantBillablePlanCode, type MerchantRecurringPlanCode } from '../domain/merchant-billing'
import { MERCHANT_BILLING_PROVIDER, MerchantBillingError, assertMerchantStripeEnvironment, isMerchantBillingMetadata, isRetryableMerchantBillingDatabaseError, isRetryableMerchantBillingErrorCode, merchantStripePriceForPlan, metadataRecord, resolveMerchantStripePrice, stripeId, unixDate } from './merchant-billing-shared'

export { MERCHANT_BILLING_PROVIDER, MerchantBillingError, assertMerchantStripeEnvironment, isRetryableMerchantBillingDatabaseError, isRetryableMerchantBillingErrorCode, merchantStripePriceMap, merchantStripePriceForPlan, resolveMerchantStripePrice } from './merchant-billing-shared'
export type { MerchantStripePrice } from './merchant-billing-shared'

type BillingAccountRow = {
  id: string; merchantId: string; provider: string; stripeCustomerId: string; stripeSubscriptionId: string | null; stripePriceId: string | null; stripeCheckoutSessionId: string | null; subscriptionStatus: string | null; cancelAtPeriodEnd: boolean; currentPeriodStart: Date | null; currentPeriodEnd: Date | null; lastEventCreatedAt: number | null; lastEventId: string | null
}
const billingAccountSelect = { id: true, merchantId: true, provider: true, stripeCustomerId: true, stripeSubscriptionId: true, stripePriceId: true, stripeCheckoutSessionId: true, subscriptionStatus: true, cancelAtPeriodEnd: true, currentPeriodStart: true, currentPeriodEnd: true, lastEventCreatedAt: true, lastEventId: true } as const
export type MerchantBillingSummary = BillingAccountRow & { maskedCustomerId: string | null; maskedSubscriptionId: string | null }

function mask(value: string | null) { return value ? `${value.slice(0, 4)}••••${value.slice(-4)}` : null }
function eventDate(event: Stripe.Event) { return new Date(event.created * 1000) }
function items(value: Stripe.Subscription | Record<string, unknown>) { return (value as { items?: { data?: Array<Record<string, unknown>> } }).items?.data ?? [] }
function subPrice(value: Stripe.Subscription | Record<string, unknown>) { return stripeId(items(value)[0]?.price as string | { id: string } | null | undefined) }
function subCustomer(value: Stripe.Subscription | Record<string, unknown>) { return stripeId((value as { customer?: string | { id: string } | null }).customer) }
function subId(value: Stripe.Subscription | Record<string, unknown>) { return stripeId((value as { id?: string | { id: string } | null }).id as string | { id: string } | null | undefined) }
function invoiceCustomer(value: Stripe.Invoice | Record<string, unknown>) { return stripeId((value as { customer?: string | { id: string } | null }).customer) }
function invoiceSubscription(value: Stripe.Invoice | Record<string, unknown>) { return stripeId((value as { subscription?: string | { id: string } | null }).subscription) }
function period(value: Stripe.Subscription | Record<string, unknown>, fallback: Date) { const row = value as { current_period_start?: number; current_period_end?: number }; return { start: unixDate(row.current_period_start) ?? fallback, end: unixDate(row.current_period_end) } }
function metadata(merchantId: string, planCode: MerchantBillablePlanCode, priceId: string) { return { billingPurpose: 'MERCHANT_PLAN', merchantId, requestedPlanCode: planCode, stripePriceId: priceId, pricingVersion: COMMERCIAL_PLAN_VERSION, entitlementVersion: COMMERCIAL_PLAN_VERSION } }
function eventPriceId(value: Record<string, unknown>, eventType: string) {
  const metadataPriceId = metadataRecord(value.metadata).stripePriceId
  if (metadataPriceId) return metadataPriceId
  if (eventType.startsWith('customer.subscription.')) return subPrice(value)
  if (eventType.startsWith('invoice.')) {
    const lines = (value.lines as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []
    return stripeId((lines[0]?.price ?? null) as string | { id: string } | null)
  }
  return null
}
function checkoutSessionId(value: Record<string, unknown>, eventType: string) {
  return eventType.startsWith('checkout.session.') ? stripeId(value.id as string | { id: string } | null | undefined) : null
}

function eventPlanCode(value: Record<string, unknown>, eventType: string): MerchantBillablePlanCode | null {
  const priceId = eventPriceId(value, eventType)
  if (!priceId) return null
  try {
    return resolveMerchantStripePrice(priceId).planCode
  } catch {
    // Invalid or rotated provider Prices must not be guessed into a
    // commercial identity. Validated events are written with the canonical
    // plan code; rejected events retain provider evidence only.
    return null
  }
}

async function merchantForBilling(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { id: true, name: true, planCode: true, commercialStatus: true } })
  if (!merchant) throw new MerchantBillingError('MERCHANT_NOT_FOUND', 'Merchant not found.', 404)
  return merchant
}

async function ensureAccount(merchantId: string, merchantName: string): Promise<BillingAccountRow> {
  const existing = await prisma.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect })
  if (existing) return existing as BillingAccountRow
  const client = stripe as any
  const customer = isMockMode && !client.customers?.create ? { id: `cus_mock_merchant_${merchantId}` } : await client.customers.create({ name: merchantName, metadata: { merchantId, billingPurpose: 'MERCHANT_PLAN' } }, { idempotencyKey: `merchant-customer:${merchantId}` })
  try {
    return await prisma.merchantBillingAccount.create({ data: { merchantId, provider: MERCHANT_BILLING_PROVIDER, stripeCustomerId: customer.id }, select: billingAccountSelect }) as BillingAccountRow
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') throw error
    const raced = await prisma.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect })
    if (!raced) throw error
    return raced as BillingAccountRow
  }
}

export async function getMerchantBillingSummary(input: { merchantId: string }): Promise<MerchantBillingSummary | null> {
  const account = await prisma.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId: input.merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect })
  return account ? { ...(account as BillingAccountRow), maskedCustomerId: mask(account.stripeCustomerId), maskedSubscriptionId: mask(account.stripeSubscriptionId) } : null
}

const FOUNDING_PILOT_RECEIPT_EVENT_TYPES = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] as const

/**
 * A Founding Pilot is a one-time commercial offer. Its processed receipt is
 * the durable fact that survives Pilot expiry and later plan changes.
 */
export async function hasMerchantFoundingPilotReceipt(input: { merchantId: string }, database: MerchantBillingDatabase = prisma): Promise<boolean> {
  const receipt = await database.merchantBillingEvent.findFirst({
    where: {
      provider: MERCHANT_BILLING_PROVIDER,
      merchantId: input.merchantId,
      planCode: 'FOUNDING_PILOT',
      status: 'PROCESSED',
      eventType: { in: [...FOUNDING_PILOT_RECEIPT_EVENT_TYPES] },
      stripeCheckoutSessionId: { not: null },
    },
    select: { id: true },
  })
  return Boolean(receipt)
}

export async function createMerchantCheckoutSession(input: { merchantId: string; planCode: MerchantBillablePlanCode; successUrl: string; cancelUrl: string }) {
  assertMerchantStripeEnvironment()
  const price = merchantStripePriceForPlan(input.planCode)
  const merchant = await merchantForBilling(input.merchantId)
  if (price.planCode === 'FOUNDING_PILOT') {
    const currentPilotState = merchant.planCode?.trim().toUpperCase() === 'FOUNDING_PILOT'
      || merchant.commercialStatus?.trim().toUpperCase() === 'PILOT_ACTIVE'
      || merchant.commercialStatus?.trim().toUpperCase() === 'PILOT_EXPIRED'
    const hasPilotReceipt = await hasMerchantFoundingPilotReceipt({ merchantId: merchant.id })
    if (currentPilotState || hasPilotReceipt) {
      throw new MerchantBillingError('PILOT_EXISTS', 'This Merchant has already used the Founding Pilot. Choose a monthly plan instead.', 409)
    }
  }
  const account = await ensureAccount(merchant.id, merchant.name)
  if (price.billingType === 'subscription' && account.stripeSubscriptionId && ['active', 'trialing', 'past_due', 'unpaid'].includes(account.subscriptionStatus ?? '')) throw new MerchantBillingError('SUBSCRIPTION_EXISTS', 'This Merchant already has a billing plan. Use Manage plan to change it.', 409)
  const session = await (stripe as any).checkout.sessions.create({ mode: price.billingType === 'subscription' ? 'subscription' : 'payment', customer: account.stripeCustomerId, line_items: [{ price: price.priceId, quantity: 1 }], success_url: input.successUrl, cancel_url: input.cancelUrl, client_reference_id: merchant.id, metadata: metadata(merchant.id, price.planCode, price.priceId), ...(price.billingType === 'subscription' ? { subscription_data: { metadata: metadata(merchant.id, price.planCode, price.priceId) } } : {}) }, { idempotencyKey: `merchant-checkout:${merchant.id}:${price.planCode}:${account.stripeCheckoutSessionId ?? 'new'}` })
  return { kind: 'checkout' as const, sessionId: String(session.id), url: session.url == null ? null : String(session.url), planCode: price.planCode, priceId: price.priceId }
}

export async function updateMerchantSubscription(input: { merchantId: string; planCode: MerchantRecurringPlanCode }) {
  assertMerchantStripeEnvironment()
  const price = merchantStripePriceForPlan(input.planCode)
  const account = await prisma.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId: input.merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect }) as BillingAccountRow | null
  if (!account?.stripeSubscriptionId) throw new MerchantBillingError('SUBSCRIPTION_NOT_FOUND', 'No active Merchant subscription was found.', 404)
  const subscription = await (stripe as any).subscriptions.retrieve(account.stripeSubscriptionId)
  if (subCustomer(subscription) !== account.stripeCustomerId) throw new MerchantBillingError('BILLING_IDENTITY_MISMATCH', 'The billing identity does not belong to this Merchant.', 409)
  const item = items(subscription)[0]
  if (!item?.id) throw new MerchantBillingError('SUBSCRIPTION_NOT_SUPPORTED', 'This subscription cannot be changed automatically.', 409)
  await (stripe as any).subscriptions.update(account.stripeSubscriptionId, { items: [{ id: item.id, price: price.priceId }], proration_behavior: 'create_prorations', metadata: metadata(input.merchantId, price.planCode, price.priceId) })
  return { kind: 'subscription_update' as const, subscriptionId: account.stripeSubscriptionId, planCode: input.planCode, priceId: price.priceId }
}

export async function createMerchantBillingPortalSession(input: { merchantId: string; returnUrl: string }) {
  assertMerchantStripeEnvironment()
  const account = await prisma.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId: input.merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect })
  if (!account?.stripeSubscriptionId) throw new MerchantBillingError('SUBSCRIPTION_NOT_FOUND', 'No active Merchant subscription was found.', 404)
  const portal = await (stripe as any).billingPortal.sessions.create({ customer: account.stripeCustomerId, return_url: input.returnUrl })
  return { url: String(portal.url) }
}

export async function enrollMerchantCommercialPlan(input: { merchantId: string; planCode: MerchantBillablePlanCode; effectiveFrom: Date; billingPeriodEnd: Date | null; commercialStatus: 'PAID_ACTIVE' | 'CANCEL_AT_PERIOD_END' | 'PAST_DUE' | 'PAYMENT_ACTION_REQUIRED' | 'EXPIRED' | 'PILOT_ACTIVE' | 'PILOT_EXPIRED'; pricingVersion?: string; entitlementVersion?: string; source: string }, txOverride?: any) {
  const run = (tx: any) => tx.merchant.update({ where: { id: input.merchantId }, data: { planCode: input.planCode, commercialStatus: input.commercialStatus, pricingVersion: input.pricingVersion ?? COMMERCIAL_PLAN_VERSION, entitlementVersion: input.entitlementVersion ?? COMMERCIAL_PLAN_VERSION, entitlementEffectiveFrom: input.effectiveFrom, billingPeriodEnd: input.billingPeriodEnd, commercialStage: input.planCode === 'FOUNDING_PILOT' ? 'MARKET_CAPTURE' : null }, select: { id: true, planCode: true, commercialStatus: true, billingPeriodEnd: true } })
  return txOverride ? run(txOverride) : prisma.$transaction(run)
}

type MerchantBillingDatabase = typeof prisma

async function findAccount(event: Stripe.Event, database: MerchantBillingDatabase = prisma): Promise<BillingAccountRow | null> {
  const object = event.data.object as Record<string, unknown>; const meta = metadataRecord(object.metadata); const customer = stripeId(object.customer as string | { id: string } | null | undefined); const subscription = stripeId(object.subscription as string | { id: string } | null | undefined) ?? (event.type.startsWith('customer.subscription.') ? String(object.id ?? '') : null)
  if (meta.merchantId) {
    const row = await database.merchantBillingAccount.findUnique({ where: { merchantId_provider: { merchantId: meta.merchantId, provider: MERCHANT_BILLING_PROVIDER } }, select: billingAccountSelect })
    if (row) return row as BillingAccountRow
    // Fall through to the provider identity so a known customer with bad or
    // stale metadata can be recorded as a rejected operational event instead
    // of disappearing as an unhandled webhook.
  }
  if (subscription) { const row = await database.merchantBillingAccount.findUnique({ where: { stripeSubscriptionId: subscription }, select: billingAccountSelect }); if (row) return row as BillingAccountRow }
  if (customer) { const row = await database.merchantBillingAccount.findUnique({ where: { stripeCustomerId: customer }, select: billingAccountSelect }); if (row) return row as BillingAccountRow }
  return null
}

async function recordRejectedEvent(event: Stripe.Event, account: BillingAccountRow, object: Record<string, unknown>, error: MerchantBillingError, database: MerchantBillingDatabase = prisma) {
  const data = {
    provider: MERCHANT_BILLING_PROVIDER,
    providerEventId: event.id,
    merchantId: account.merchantId,
    billingAccountId: account.id,
    eventType: event.type,
    stripeCustomerId: stripeId(object.customer as string | { id: string } | null | undefined),
    stripeSubscriptionId: stripeId(object.subscription as string | { id: string } | null | undefined) ?? (event.type.startsWith('customer.subscription.') ? String(object.id ?? '') : null),
    stripePriceId: eventPriceId(object, event.type),
    planCode: eventPlanCode(object, event.type),
    stripeCheckoutSessionId: checkoutSessionId(object, event.type),
    eventCreatedAt: event.created,
    status: 'REJECTED',
    processingReason: error.code,
    processedAt: new Date(),
  }
  const existing = await database.merchantBillingEvent.findUnique({ where: { provider_providerEventId: { provider: MERCHANT_BILLING_PROVIDER, providerEventId: event.id } }, select: { id: true } })
  if (existing) {
    await database.merchantBillingEvent.update({ where: { id: existing.id }, data: { ...data, duplicateCount: { increment: 1 }, lastDuplicateAt: new Date() } })
    return
  }
  try {
    await database.merchantBillingEvent.create({ data })
  } catch (recordingError) {
    if ((recordingError as { code?: string }).code !== 'P2002') throw recordingError
    await database.merchantBillingEvent.update({ where: { provider_providerEventId: { provider: MERCHANT_BILLING_PROVIDER, providerEventId: event.id } }, data: { ...data, duplicateCount: { increment: 1 }, lastDuplicateAt: new Date() } })
  }
}

async function retrieveSubscription(id: string) { try { return await (stripe as any).subscriptions.retrieve(id) as Stripe.Subscription } catch { return null } }
function assertIdentity(account: BillingAccountRow, customer: string | null, merchantId: string | null) { if (customer && customer !== account.stripeCustomerId) throw new MerchantBillingError('BILLING_IDENTITY_MISMATCH', 'Stripe billing identity does not match this Merchant.', 409); if (merchantId && merchantId !== account.merchantId) throw new MerchantBillingError('BILLING_IDENTITY_MISMATCH', 'Stripe Merchant metadata does not match this billing identity.', 409) }
function isNewerBillingEvent(account: BillingAccountRow, event: Stripe.Event) { return compareBillingEvent({ incomingCreated: event.created, incomingEventId: event.id, storedCreated: account.lastEventCreatedAt, storedEventId: account.lastEventId }) === 1 }

async function applySubscription(tx: any, account: BillingAccountRow, value: Stripe.Subscription | Record<string, unknown>, event: Stripe.Event, deleted = false): Promise<boolean> {
  const meta = metadataRecord(value.metadata); assertIdentity(account, subCustomer(value), meta.merchantId || account.merchantId)
  if (!isNewerBillingEvent(account, event)) return false
  const priceId = subPrice(value) ?? account.stripePriceId; if (!priceId) throw new MerchantBillingError('SUBSCRIPTION_PRICE_MISSING', 'Stripe subscription price is missing.', 409)
  const price = resolveMerchantStripePrice(priceId); if (price.billingType !== 'subscription') throw new MerchantBillingError('UNSUPPORTED_PRICE', 'This Stripe price is not a Merchant monthly plan.', 409)
  const dates = period(value, eventDate(event)); const rawStatus = String((value as { status?: unknown }).status ?? (deleted ? 'canceled' : 'active')); const cancel = Boolean((value as { cancel_at_period_end?: unknown }).cancel_at_period_end); const status = deleted ? 'EXPIRED' : commercialStatusForSubscription({ status: rawStatus, cancelAtPeriodEnd: cancel })
  await tx.merchantBillingAccount.update({ where: { id: account.id }, data: { stripeSubscriptionId: deleted ? null : subId(value), stripePriceId: price.priceId, subscriptionStatus: deleted ? 'canceled' : rawStatus, cancelAtPeriodEnd: cancel, currentPeriodStart: dates.start, currentPeriodEnd: dates.end, lastEventCreatedAt: event.created, lastEventId: event.id } })
  await enrollMerchantCommercialPlan({ merchantId: account.merchantId, planCode: price.planCode, effectiveFrom: dates.start, billingPeriodEnd: dates.end, commercialStatus: status, source: `stripe:${event.type}` }, tx)
  return true
}

async function applyCheckout(tx: any, account: BillingAccountRow, session: Stripe.Checkout.Session | Record<string, unknown>, event: Stripe.Event, subscription: Stripe.Subscription | null = null): Promise<boolean> {
  const meta = metadataRecord(session.metadata); assertIdentity(account, stripeId(session.customer as string | { id: string } | null | undefined), meta.merchantId || String(session.client_reference_id ?? '')); if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return false
  if (account.stripeCheckoutSessionId === String(session.id) || !isNewerBillingEvent(account, event)) return false
  const price = resolveMerchantStripePrice(meta.stripePriceId)
  if (price.billingType === 'one_time') { const start = eventDate(event); const end = addDays(start, 30); await tx.merchantBillingAccount.update({ where: { id: account.id }, data: { stripePriceId: price.priceId, stripeCheckoutSessionId: String(session.id), subscriptionStatus: 'paid', currentPeriodStart: start, currentPeriodEnd: end, lastEventCreatedAt: event.created, lastEventId: event.id } }); await enrollMerchantCommercialPlan({ merchantId: account.merchantId, planCode: price.planCode, effectiveFrom: start, billingPeriodEnd: end, commercialStatus: 'PILOT_ACTIVE', source: `stripe:${event.type}` }, tx); return true }
  const id = stripeId(session.subscription as string | { id: string } | null | undefined); if (!id) throw new MerchantBillingError('SUBSCRIPTION_NOT_FOUND', 'Stripe did not provide the Merchant subscription.', 409); if (!subscription) throw new MerchantBillingError('SUBSCRIPTION_NOT_READY', 'Merchant subscription is still being confirmed.', 409); const applied = await applySubscription(tx, { ...account, stripeCheckoutSessionId: String(session.id) }, subscription, event); if (applied) await tx.merchantBillingAccount.update({ where: { id: account.id }, data: { stripeCheckoutSessionId: String(session.id) } }); return applied
}

async function applyInvoice(tx: any, account: BillingAccountRow, invoice: Stripe.Invoice | Record<string, unknown>, event: Stripe.Event, subscription: Stripe.Subscription | null = null): Promise<boolean> {
  assertIdentity(account, invoiceCustomer(invoice), null); if (!isNewerBillingEvent(account, event)) return false; const id = invoiceSubscription(invoice) ?? account.stripeSubscriptionId; if (!id) return false
  if (subscription) return applySubscription(tx, account, event.type === 'invoice.payment_failed' ? { ...subscription, status: 'past_due' } : subscription, event)
  const price = account.stripePriceId ? resolveMerchantStripePrice(account.stripePriceId) : null; if (!price || price.billingType !== 'subscription') return false; const status = event.type === 'invoice.payment_failed' ? 'PAST_DUE' : 'PAID_ACTIVE'; await tx.merchantBillingAccount.update({ where: { id: account.id }, data: { subscriptionStatus: status === 'PAID_ACTIVE' ? 'active' : 'past_due', lastEventCreatedAt: event.created, lastEventId: event.id } }); await enrollMerchantCommercialPlan({ merchantId: account.merchantId, planCode: price.planCode, effectiveFrom: account.currentPeriodStart ?? eventDate(event), billingPeriodEnd: account.currentPeriodEnd, commercialStatus: status, source: `stripe:${event.type}` }, tx); return true
}

const supported = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_succeeded', 'invoice.payment_failed'])
export function isMerchantStripeEventCandidate(event: Stripe.Event) { return supported.has(event.type) && isMerchantBillingMetadata((event.data.object as Record<string, unknown>).metadata) }
export type MerchantBillingEventResult = { handled: boolean; duplicate: boolean; merchantId?: string; eventType?: string }

type PreparedMerchantBillingEvent = { subscription: Stripe.Subscription | null }

async function prepareMerchantBillingEvent(event: Stripe.Event, account: BillingAccountRow, object: Record<string, unknown>): Promise<PreparedMerchantBillingEvent> {
  if (event.type.startsWith('checkout.session.') && (object.payment_status === 'paid' || object.payment_status === 'no_payment_required')) {
    const price = resolveMerchantStripePrice(metadataRecord(object.metadata).stripePriceId)
    if (price.billingType === 'subscription') {
      const id = stripeId(object.subscription as string | { id: string } | null | undefined)
      if (!id) throw new MerchantBillingError('SUBSCRIPTION_NOT_FOUND', 'Stripe did not provide the Merchant subscription.', 409)
      const subscription = await retrieveSubscription(id)
      if (!subscription) throw new MerchantBillingError('SUBSCRIPTION_NOT_READY', 'Merchant subscription is still being confirmed.', 409)
      return { subscription }
    }
  }

  if (event.type.startsWith('invoice.')) {
    const id = invoiceSubscription(object) ?? account.stripeSubscriptionId
    return { subscription: id ? await retrieveSubscription(id) : null }
  }

  return { subscription: null }
}

async function lockBillingAccount(tx: any, accountId: string): Promise<BillingAccountRow | null> {
  // The event ledger has foreign keys to both MerchantBillingAccount and
  // Merchant. Locking the account first prevents two new event inserts from
  // holding FK key-share locks while they wait to update this same account.
  const rows = await tx.$queryRaw(Prisma.sql`
    SELECT "id", "merchantId", "provider", "stripeCustomerId", "stripeSubscriptionId",
      "stripePriceId", "stripeCheckoutSessionId", "subscriptionStatus", "cancelAtPeriodEnd",
      "currentPeriodStart", "currentPeriodEnd", "lastEventCreatedAt", "lastEventId"
    FROM "MerchantBillingAccount"
    WHERE "id" = ${accountId}
    FOR UPDATE
  `) as BillingAccountRow[]
  return rows[0] ?? null
}

const MAX_BILLING_TRANSACTION_ATTEMPTS = 3
const BILLING_TRANSACTION_MAX_WAIT_MS = 15_000
const BILLING_TRANSACTION_TIMEOUT_MS = 15_000

function waitForBillingRetry(attempt: number): Promise<void> {
  const delayMs = 10 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 15)
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

async function runBillingTransaction<T>(database: MerchantBillingDatabase, operation: (tx: any) => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_BILLING_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      // The account row lock is the serialization primitive for this bounded
      // aggregate. Read Committed avoids PostgreSQL Serializable snapshot
      // aborts when a burst of webhook deliveries all waits on that lock.
      return await database.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: BILLING_TRANSACTION_MAX_WAIT_MS,
        timeout: BILLING_TRANSACTION_TIMEOUT_MS,
      })
    } catch (error) {
      lastError = error
      if (!isRetryableMerchantBillingDatabaseError(error)) throw error
      if (attempt === MAX_BILLING_TRANSACTION_ATTEMPTS) break
      await waitForBillingRetry(attempt)
    }
  }
  throw new MerchantBillingError('DATABASE_SERIALIZATION_FAILURE', 'Merchant billing is temporarily busy. Stripe can safely retry this event.', 503, { retryable: true, attempts: MAX_BILLING_TRANSACTION_ATTEMPTS, causeCode: (lastError as { code?: string })?.code ?? 'DATABASE_CONCURRENCY' })
}

export async function processMerchantStripeEvent(event: Stripe.Event, database: MerchantBillingDatabase = prisma): Promise<MerchantBillingEventResult> {
  if (!supported.has(event.type)) return { handled: false, duplicate: false }
  const account = await findAccount(event, database); if (!account) return { handled: false, duplicate: false }; const object = event.data.object as Record<string, unknown>
  try {
    // Stripe provider reads happen before the database transaction. This
    // keeps the account/ledger critical section deterministic and short.
    const prepared = await prepareMerchantBillingEvent(event, account, object)
    const result = await runBillingTransaction(database, async (tx) => {
      // Every Merchant billing event transaction acquires the same account row
      // lock before touching the event ledger. The FK write therefore cannot
      // participate in the prior deadlock cycle.
      const locked = await lockBillingAccount(tx, account.id); if (!locked) throw new MerchantBillingError('BILLING_IDENTITY_NOT_FOUND', 'Merchant billing identity was not found.', 409)
      const existing = await tx.merchantBillingEvent.findUnique({ where: { provider_providerEventId: { provider: MERCHANT_BILLING_PROVIDER, providerEventId: event.id } }, select: { id: true, status: true, processingReason: true } })
      let ledgerId: string
      if (existing) {
        if (existing.status !== 'REJECTED' || !isRetryableMerchantBillingErrorCode(existing.processingReason)) {
          await tx.merchantBillingEvent.update({ where: { id: existing.id }, data: { duplicateCount: { increment: 1 }, lastDuplicateAt: new Date() } })
          return { handled: true, duplicate: true }
        }
        ledgerId = existing.id
        const planCode = eventPlanCode(object, event.type)
        await tx.merchantBillingEvent.update({ where: { id: ledgerId }, data: { status: 'RECEIVED', processingReason: null, processedAt: null, ...(planCode ? { planCode } : {}), duplicateCount: { increment: 1 }, lastDuplicateAt: new Date() } })
      } else {
        const ledger = await tx.merchantBillingEvent.create({ data: { provider: MERCHANT_BILLING_PROVIDER, providerEventId: event.id, merchantId: locked.merchantId, billingAccountId: locked.id, eventType: event.type, planCode: eventPlanCode(object, event.type), stripeCustomerId: stripeId(object.customer as string | { id: string } | null | undefined), stripeSubscriptionId: stripeId(object.subscription as string | { id: string } | null | undefined) ?? (event.type.startsWith('customer.subscription.') ? String(object.id ?? '') : null), stripePriceId: eventPriceId(object, event.type), stripeCheckoutSessionId: checkoutSessionId(object, event.type), eventCreatedAt: event.created, status: 'RECEIVED' }, select: { id: true } })
        ledgerId = ledger.id
      }
      let applied = false
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') applied = await applyCheckout(tx, locked, object as unknown as Stripe.Checkout.Session, event, prepared.subscription)
      else if (event.type.startsWith('customer.subscription.')) applied = await applySubscription(tx, locked, object as unknown as Stripe.Subscription, event, event.type === 'customer.subscription.deleted')
      else applied = await applyInvoice(tx, locked, object as unknown as Stripe.Invoice, event, prepared.subscription)
      const reason = applied ? null : !isNewerBillingEvent(locked, event) ? 'OUT_OF_ORDER' : event.type.startsWith('checkout.session.') ? 'PAYMENT_NOT_CONFIRMED' : 'NO_STATE_CHANGE'
      await tx.merchantBillingEvent.update({ where: { id: ledgerId }, data: { status: applied ? 'PROCESSED' : 'IGNORED', processingReason: reason, processedAt: new Date() } })
      return { handled: true, duplicate: false }
    })
    return { ...result, merchantId: account.merchantId, eventType: event.type }
  } catch (error) {
    // Keep a small operational record for rejected provider events without
    // allowing a rejected event to mutate the canonical billing state.
    if (error instanceof MerchantBillingError) await recordRejectedEvent(event, account, object, error, database)
    throw error
  }
}

export function merchantBillingPlanDefinition(planCode: MerchantBillablePlanCode) { return getMerchantPlanDefinition(planCode) }

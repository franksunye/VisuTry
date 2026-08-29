import type Stripe from 'stripe'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { computeMerchantPilotRevenueCents, type MerchantPilotRevenueEvidence } from '../domain/merchant-commercial-kpis'
import { getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import type { MerchantBillablePlanCode } from '../domain/merchant-billing'
import { getMerchantCommercialState } from './merchant-commercial-entitlements'
import { isMerchantBillingMetadata, merchantStripePriceForPlan, metadataRecord } from './merchant-billing-shared'
import { processMerchantStripeEvent, type MerchantBillingEventResult } from './merchant-billing'
import {
  PREVIEW_QA_CLASSIFICATION_SOURCE,
  PREVIEW_QA_MERCHANTS,
  PREVIEW_QA_REASON_PREFIX,
  PREVIEW_QA_USAGE_THRESHOLDS,
  assertPreviewQaMerchant,
  parsePreviewQaMerchantAlias,
  PreviewQaGuardError,
  type PreviewQaMerchantAlias,
  type PreviewQaUsageThreshold,
  usageCountForThreshold,
  assertPreviewQaDatabaseIdentity,
  validatePreviewQaEnvironment,
} from './merchant-preview-qa-guard'

export {
  PREVIEW_QA_CLASSIFICATION_SOURCE,
  PREVIEW_QA_ENVIRONMENT,
  PREVIEW_QA_MERCHANTS,
  PREVIEW_QA_REASON_PREFIX,
  PREVIEW_QA_USAGE_THRESHOLDS,
  assertPreviewQaMerchant,
  parsePreviewQaMerchantAlias,
  PreviewQaGuardError,
  usageCountForThreshold,
  assertPreviewQaDatabaseIdentity,
  validatePreviewQaEnvironment,
} from './merchant-preview-qa-guard'

/**
 * G4-C Preview-only QA boundary.
 *
 * This module intentionally has no HTTP route and no production admin entry
 * point. It is called by the bounded operator CLI and by tests only. Paid
 * enrollment is never synthesized here: a merchant must already have a
 * successful Stripe TEST ledger event before a lifecycle fixture can mutate
 * its period or usage.
 */

const qaMerchantSelect = {
  id: true,
  slug: true,
  name: true,
  classification: true,
  classificationSource: true,
  classificationReason: true,
  status: true,
  planCode: true,
  commercialStatus: true,
  commercialStage: true,
  pricingVersion: true,
  entitlementVersion: true,
  commerceSessionAllowance: true,
  standardRenderAllowance: true,
  campaignAllowance: true,
  entitlementEffectiveFrom: true,
  billingPeriodEnd: true,
  createdAt: true,
} satisfies Prisma.MerchantSelect

type QaMerchantRow = Prisma.MerchantGetPayload<{ select: typeof qaMerchantSelect }>

export type PreviewQaMerchantSnapshot = {
  merchantId: string
  classification: string
  merchantStatus: string
  planCode: string | null
  persistedCommercialStatus: string | null
  billingPeriodEnd: string | null
  commercial: {
    kind: string
    status: string
    planCode: string | null
    period: { kind: string; start: string | null; end: string | null }
    threshold: string | null
    usage: { aiCommerceSessions: number; activeCampaigns: number; catalogItems: number; standardTryOnGenerations: number }
    aiCommerceSessionLimit: number | null
    aiCommerceSessionPercentage: number | null
    featureAvailability: Record<string, boolean>
  }
  activeStoreCount: number
  activeCampaignCount: number
  catalogItemCount: number
  billingAccount: {
    exists: boolean
    subscriptionStatus: string | null
    hasStripeCustomer: boolean
    hasStripeSubscription: boolean
    stripePriceId: string | null
    lastEventCreatedAt: number | null
    lastEventId: string | null
  }
  billingEventCount: number
}

async function loadQaMerchant(aliasValue: unknown): Promise<{ alias: PreviewQaMerchantAlias; row: QaMerchantRow }> {
  validatePreviewQaEnvironment()
  await assertPreviewQaDatabaseIdentity(prisma)
  const alias = parsePreviewQaMerchantAlias(aliasValue)
  const definition = PREVIEW_QA_MERCHANTS[alias]
  const row = await prisma.merchant.findUnique({ where: { slug: definition.slug }, select: qaMerchantSelect })
  if (!row) throw new PreviewQaGuardError('QA_MERCHANT_NOT_FOUND', `Run ensure first; ${alias} (${definition.slug}) does not exist.`)
  assertPreviewQaMerchant(row, alias)
  if (row.classificationSource !== PREVIEW_QA_CLASSIFICATION_SOURCE || !row.classificationReason?.startsWith(PREVIEW_QA_REASON_PREFIX)) {
    throw new PreviewQaGuardError('QA_MERCHANT_OWNERSHIP_REQUIRED', `Refusing a TEST Merchant not created by this harness: ${row.id}.`)
  }
  return { alias, row }
}

export async function snapshotPreviewQaMerchant(aliasValue: unknown): Promise<PreviewQaMerchantSnapshot> {
  const { row } = await loadQaMerchant(aliasValue)
  const [commercial, account, activeStoreCount, activeCampaignCount, catalogItemCount, billingEventCount] = await Promise.all([
    getMerchantCommercialState({ merchantId: row.id }),
    prisma.merchantBillingAccount.findUnique({
      where: { merchantId_provider: { merchantId: row.id, provider: 'STRIPE' } },
      select: { subscriptionStatus: true, stripeCustomerId: true, stripeSubscriptionId: true, stripePriceId: true, lastEventCreatedAt: true, lastEventId: true },
    }),
    prisma.experience.count({ where: { merchantId: row.id, type: 'STORE', status: 'ACTIVE' } }),
    prisma.experience.count({ where: { merchantId: row.id, type: 'CAMPAIGN', status: 'ACTIVE' } }),
    prisma.merchantFrame.count({ where: { merchantId: row.id } }),
    prisma.merchantBillingEvent.count({ where: { merchantId: row.id, provider: 'STRIPE' } }),
  ])
  return {
    merchantId: row.id,
    classification: String(row.classification),
    merchantStatus: String(row.status),
    planCode: row.planCode,
    persistedCommercialStatus: row.commercialStatus,
    billingPeriodEnd: row.billingPeriodEnd?.toISOString() ?? null,
    commercial: {
      kind: commercial.commercialState,
      status: commercial.status,
      planCode: commercial.planCode,
      period: { kind: commercial.period.kind, start: commercial.period.start?.toISOString() ?? null, end: commercial.period.end?.toISOString() ?? null },
      threshold: commercial.threshold,
      usage: commercial.usage,
      aiCommerceSessionLimit: commercial.aiCommerceSessionLimit,
      aiCommerceSessionPercentage: commercial.aiCommerceSessionPercentage,
      featureAvailability: commercial.featureAvailability,
    },
    activeStoreCount,
    activeCampaignCount,
    catalogItemCount,
    billingAccount: {
      exists: Boolean(account),
      subscriptionStatus: account?.subscriptionStatus ?? null,
      hasStripeCustomer: Boolean(account?.stripeCustomerId),
      hasStripeSubscription: Boolean(account?.stripeSubscriptionId),
      stripePriceId: account?.stripePriceId ?? null,
      lastEventCreatedAt: account?.lastEventCreatedAt ?? null,
      lastEventId: account?.lastEventId ?? null,
    },
    billingEventCount,
  }
}

export async function ensurePreviewQaMerchants(input: { userId?: string | null } = {}) {
  validatePreviewQaEnvironment()
  await assertPreviewQaDatabaseIdentity(prisma)
  const aliases = Object.keys(PREVIEW_QA_MERCHANTS) as PreviewQaMerchantAlias[]
  const existing = await Promise.all(aliases.map(async (alias) => {
    const definition = PREVIEW_QA_MERCHANTS[alias]
    return { alias, row: await prisma.merchant.findUnique({ where: { slug: definition.slug }, select: qaMerchantSelect }) }
  }))
  for (const item of existing) {
    if (!item.row) continue
    assertPreviewQaMerchant(item.row, item.alias)
    if (item.row.classificationSource !== PREVIEW_QA_CLASSIFICATION_SOURCE || !item.row.classificationReason?.startsWith(PREVIEW_QA_REASON_PREFIX)) {
      throw new PreviewQaGuardError('QA_MERCHANT_OWNERSHIP_REQUIRED', `Refusing a TEST Merchant not created by this harness: ${item.row.id}.`)
    }
  }

  if (input.userId) {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } })
    if (!user) throw new PreviewQaGuardError('QA_USER_NOT_FOUND', `QA membership user was not found: ${input.userId}.`)
  }

  const rows = await prisma.$transaction(async (tx) => Promise.all(existing.map(async ({ alias, row }) => {
    const definition = PREVIEW_QA_MERCHANTS[alias]
    const merchant = row ?? await tx.merchant.create({
      data: {
        slug: definition.slug,
        name: definition.name,
        status: 'ACTIVE',
        pilotType: 'LIVE',
        referenceData: false,
        classification: 'TEST',
        classificationSource: PREVIEW_QA_CLASSIFICATION_SOURCE,
        classificationReason: `${PREVIEW_QA_REASON_PREFIX} ${alias}; non-commercial test data.`,
        planCode: 'FREE',
        commercialStatus: 'FREE',
        pricingVersion: 'commercial-v1',
        entitlementVersion: 'commercial-v1',
      },
      select: qaMerchantSelect,
    })
    if (input.userId) {
      await tx.merchantMembership.upsert({
        where: { userId_merchantId: { userId: input.userId, merchantId: merchant.id } },
        create: { userId: input.userId, merchantId: merchant.id, role: 'OWNER' },
        update: { role: 'OWNER' },
      })
    }
    return merchant
  })))

  return rows.map((row, index) => ({ alias: aliases[index], row }))
}

async function requireStripeActivated(row: QaMerchantRow, expectedPlan?: MerchantBillablePlanCode) {
  const planCode = row.planCode?.toUpperCase() as MerchantBillablePlanCode | undefined
  if (!planCode || (expectedPlan && planCode !== expectedPlan)) {
    throw new PreviewQaGuardError('STRIPE_ACTIVATION_REQUIRED', 'Activate the target plan through Stripe TEST Checkout before running this fixture.')
  }
  const expectedPrice = merchantStripePriceForPlan(planCode)
  const account = await prisma.merchantBillingAccount.findUnique({
    where: { merchantId_provider: { merchantId: row.id, provider: 'STRIPE' } },
    select: { stripePriceId: true, stripeSubscriptionId: true },
  })
  if (!account || account.stripePriceId !== expectedPrice.priceId) {
    throw new PreviewQaGuardError('STRIPE_ACTIVATION_REQUIRED', `No Stripe TEST billing account proves ${planCode} activation.`)
  }
  const successfulEvents = await prisma.merchantBillingEvent.count({
    where: {
      merchantId: row.id,
      provider: 'STRIPE',
      status: 'PROCESSED',
      stripePriceId: expectedPrice.priceId,
      eventType: expectedPrice.billingType === 'one_time'
        ? { in: ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] }
        : { in: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'invoice.paid', 'invoice.payment_succeeded'] },
    },
  })
  if (successfulEvents < 1) throw new PreviewQaGuardError('STRIPE_ACTIVATION_REQUIRED', `No PROCESSED Stripe TEST event proves ${planCode} activation.`)
  if (expectedPrice.billingType === 'subscription' && !account.stripeSubscriptionId) {
    throw new PreviewQaGuardError('STRIPE_ACTIVATION_REQUIRED', 'A subscription-backed fixture requires a Stripe TEST subscription.')
  }
  return { planCode, priceId: expectedPrice.priceId }
}

export async function setPreviewUsageThreshold(input: { merchant: unknown; percentage: number }) {
  validatePreviewQaEnvironment()
  const percentage = Number(input.percentage)
  if (!PREVIEW_QA_USAGE_THRESHOLDS.includes(percentage as PreviewQaUsageThreshold)) {
    throw new PreviewQaGuardError('INVALID_USAGE_THRESHOLD', `Usage threshold must be one of ${PREVIEW_QA_USAGE_THRESHOLDS.join(', ')}.`)
  }
  const { alias, row } = await loadQaMerchant(input.merchant)
  const before = await snapshotPreviewQaMerchant(alias)
  await requireStripeActivated(row)
  const limit = before.commercial.aiCommerceSessionLimit
  if (limit === null) throw new PreviewQaGuardError('PAID_PLAN_REQUIRED', 'Usage threshold fixtures require a Stripe-activated paid plan or Pilot.')
  const desired = usageCountForThreshold(limit, percentage as PreviewQaUsageThreshold)
  if (before.commercial.usage.aiCommerceSessions > desired) {
    throw new PreviewQaGuardError('USAGE_ONLY_INCREASES', `Current usage ${before.commercial.usage.aiCommerceSessions} is above the requested fixture target ${desired}; use a fresh QA-USAGE period.`)
  }
  const periodKey = before.commercial.period?.start ?? before.billingPeriodEnd ?? 'unanchored'
  const prefix = `g4c-preview-qa:${alias}:ai-commerce-session:${periodKey}`
  await prisma.$transaction(async (tx) => {
    const current = await tx.merchantUsageLedger.count({ where: { merchantId: row.id, kind: 'AI_COMMERCE_SESSION', ...(before.commercial.period.start || before.commercial.period.end ? { createdAt: { ...(before.commercial.period.start ? { gte: before.commercial.period.start } : {}), ...(before.commercial.period.end ? { lt: before.commercial.period.end } : {}) } } : {}) } })
    if (current > desired) throw new PreviewQaGuardError('USAGE_ONLY_INCREASES', `Current usage ${current} is above the requested fixture target ${desired}.`)
    const existing = await tx.merchantUsageLedger.findMany({ where: { merchantId: row.id, kind: 'AI_COMMERCE_SESSION', dedupeKey: { startsWith: prefix } }, select: { dedupeKey: true } })
    const keys = new Set(existing.map((item) => item.dedupeKey).filter((value): value is string => Boolean(value)))
    const data: Array<{ merchantId: string; kind: 'AI_COMMERCE_SESSION'; dedupeKey: string }> = []
    let index = 0
    while (current + data.length < desired) {
      const dedupeKey = `${prefix}:${index}`
      index += 1
      if (keys.has(dedupeKey)) continue
      keys.add(dedupeKey)
      data.push({ merchantId: row.id, kind: 'AI_COMMERCE_SESSION', dedupeKey })
    }
    if (data.length > 0) await tx.merchantUsageLedger.createMany({ data, skipDuplicates: true })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  const after = await snapshotPreviewQaMerchant(alias)
  const expectedStatus = percentage === 100 ? 'USAGE_EXHAUSTED' : percentage >= 70 ? 'USAGE_WARNING' : before.planCode === 'FOUNDING_PILOT' ? 'PILOT_ACTIVE' : 'PAID_ACTIVE'
  const pass = after.commercial.aiCommerceSessionPercentage === percentage
    && after.commercial.status === expectedStatus
    && after.commercial.featureAvailability.STORE === true
    && after.commercial.featureAvailability.GENERATIVE_TRY_ON === (percentage < 100)
  return { alias, merchantId: row.id, classification: String(row.classification), before, after, percentage, desired, pass }
}

async function pilotRevenueForMerchant(row: QaMerchantRow, priceId: string) {
  const events = await prisma.merchantBillingEvent.findMany({
    where: { merchantId: row.id, provider: 'STRIPE', status: 'PROCESSED', stripePriceId: priceId, eventType: { in: ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] } },
    select: { stripePriceId: true, status: true, eventType: true, providerEventId: true, stripeCheckoutSessionId: true },
  })
  const evidence: MerchantPilotRevenueEvidence[] = events.map((event) => ({ classification: String(row.classification), ...event }))
  return { cents: computeMerchantPilotRevenueCents({ evidence, pilotPriceId: priceId }), events }
}

export async function expirePreviewPilot(input: { merchant: unknown }) {
  validatePreviewQaEnvironment()
  const { alias, row } = await loadQaMerchant(input.merchant)
  const before = await snapshotPreviewQaMerchant(alias)
  const activation = await requireStripeActivated(row, 'FOUNDING_PILOT')
  if (before.commercial.status !== 'PILOT_ACTIVE' && before.commercial.status !== 'PILOT_EXPIRED') {
    throw new PreviewQaGuardError('PILOT_ACTIVE_REQUIRED', `Pilot expiry requires canonical PILOT_ACTIVE; found ${before.commercial.status}.`)
  }
  if (before.activeStoreCount < 1 || before.merchantStatus !== 'ACTIVE') {
    throw new PreviewQaGuardError('LIVE_STORE_REQUIRED', 'Pilot expiry requires an existing live Store; the fixture never creates or publishes one.')
  }
  const revenueBefore = await pilotRevenueForMerchant(row, activation.priceId)
  if (before.commercial.status === 'PILOT_ACTIVE') {
    await prisma.merchant.update({ where: { id: row.id }, data: { billingPeriodEnd: new Date(Date.now() - 1000) }, select: { id: true } })
  }
  const after = await snapshotPreviewQaMerchant(alias)
  const revenueAfter = await pilotRevenueForMerchant(row, activation.priceId)
  const pass = after.commercial.status === 'PILOT_EXPIRED'
    && after.commercial.featureAvailability.STORE === true
    && after.commercial.featureAvailability.GENERATIVE_TRY_ON === false
    && after.activeStoreCount > 0
    && revenueAfter.cents === revenueBefore.cents
  return { alias, merchantId: row.id, classification: String(row.classification), before, after, revenueBeforeCents: revenueBefore.cents, revenueAfterCents: revenueAfter.cents, pass }
}

export async function preparePreviewSubscriptionBoundary(input: { merchant: unknown; mode: 'near-expiry' | 'expired' }) {
  validatePreviewQaEnvironment()
  const { alias, row } = await loadQaMerchant(input.merchant)
  const before = await snapshotPreviewQaMerchant(alias)
  const activation = await requireStripeActivated(row)
  if (!['LAUNCH', 'GROWTH', 'SCALE'].includes(activation.planCode)) throw new PreviewQaGuardError('SUBSCRIPTION_REQUIRED', 'Subscription boundary fixtures require a Stripe-activated recurring plan.')
  const boundary = input.mode === 'expired' ? new Date(Date.now() - 1000) : new Date(Date.now() + 5 * 60 * 1000)
  await prisma.$transaction(async (tx) => {
    await tx.merchant.update({ where: { id: row.id }, data: { billingPeriodEnd: boundary }, select: { id: true } })
    await tx.merchantBillingAccount.update({ where: { merchantId_provider: { merchantId: row.id, provider: 'STRIPE' } }, data: { currentPeriodEnd: boundary }, select: { id: true } })
  })
  const after = await snapshotPreviewQaMerchant(alias)
  const expectedStatus = input.mode === 'expired' ? 'EXPIRED' : before.commercial.status
  const pass = after.commercial.status === expectedStatus && after.billingAccount.hasStripeSubscription && after.commercial.featureAvailability.STORE === true
  return { alias, merchantId: row.id, classification: String(row.classification), before, after, mode: input.mode, pass }
}

export async function replayPreviewStripeEvent(input: { merchant: unknown; eventId: string; repeat: number; concurrent?: boolean }) {
  validatePreviewQaEnvironment()
  const { alias, row } = await loadQaMerchant(input.merchant)
  if (!/^evt_[A-Za-z0-9]+$/.test(input.eventId)) throw new PreviewQaGuardError('STRIPE_EVENT_ID_REQUIRED', 'event-id must be a Stripe event id.')
  const maxRepeat = input.concurrent ? 10 : 2
  if (!Number.isInteger(input.repeat) || input.repeat < 1 || input.repeat > maxRepeat) throw new PreviewQaGuardError('REPLAY_BOUND_REQUIRED', `Replay repeat must be between 1 and ${maxRepeat}.`)
  const event = await stripe.events.retrieve(input.eventId) as unknown as Stripe.Event
  if (!isMerchantBillingMetadata((event.data.object as Record<string, unknown>).metadata)) throw new PreviewQaGuardError('MERCHANT_EVENT_REQUIRED', 'The Stripe TEST event is not a Merchant Billing event.')
  const metadata = metadataRecord((event.data.object as Record<string, unknown>).metadata)
  if (metadata.merchantId && metadata.merchantId !== row.id) throw new PreviewQaGuardError('BILLING_IDENTITY_MISMATCH', 'The Stripe event belongs to a different Merchant.')
  const before = await snapshotPreviewQaMerchant(alias)
  const results: MerchantBillingEventResult[] = input.concurrent
    ? await Promise.all(Array.from({ length: input.repeat }, () => processMerchantStripeEvent(event)))
    : []
  if (!input.concurrent) {
    for (let index = 0; index < input.repeat; index += 1) results.push(await processMerchantStripeEvent(event))
  }
  const after = await snapshotPreviewQaMerchant(alias)
  const canonicalApplications = results.filter((result) => result.duplicate === false).length
  const duplicateDeliveries = results.filter((result) => result.duplicate === true).length
  const pass = results.every((result) => result.handled === true && result.merchantId === row.id)
    && (input.concurrent ? canonicalApplications <= 1 && duplicateDeliveries >= input.repeat - 1 : input.repeat === 1 || results[1]?.duplicate === true)
    && after.billingEventCount >= before.billingEventCount
  return { alias, merchantId: row.id, classification: String(row.classification), before, after, eventId: event.id, eventType: event.type, results, pass }
}

export function previewQaPlanSummary() {
  return Object.fromEntries((['FREE', 'LAUNCH', 'GROWTH', 'SCALE', 'FOUNDING_PILOT'] as const).map((planCode) => {
    const plan = getMerchantPlanDefinition(planCode)
    return [planCode, { catalogItems: plan.catalogItems, aiCommerceSessions: plan.aiCommerceSessions, priceCents: plan.priceCents }]
  }))
}

import { getMerchantPlanDefinition, isMerchantPlanCode, type MerchantPlanCode } from '@/modules/merchant/domain/merchant-commercial-plans'

export const PILOT_SUCCESSFUL_CHECKOUT_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] as const
const pilotSuccessfulCheckoutEvents = new Set<string>(PILOT_SUCCESSFUL_CHECKOUT_EVENTS)

const ACTIVE_RECURRING_STATUSES = new Set([
  'PAID_ACTIVE',
  'USAGE_WARNING',
  'USAGE_EXHAUSTED',
  'CANCEL_AT_PERIOD_END',
])

const ACTIVE_PILOT_STATUSES = new Set([
  'PILOT_ACTIVE',
  'USAGE_WARNING',
  'USAGE_EXHAUSTED',
])

export type MerchantCommercialKpiRow = {
  classification: string
  planCode?: string | null
  commercialStatus?: string | null
  billingPeriodEnd?: Date | null
  catalogItems?: number
  shopperSessions?: number
  intents?: number
  aiCommerceSessions?: number
  publishedStore?: boolean
  checkoutStarted?: boolean
}

export type MerchantCommercialFunnel = {
  merchantCreated: number
  catalogReady: number
  storePublished: number
  checkoutStarted: number
  billingActivated: number
  firstAICommerceSession: number
  firstIntent: number
}

export type MerchantCommercialKpis = {
  realMerchants: number
  paidRealMerchants: number
  activePilots: number
  activePaidSubscriptions: number
  mrrCents: number
  pilotRevenueCents: number
  commercialAICommerceSessions: number
  commercialShopperSessions: number
  commercialIntents: number
  publishedStores: number
  funnel: MerchantCommercialFunnel
}

export type MerchantPilotRevenueEvidence = {
  classification: string
  stripePriceId: string | null
  status: string
  eventType: string
  providerEventId: string
  stripeCheckoutSessionId: string | null
}

/**
 * Count verified one-time Pilot receipts, not current subscription state.
 * Checkout retries can have different provider event ids, so the Checkout
 * Session is the receipt identity used for deduplication.
 */
export function computeMerchantPilotRevenueCents(input: {
  evidence: readonly MerchantPilotRevenueEvidence[]
  pilotPriceId: string | null | undefined
}): number {
  const eligible = input.evidence.filter((row) =>
    row.classification.trim().toUpperCase() === 'REAL'
    && row.stripePriceId === input.pilotPriceId
    && row.status.trim().toUpperCase() === 'PROCESSED'
    && pilotSuccessfulCheckoutEvents.has(row.eventType),
  )
  const receipts = new Set<string>()
  for (const row of eligible) receipts.add(row.stripeCheckoutSessionId || `event:${row.providerEventId}`)
  return receipts.size * (getMerchantPlanDefinition('FOUNDING_PILOT').priceCents ?? 0)
}

function normalizedPlan(value: string | null | undefined): MerchantPlanCode | null {
  return isMerchantPlanCode(value) ? value.toUpperCase() as MerchantPlanCode : null
}

function periodIsActive(end: Date | null | undefined, now: Date): boolean {
  return !end || end.getTime() > now.getTime()
}

function isActivePilot(row: MerchantCommercialKpiRow, now: Date): boolean {
  const plan = normalizedPlan(row.planCode)
  const status = row.commercialStatus?.trim().toUpperCase()
  return plan === 'FOUNDING_PILOT' && ACTIVE_PILOT_STATUSES.has(status ?? '') && periodIsActive(row.billingPeriodEnd, now)
}

function isActiveSubscription(row: MerchantCommercialKpiRow, now: Date): boolean {
  const plan = normalizedPlan(row.planCode)
  const status = row.commercialStatus?.trim().toUpperCase()
  return plan !== null && ['LAUNCH', 'GROWTH', 'SCALE'].includes(plan) && ACTIVE_RECURRING_STATUSES.has(status ?? '') && periodIsActive(row.billingPeriodEnd, now)
}

/**
 * Compute launch-facing commercial KPIs from already-authorized rows.
 *
 * The REAL classification check is deliberately here, at the domain
 * boundary, so an Admin caller cannot accidentally include TEST,
 * POSSIBLE_EXTERNAL, INTERNAL, AUTOMATION, or REFERENCE activity by merely
 * changing a query filter.
 */
export function computeMerchantCommercialKpis(input: {
  merchants: readonly MerchantCommercialKpiRow[]
  pilotRevenueEvidence?: readonly MerchantPilotRevenueEvidence[]
  pilotPriceId?: string | null
  now?: Date
}): MerchantCommercialKpis {
  const now = input.now ?? new Date()
  const real = input.merchants.filter((row) => row.classification.trim().toUpperCase() === 'REAL')
  const pilots = real.filter((row) => isActivePilot(row, now))
  const subscriptions = real.filter((row) => isActiveSubscription(row, now))
  const paid = [...pilots, ...subscriptions]
  const mrrCents = subscriptions.reduce((total, row) => {
    const plan = normalizedPlan(row.planCode)
    return total + (plan ? getMerchantPlanDefinition(plan).priceCents ?? 0 : 0)
  }, 0)

  return {
    realMerchants: real.length,
    paidRealMerchants: paid.length,
    activePilots: pilots.length,
    activePaidSubscriptions: subscriptions.length,
    mrrCents,
    pilotRevenueCents: computeMerchantPilotRevenueCents({ evidence: input.pilotRevenueEvidence ?? [], pilotPriceId: input.pilotPriceId }),
    commercialAICommerceSessions: real.reduce((total, row) => total + Math.max(0, row.aiCommerceSessions ?? 0), 0),
    commercialShopperSessions: real.reduce((total, row) => total + Math.max(0, row.shopperSessions ?? 0), 0),
    commercialIntents: real.reduce((total, row) => total + Math.max(0, row.intents ?? 0), 0),
    publishedStores: real.reduce((total, row) => total + (row.publishedStore ? 1 : 0), 0),
    funnel: {
      merchantCreated: real.length,
      catalogReady: real.filter((row) => (row.catalogItems ?? 0) > 0).length,
      storePublished: real.filter((row) => row.publishedStore === true).length,
      checkoutStarted: real.filter((row) => row.checkoutStarted === true).length,
      billingActivated: paid.length,
      firstAICommerceSession: real.filter((row) => (row.aiCommerceSessions ?? 0) > 0).length,
      firstIntent: real.filter((row) => (row.intents ?? 0) > 0).length,
    },
  }
}

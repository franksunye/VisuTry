import type { MerchantBillablePlanCode } from './merchant-billing'

/**
 * The only commercial intent that may cross the public Pricing/Auth boundary.
 * This is deliberately not a Stripe identifier, amount, currency, or product
 * object. The server resolves it to canonical plan metadata and Price config.
 */
export const MERCHANT_PURCHASE_INTENTS = [
  'FREE',
  'LAUNCH',
  'GROWTH',
  'SCALE',
  'FOUNDING_PILOT',
] as const

export type MerchantPurchaseIntent = (typeof MERCHANT_PURCHASE_INTENTS)[number]

export function parseMerchantPurchaseIntent(value: unknown): MerchantPurchaseIntent | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return (MERCHANT_PURCHASE_INTENTS as readonly string[]).includes(normalized)
    ? normalized as MerchantPurchaseIntent
    : null
}

export function isPaidMerchantPurchaseIntent(
  value: MerchantPurchaseIntent,
): value is Exclude<MerchantPurchaseIntent, 'FREE'> {
  return value !== 'FREE'
}

export function merchantPurchasePath(intent: MerchantPurchaseIntent): string {
  return `/merchant?commercialIntent=${intent}`
}

export function merchantBillablePlanFromPurchaseIntent(
  intent: Exclude<MerchantPurchaseIntent, 'FREE'>,
): MerchantBillablePlanCode {
  return intent
}

export type MerchantPurchaseAction =
  | 'CHECKOUT'
  | 'CHANGE_PLAN'
  | 'MANAGE_BILLING'
  | 'CURRENT'
  | 'WORKSPACE'
  | 'DUPLICATE_PILOT'

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
])

const BILLING_ACTION_STATUSES = new Set([
  'PAST_DUE',
  'PAYMENT_ACTION_REQUIRED',
  'CANCEL_AT_PERIOD_END',
])

export function hasActiveMerchantSubscription(status: string | null | undefined): boolean {
  return status != null && ACTIVE_SUBSCRIPTION_STATUSES.has(status.toLowerCase())
}

/**
 * Decide how a canonical Merchant state enters a purchase flow. This is a
 * routing decision only; the Billing application still re-checks all state
 * and authorization before creating or changing anything in Stripe.
 */
export function resolveMerchantPurchaseAction(input: {
  intent: MerchantPurchaseIntent
  currentPlanCode?: string | null
  commercialStatus?: string | null
  stripeSubscriptionId?: string | null
  subscriptionStatus?: string | null
  /** True when a processed Founding Pilot receipt exists for this Merchant. */
  foundingPilotConsumed?: boolean
}): MerchantPurchaseAction {
  if (input.intent === 'FREE') return 'WORKSPACE'
  const currentPlan = parseMerchantPurchaseIntent(input.currentPlanCode)
  const status = input.commercialStatus?.trim().toUpperCase()
  const activeSubscription = Boolean(input.stripeSubscriptionId) && hasActiveMerchantSubscription(input.subscriptionStatus)

  const foundingPilotConsumed = input.foundingPilotConsumed === true
    || currentPlan === 'FOUNDING_PILOT'
    || status === 'PILOT_ACTIVE'
    || status === 'PILOT_EXPIRED'

  if (input.intent === 'FOUNDING_PILOT' && foundingPilotConsumed) {
    return 'DUPLICATE_PILOT'
  }
  if (status && BILLING_ACTION_STATUSES.has(status)) return 'MANAGE_BILLING'
  if (activeSubscription) {
    if (input.intent !== 'FOUNDING_PILOT' && currentPlan === input.intent) return 'CURRENT'
    return input.intent === 'FOUNDING_PILOT' ? 'MANAGE_BILLING' : 'CHANGE_PLAN'
  }
  if (currentPlan === input.intent && ['PAID_ACTIVE', 'USAGE_WARNING', 'USAGE_EXHAUSTED', 'PILOT_ACTIVE'].includes(status ?? '')) {
    return 'CURRENT'
  }
  return 'CHECKOUT'
}

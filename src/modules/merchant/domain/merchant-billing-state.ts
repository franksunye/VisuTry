import type { MerchantBillingPolicy } from './merchant-billing-policy'
import type { MerchantRecurringPlanCode } from './merchant-billing'

export const MERCHANT_BILLING_STATES = [
  'NO_SUBSCRIPTION',
  'VALID_SUBSCRIPTION',
  'PAYMENT_ATTENTION',
  'BILLING_DISABLED',
  'SUBSCRIPTION_MISSING',
  'SUBSCRIPTION_INVALID',
  'PROVIDER_UNAVAILABLE',
] as const
export type MerchantBillingStateKind = (typeof MERCHANT_BILLING_STATES)[number]

export const MERCHANT_BILLING_STATE_REASONS = [
  'BILLING_POLICY_DISABLED',
  'BILLING_CONFIGURATION_ERROR',
  'SUBSCRIPTION_NOT_FOUND',
  'WRONG_STRIPE_MODE',
  'CUSTOMER_MISMATCH',
  'UNSUPPORTED_SUBSCRIPTION_PRICE',
  'SUBSCRIPTION_STATUS_INVALID',
  'COMMERCIAL_PROVIDER_PLAN_MISMATCH',
  'PROVIDER_UNAVAILABLE',
] as const
export type MerchantBillingStateReason = (typeof MERCHANT_BILLING_STATE_REASONS)[number]

export type MerchantBillingProviderSubscriptionState = {
  subscriptionId: string
  customerId: string
  priceId: string
  planCode: MerchantRecurringPlanCode
  subscriptionStatus: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

export type MerchantBillingProviderState =
  | { kind: 'NO_SUBSCRIPTION' }
  | ({ kind: 'VALID_SUBSCRIPTION' } & MerchantBillingProviderSubscriptionState)
  | ({ kind: 'PAYMENT_ATTENTION' } & MerchantBillingProviderSubscriptionState)
  | { kind: 'SUBSCRIPTION_MISSING'; reason: MerchantBillingStateReason }
  | { kind: 'SUBSCRIPTION_INVALID'; reason: MerchantBillingStateReason }
  | { kind: 'PROVIDER_UNAVAILABLE'; reason: MerchantBillingStateReason }

export type MerchantBillingState = {
  kind: MerchantBillingStateKind
  reason: MerchantBillingStateReason | null
  providerPlanCode: MerchantRecurringPlanCode | null
  providerSubscriptionStatus: string | null
  cancelAtPeriodEnd: boolean
}

export type MerchantBillingAccountStateInput = {
  stripeSubscriptionId?: string | null
  subscriptionStatus?: string | null
}

export function normalizeMerchantBillingState(input: {
  policy: MerchantBillingPolicy
  account?: MerchantBillingAccountStateInput | null
  provider?: MerchantBillingProviderState | null
  /** Persisted commercial plan, used only after provider verification. */
  commercialPlanCode?: string | null
}): MerchantBillingState {
  if (!input.policy.billingWritesAllowed) {
    return {
      kind: 'BILLING_DISABLED',
      reason: 'BILLING_POLICY_DISABLED',
      providerPlanCode: null,
      providerSubscriptionStatus: null,
      cancelAtPeriodEnd: false,
    }
  }

  const account = input.account ?? null
  const hasSubscriptionReference = Boolean(account?.stripeSubscriptionId)
  if (!hasSubscriptionReference) {
    const storedStatus = account?.subscriptionStatus?.toLowerCase()
    if (storedStatus === 'active' || storedStatus === 'trialing' || storedStatus === 'past_due' || storedStatus === 'unpaid') {
      return {
        kind: 'SUBSCRIPTION_MISSING',
        reason: 'SUBSCRIPTION_NOT_FOUND',
        providerPlanCode: null,
        providerSubscriptionStatus: storedStatus,
        cancelAtPeriodEnd: false,
      }
    }
    return {
      kind: 'NO_SUBSCRIPTION',
      reason: null,
      providerPlanCode: null,
      providerSubscriptionStatus: account?.subscriptionStatus ?? null,
      cancelAtPeriodEnd: false,
    }
  }

  const provider = input.provider
  if (!provider || provider.kind === 'NO_SUBSCRIPTION') {
    return {
      kind: 'PROVIDER_UNAVAILABLE',
      reason: 'PROVIDER_UNAVAILABLE',
      providerPlanCode: null,
      providerSubscriptionStatus: account?.subscriptionStatus ?? null,
      cancelAtPeriodEnd: false,
    }
  }
  if (provider.kind === 'SUBSCRIPTION_MISSING' || provider.kind === 'SUBSCRIPTION_INVALID' || provider.kind === 'PROVIDER_UNAVAILABLE') {
    return {
      kind: provider.kind,
      reason: provider.reason,
      providerPlanCode: null,
      providerSubscriptionStatus: account?.subscriptionStatus ?? null,
      cancelAtPeriodEnd: false,
    }
  }
  const normalized: MerchantBillingState = {
    kind: provider.kind,
    reason: null,
    providerPlanCode: provider.planCode,
    providerSubscriptionStatus: provider.subscriptionStatus,
    cancelAtPeriodEnd: provider.cancelAtPeriodEnd,
  }
  if (input.commercialPlanCode !== undefined && input.commercialPlanCode?.trim().toUpperCase() !== normalized.providerPlanCode) {
    return {
      ...normalized,
      kind: 'SUBSCRIPTION_INVALID',
      reason: 'COMMERCIAL_PROVIDER_PLAN_MISMATCH',
    }
  }
  return normalized
}

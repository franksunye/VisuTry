import type Stripe from 'stripe'
import { isMockMode } from '@/lib/mocks'
import { stripe } from '@/lib/stripe'
import { resolveAppEnvironment } from '@/lib/app-environment'
import type { MerchantRecurringPlanCode } from '../domain/merchant-billing'
import type { MerchantBillingProviderState, MerchantBillingProviderSubscriptionState, MerchantBillingStateReason } from '../domain/merchant-billing-state'
import { MerchantBillingError, assertMerchantStripeEnvironment, resolveMerchantStripePrice, stripeId, unixDate } from './merchant-billing-shared'

const PROVIDER_READ_TIMEOUT_MS = 4_000

type StripeSubscriptionReader = {
  subscriptions: {
    retrieve(subscriptionId: string): Promise<Stripe.Subscription | Record<string, unknown>>
  }
}

type VerifiedSubscription = ({ kind: 'VALID_SUBSCRIPTION' } | { kind: 'PAYMENT_ATTENTION' }) & MerchantBillingProviderSubscriptionState & {
  subscription: Stripe.Subscription | Record<string, unknown>
}
type ProviderFailure = { kind: 'SUBSCRIPTION_MISSING'; reason: MerchantBillingStateReason } | { kind: 'SUBSCRIPTION_INVALID'; reason: MerchantBillingStateReason } | { kind: 'PROVIDER_UNAVAILABLE'; reason: MerchantBillingStateReason }

function providerErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const value = error as { code?: unknown; statusCode?: unknown; raw?: { code?: unknown; statusCode?: unknown } }
  const raw = value.raw
  const code = typeof value.code === 'string' ? value.code : typeof raw?.code === 'string' ? raw.code : null
  if (code) return code
  const statusCode = typeof value.statusCode === 'number' ? value.statusCode : typeof raw?.statusCode === 'number' ? raw.statusCode : null
  return statusCode === 404 ? 'resource_missing' : null
}

function providerErrorType(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const value = error as { type?: unknown }
  return typeof value.type === 'string' ? value.type : null
}

function providerFailure(error: unknown): ProviderFailure {
  if (providerErrorCode(error) === 'resource_missing') {
    return { kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND' }
  }
  const type = providerErrorType(error)
  if (type === 'StripeAuthenticationError' || type === 'StripePermissionError') {
    return { kind: 'PROVIDER_UNAVAILABLE', reason: 'BILLING_CONFIGURATION_ERROR' }
  }
  return { kind: 'PROVIDER_UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' }
}

async function readWithTimeout(reader: StripeSubscriptionReader, subscriptionId: string) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new MerchantBillingError('PROVIDER_UNAVAILABLE', 'The billing provider did not respond in time.', 503)), PROVIDER_READ_TIMEOUT_MS)
    })
    return await Promise.race([reader.subscriptions.retrieve(subscriptionId), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function subscriptionItems(value: Stripe.Subscription | Record<string, unknown>): Array<Record<string, unknown>> {
  return (value as { items?: { data?: Array<Record<string, unknown>> } }).items?.data ?? []
}

function subscriptionCustomer(value: Stripe.Subscription | Record<string, unknown>): string | null {
  return stripeId((value as { customer?: string | { id: string } | null }).customer)
}

function subscriptionPrice(value: Stripe.Subscription | Record<string, unknown>): string | null {
  const price = subscriptionItems(value)[0]?.price
  return stripeId(price as string | { id: string } | null | undefined)
}

function subscriptionId(value: Stripe.Subscription | Record<string, unknown>): string | null {
  return stripeId((value as { id?: string | { id: string } | null }).id as string | { id: string } | null | undefined)
}

function expectedStripeMode(env: Record<string, string | undefined>): 'test' | 'live' {
  const configured = env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase()
  if (configured === 'live') return 'live'
  if (configured === 'test' || isMockMode || env.APP_ENV !== 'production') return 'test'
  throw new MerchantBillingError('BILLING_CONFIGURATION_ERROR', 'Merchant billing is not configured for this environment.', 503)
}

function invalid(reason: MerchantBillingStateReason): { kind: 'SUBSCRIPTION_INVALID'; reason: MerchantBillingStateReason } {
  return { kind: 'SUBSCRIPTION_INVALID', reason }
}

/**
 * Read and normalize one provider subscription. It never mutates Stripe or
 * VisuTry state. The caller must already have authenticated and tenant-scoped
 * the Merchant request.
 */
export async function verifyMerchantSubscription(input: {
  subscriptionId: string
  customerId: string
  reader?: StripeSubscriptionReader
  env?: Record<string, string | undefined>
}): Promise<MerchantBillingProviderState> {
  const env = input.env ?? process.env
  try {
    assertMerchantStripeEnvironment(env)
  } catch (error) {
    if (error instanceof MerchantBillingError) {
      return { kind: 'PROVIDER_UNAVAILABLE', reason: 'BILLING_CONFIGURATION_ERROR' }
    }
    return { kind: 'PROVIDER_UNAVAILABLE', reason: 'BILLING_CONFIGURATION_ERROR' }
  }

  let mode: 'test' | 'live'
  try {
    mode = expectedStripeMode(env)
  } catch (error) {
    return {
      kind: 'PROVIDER_UNAVAILABLE',
      reason: error instanceof MerchantBillingError ? 'BILLING_CONFIGURATION_ERROR' : 'PROVIDER_UNAVAILABLE',
    }
  }
  let subscription: Stripe.Subscription | Record<string, unknown>
  try {
    subscription = await readWithTimeout(input.reader ?? stripe as unknown as StripeSubscriptionReader, input.subscriptionId)
  } catch (error) {
    return providerFailure(error)
  }

  const livemode = (subscription as { livemode?: unknown }).livemode
  if (typeof livemode === 'boolean' && livemode !== (mode === 'live')) return invalid('WRONG_STRIPE_MODE')

  const actualCustomerId = subscriptionCustomer(subscription)
  if (!actualCustomerId || actualCustomerId !== input.customerId) return invalid('CUSTOMER_MISMATCH')

  const actualSubscriptionId = subscriptionId(subscription)
  if (!actualSubscriptionId || actualSubscriptionId !== input.subscriptionId) return invalid('SUBSCRIPTION_STATUS_INVALID')

  const priceId = subscriptionPrice(subscription)
  if (!priceId) return invalid('UNSUPPORTED_SUBSCRIPTION_PRICE')
  let price
  try {
    price = resolveMerchantStripePrice(priceId, env)
  } catch {
    return invalid('UNSUPPORTED_SUBSCRIPTION_PRICE')
  }
  if (price.billingType !== 'subscription') return invalid('UNSUPPORTED_SUBSCRIPTION_PRICE')

  const subscriptionStatus = String((subscription as { status?: unknown }).status ?? '').toLowerCase()
  const cancelAtPeriodEnd = Boolean((subscription as { cancel_at_period_end?: unknown }).cancel_at_period_end)
  const shared = {
    subscriptionId: actualSubscriptionId,
    customerId: actualCustomerId,
    priceId: price.priceId,
    planCode: price.planCode as MerchantRecurringPlanCode,
    subscriptionStatus,
    cancelAtPeriodEnd,
    currentPeriodStart: unixDate((subscription as { current_period_start?: unknown }).current_period_start),
    currentPeriodEnd: unixDate((subscription as { current_period_end?: unknown }).current_period_end),
    subscription,
  }

  if (subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid' || subscriptionStatus === 'incomplete' || subscriptionStatus === 'paused' || cancelAtPeriodEnd) {
    return { kind: 'PAYMENT_ATTENTION', ...shared }
  }
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return { kind: 'VALID_SUBSCRIPTION', ...shared }
  }
  return invalid('SUBSCRIPTION_STATUS_INVALID')
}

export async function readVerifiedMerchantSubscription(input: {
  subscriptionId: string
  customerId: string
  reader?: StripeSubscriptionReader
  env?: Record<string, string | undefined>
}): Promise<VerifiedSubscription | ProviderFailure> {
  const result = await verifyMerchantSubscription(input)
  if (result.kind === 'VALID_SUBSCRIPTION' || result.kind === 'PAYMENT_ATTENTION') {
    return result as VerifiedSubscription
  }
  if (result.kind === 'NO_SUBSCRIPTION') return { kind: 'PROVIDER_UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' }
  return result
}

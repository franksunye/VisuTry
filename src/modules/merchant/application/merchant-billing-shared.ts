import { isMockMode } from '@/lib/mocks'
import { billingTypeForMerchantPlan, merchantPlanCodeFromUnknown, type MerchantBillablePlanCode } from '../domain/merchant-billing'

export const MERCHANT_BILLING_PROVIDER = 'STRIPE' as const
export const BILLING_PRICE_ENV: Record<MerchantBillablePlanCode, string> = {
  LAUNCH: 'STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID',
  GROWTH: 'STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID',
  SCALE: 'STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID',
  FOUNDING_PILOT: 'STRIPE_FOUNDING_PILOT_PRICE_ID',
}
export type Env = Record<string, string | undefined>
export type MerchantStripePrice = { priceId: string; planCode: MerchantBillablePlanCode; billingType: 'subscription' | 'one_time' }

export class MerchantBillingError extends Error {
  readonly code: string
  readonly httpStatus: number
  readonly decision?: Record<string, unknown>
  constructor(code: string, message: string, httpStatus = 400, decision?: Record<string, unknown>) {
    super(message); this.name = 'MerchantBillingError'; this.code = code; this.httpStatus = httpStatus; this.decision = decision
  }
}

/**
 * A provider event may be delivered again after a transient dependency has
 * recovered. Keep this allowlist deliberately narrow: identity, price, and
 * configuration failures are terminal and must not become an unbounded retry
 * loop.
 */
const RETRYABLE_MERCHANT_BILLING_ERROR_CODES = new Set([
  'SUBSCRIPTION_NOT_READY',
  'BILLING_PROVIDER_UNAVAILABLE',
  'PROVIDER_API_TRANSIENT',
  'DATABASE_SERIALIZATION_FAILURE',
])

export function isRetryableMerchantBillingErrorCode(code: string | null | undefined): boolean {
  return code != null && RETRYABLE_MERCHANT_BILLING_ERROR_CODES.has(code)
}

export function merchantStripePriceMap(env: Env = process.env): Map<string, MerchantStripePrice> {
  const result = new Map<string, MerchantStripePrice>()
  for (const planCode of Object.keys(BILLING_PRICE_ENV) as MerchantBillablePlanCode[]) {
    const priceId = env[BILLING_PRICE_ENV[planCode]]?.trim()
    if (!priceId) continue
    if (!priceId.startsWith('price_')) throw new MerchantBillingError('INVALID_PRICE_CONFIGURATION', `${BILLING_PRICE_ENV[planCode]} must be a Stripe Price ID.`, 503)
    if (result.has(priceId)) throw new MerchantBillingError('INVALID_PRICE_CONFIGURATION', 'Merchant Stripe Price IDs must be unique.', 503)
    result.set(priceId, { priceId, planCode, billingType: billingTypeForMerchantPlan(planCode) })
  }
  return result
}

export function resolveMerchantStripePrice(priceId: unknown, env: Env = process.env): MerchantStripePrice {
  const result = merchantStripePriceMap(env).get(typeof priceId === 'string' ? priceId.trim() : '')
  if (!result) throw new MerchantBillingError('UNSUPPORTED_PRICE', 'This billing option is not available.', 400)
  return result
}

export function merchantStripePriceForPlan(planCode: unknown, env: Env = process.env): MerchantStripePrice {
  const normalized = merchantPlanCodeFromUnknown(planCode)
  if (!normalized) throw new MerchantBillingError('UNSUPPORTED_PLAN', 'This plan is not available for online enrollment.', 400)
  const priceId = env[BILLING_PRICE_ENV[normalized]]?.trim()
  if (!priceId) throw new MerchantBillingError('BILLING_NOT_CONFIGURED', 'Online billing is not configured for this plan yet.', 503)
  return resolveMerchantStripePrice(priceId, env)
}

export function assertMerchantStripeEnvironment(env: Env = process.env): void {
  if (isMockMode) return
  const mode = env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase()
  if (mode !== 'test' && mode !== 'live') throw new MerchantBillingError('BILLING_MODE_NOT_CONFIGURED', 'Merchant billing is not configured for this environment.', 503)
  const expected = mode === 'live' ? 'sk_live_' : 'sk_test_'
  if (!(env.STRIPE_SECRET_KEY?.trim() ?? '').startsWith(expected)) throw new MerchantBillingError('STRIPE_ENVIRONMENT_MISMATCH', 'Merchant billing is not available in this Stripe environment.', 503)
  if (env.VERCEL_ENV === 'production' && mode !== 'live') throw new MerchantBillingError('STRIPE_ENVIRONMENT_MISMATCH', 'Production Merchant billing requires live Stripe configuration.', 503)
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production' && mode !== 'test') throw new MerchantBillingError('STRIPE_ENVIRONMENT_MISMATCH', 'Preview Merchant billing requires test Stripe configuration.', 503)
}

export function stripeId(value: string | { id: string } | null | undefined): string | null { return value ? typeof value === 'string' ? value : value.id : null }
export function unixDate(value: unknown): Date | null { return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null }
export function metadataRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}
export function isMerchantBillingMetadata(value: unknown): boolean { return metadataRecord(value).billingPurpose === 'MERCHANT_PLAN' }

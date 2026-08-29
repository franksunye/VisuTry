import type { MerchantSponsoredUsageType } from './enums'

export type MerchantSponsoredUsagePolicy = {
  key: string
  enabled: boolean
  sponsoredGenerationLimit: number
  rollingWindowHours: number
  sponsoredCompareLimit: number
}

export const VISUTRY_OWNED_SPONSORED_POLICY_KEY = 'VISUTRY_OWNED'

export const VISUTRY_OWNED_SPONSORED_POLICY: MerchantSponsoredUsagePolicy = {
  key: VISUTRY_OWNED_SPONSORED_POLICY_KEY,
  enabled: true,
  sponsoredGenerationLimit: 1,
  rollingWindowHours: 24,
  sponsoredCompareLimit: 0,
}

export const DISABLED_MERCHANT_SPONSORED_POLICY: MerchantSponsoredUsagePolicy = {
  key: 'DISABLED',
  enabled: false,
  sponsoredGenerationLimit: 0,
  rollingWindowHours: 24,
  sponsoredCompareLimit: 0,
}

export type MerchantSponsoredPolicyFields = {
  sponsoredUsagePolicyKey?: string | null
}

/**
 * Global rollout control. An explicit "false" is an emergency/off switch.
 * Explicit merchant policy keys remain authoritative in production when the
 * variable is not configured, so a missing deployment variable cannot make a
 * configured sponsored entitlement silently fall back to legacy allowance.
 * Non-production environments stay opt-in unless explicitly enabled.
 */
export function isMerchantSponsoredUsageEnabled(): boolean {
  const configured = process.env.MERCHANT_SPONSORED_USAGE_ENABLED?.trim().toLowerCase()
  if (configured === 'false') return false
  if (configured === 'true') return true
  return process.env.NODE_ENV === 'production'
}

/**
 * Public shopper hint: how many sponsored generations an anonymous guest can
 * complete without auth continuation. Null means there is no sponsored guest
 * ceiling (merchant commercial entitlement applies instead).
 */
export function resolveGuestSponsoredTryOnLimit(
  fields: MerchantSponsoredPolicyFields,
): number | null {
  const policy = resolveMerchantSponsoredUsagePolicy(fields)
  if (!policy.enabled) return null
  return policy.sponsoredGenerationLimit
}

/** Resolve a server-owned policy from an explicit policy key only. */
export function resolveMerchantSponsoredUsagePolicy(
  fields: MerchantSponsoredPolicyFields,
): MerchantSponsoredUsagePolicy {
  if (!isMerchantSponsoredUsageEnabled()) return DISABLED_MERCHANT_SPONSORED_POLICY

  const explicitKey = fields.sponsoredUsagePolicyKey?.trim().toUpperCase()
  if (explicitKey === VISUTRY_OWNED_SPONSORED_POLICY_KEY) {
    return VISUTRY_OWNED_SPONSORED_POLICY
  }
  if (explicitKey) return DISABLED_MERCHANT_SPONSORED_POLICY

  return DISABLED_MERCHANT_SPONSORED_POLICY
}

export type MerchantGenerationEntitlement =
  | { allowed: true; source: 'MERCHANT_SPONSORED'; reservationId: string }
  | { allowed: true; source: 'CONSUMER_ENTITLEMENT'; reservationId: null }
  | {
      allowed: false
      reason: 'AUTH_REQUIRED' | 'CONSUMER_CREDITS_REQUIRED' | 'SPONSORED_ALLOWANCE_EXHAUSTED'
    }

export function sponsoredUsageLimitFor(
  policy: MerchantSponsoredUsagePolicy,
  usageType: MerchantSponsoredUsageType,
): number {
  return usageType === 'SPONSORED_COMPARE'
    ? policy.sponsoredCompareLimit
    : policy.sponsoredGenerationLimit
}

/**
 * The provider boundary is deliberately conservative. Before the provider
 * call starts, failures are known local/pre-provider failures and release the
 * reservation. Once the call starts, an exception cannot prove that the
 * request was not delivered, so the RESERVED row blocks another sponsored
 * attempt for the rolling window until the reservation expires.
 */
export function sponsoredUsageFailureAction(
  error: unknown,
): 'RELEASE' | 'RETAIN' {
  return error && typeof error === 'object' &&
    (error as { providerStarted?: boolean }).providerStarted === true
    ? 'RETAIN'
    : 'RELEASE'
}

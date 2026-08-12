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
  /** Existing provenance/pilot classification; not the entitlement itself. */
  pilotType?: string | null
}

/** Resolve a server-owned policy; merchant slug and referenceData are not used. */
export function resolveMerchantSponsoredUsagePolicy(
  fields: MerchantSponsoredPolicyFields,
): MerchantSponsoredUsagePolicy {
  const explicitKey = fields.sponsoredUsagePolicyKey?.trim().toUpperCase()
  if (explicitKey === VISUTRY_OWNED_SPONSORED_POLICY_KEY) {
    return VISUTRY_OWNED_SPONSORED_POLICY
  }
  if (explicitKey) return DISABLED_MERCHANT_SPONSORED_POLICY

  // Existing reference pilot rows are VisuTry-owned delivery surfaces. This
  // is a policy default, not a referenceData/provenance entitlement switch.
  if ((fields.pilotType ?? '').trim().toUpperCase() === 'REFERENCE') {
    return VISUTRY_OWNED_SPONSORED_POLICY
  }

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

/**
 * Usage charging is separate from generation execution.
 * The server selects UsagePolicy from trusted context — never from client flags.
 */

import type { TryOnActor } from './actor'
import type { TryOnOrigin } from './enums'

export type ConsumerQuotaPolicy = { kind: 'consumer_quota' }

export type StoreDemoAllowancePolicy = {
  kind: 'store_demo_allowance'
  merchantId: string
}

export type MerchantAllowancePolicy = {
  kind: 'merchant_allowance'
  merchantId: string
}

export type MerchantSponsoredAllowancePolicy = {
  kind: 'merchant_sponsored'
  merchantId: string
}

export type UsagePolicy =
  | ConsumerQuotaPolicy
  | StoreDemoAllowancePolicy
  | MerchantAllowancePolicy
  | MerchantSponsoredAllowancePolicy

/** Configurable Store Demo limits — change without touching shopper UI. */
export type StoreDemoLimits = {
  /** Successful renders counted toward the merchant demo allowance. */
  maxSuccessfulRendersPerMerchant: number
  /** Successful renders per anonymous session. */
  maxSuccessfulRendersPerSession: number
  /** Generation attempts (success + failure) per session — abuse limit. */
  maxAttemptsPerSession: number
  /** Whether failed attempts count toward the merchant success allowance. */
  failedAttemptsCountTowardMerchantAllowance: boolean
}

export const DEFAULT_STORE_DEMO_LIMITS: StoreDemoLimits = {
  maxSuccessfulRendersPerMerchant: 500,
  maxSuccessfulRendersPerSession: 8,
  maxAttemptsPerSession: 16,
  failedAttemptsCountTowardMerchantAllowance: false,
}

export function selectUsagePolicy(
  actor: TryOnActor,
  origin: TryOnOrigin = 'STORE_DEMO',
): UsagePolicy {
  if (actor.kind === 'consumer') {
    return { kind: 'consumer_quota' }
  }

  if (origin === 'STORE_PILOT') {
    return { kind: 'merchant_allowance', merchantId: actor.merchantId }
  }

  return { kind: 'store_demo_allowance', merchantId: actor.merchantId }
}

export function usagePolicyTouchesConsumerCredits(policy: UsagePolicy): boolean {
  return policy.kind === 'consumer_quota'
}

export type StoreAllowanceSnapshot = {
  merchantSuccessfulRenders: number
  sessionSuccessfulRenders: number
  sessionAttempts: number
}

export type StoreAllowanceDecision =
  | { allowed: true }
  | { allowed: false; reason: string; code: 'MERCHANT_ALLOWANCE_EXCEEDED' | 'SESSION_ALLOWANCE_EXCEEDED' | 'SESSION_ATTEMPT_LIMIT' }

export function evaluateStoreDemoAllowance(
  limits: StoreDemoLimits,
  snapshot: StoreAllowanceSnapshot,
): StoreAllowanceDecision {
  if (snapshot.sessionAttempts >= limits.maxAttemptsPerSession) {
    return {
      allowed: false,
      reason: 'Session generation attempt limit reached.',
      code: 'SESSION_ATTEMPT_LIMIT',
    }
  }

  if (snapshot.sessionSuccessfulRenders >= limits.maxSuccessfulRendersPerSession) {
    return {
      allowed: false,
      reason: 'Session try-on allowance reached.',
      code: 'SESSION_ALLOWANCE_EXCEEDED',
    }
  }

  if (snapshot.merchantSuccessfulRenders >= limits.maxSuccessfulRendersPerMerchant) {
    return {
      allowed: false,
      reason: 'Merchant demo allowance reached.',
      code: 'MERCHANT_ALLOWANCE_EXCEEDED',
    }
  }

  return { allowed: true }
}

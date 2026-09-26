/**
 * Canonical Merchant commercial capability boundary.
 *
 * Plan/status/usage decisions live in merchant-commercial-state. The legacy
 * entitlement is consulted only to preserve historical Founding Pilot
 * boundaries and to map persisted Store generation rows onto their existing
 * STORE_DEMO / STORE_PILOT origin values. Those origin values are storage and
 * telemetry compatibility, not product-plan identity.
 */

import {
  canUseCommercialFeature,
  COMMERCIAL_FEATURES,
  resolveMerchantCommercialState,
  type CommercialFeature,
  type CommercialUsage,
  type EntitlementDecision,
  type MerchantCommercialFields,
  type MerchantCommercialState,
} from './merchant-commercial-state'
import { merchantUsageCreatedAtFilter, resolveMerchantEntitlement } from './merchant-entitlement'
import { DEFAULT_STORE_DEMO_LIMITS, type StoreDemoLimits } from './usage-policy'
import type { TryOnOrigin } from './enums'

export type PersistedStoreGenerationOrigin = Extract<TryOnOrigin, 'STORE_DEMO' | 'STORE_PILOT'>

export type MerchantCommercialCapability = {
  state: MerchantCommercialState
  decisions: Record<CommercialFeature, EntitlementDecision>
  /** Commercial identity for logs/events; never use persistence origin here. */
  commercialIdentity: {
    planCode: string
    entitlementVersion: string
  }
  storeRuntime: {
    /** Compatibility-only value written to existing task/usage records. */
    persistedGenerationOrigin: PersistedStoreGenerationOrigin
    /** Legacy attempt/render ceilings remain only where the old contract requires them. */
    renderLimits: StoreDemoLimits
    /** Stable abuse ceiling for consumer-quota continuations; independent of Merchant plan. */
    consumerContinuationRenderLimits: StoreDemoLimits
    usageCreatedAt?: { gte?: Date; lt?: Date }
    enforceLegacyRenderLimits: boolean
  }
}

function unlimitedStoreRenderLimits(): StoreDemoLimits {
  return {
    ...DEFAULT_STORE_DEMO_LIMITS,
    maxSuccessfulRendersPerMerchant: Number.POSITIVE_INFINITY,
    maxSuccessfulRendersPerSession: Number.POSITIVE_INFINITY,
    maxAttemptsPerSession: Number.POSITIVE_INFINITY,
  }
}

export function resolveMerchantCommercialCapability(
  fields: MerchantCommercialFields,
  usage: Partial<CommercialUsage> = {},
  now = new Date(),
): MerchantCommercialCapability {
  const state = resolveMerchantCommercialState(fields, usage, now)
  const compatibility = resolveMerchantEntitlement(fields, now)
  const enforceLegacyRenderLimits = state.commercialState === 'LEGACY_UNMIGRATED'
    || state.planCode === 'FOUNDING_PILOT'
  const decisions = Object.fromEntries(COMMERCIAL_FEATURES.map((feature) => [
    feature,
    canUseCommercialFeature(state, feature),
  ])) as Record<CommercialFeature, EntitlementDecision>

  return {
    state,
    decisions,
    commercialIdentity: {
      planCode: state.planCode
        ?? (compatibility.planCode === 'FOUNDING_PILOT' ? 'FOUNDING_PILOT' : 'LEGACY_UNMIGRATED'),
      entitlementVersion: compatibility.entitlementVersion,
    },
    storeRuntime: {
      persistedGenerationOrigin: compatibility.tryOnOrigin,
      renderLimits: enforceLegacyRenderLimits ? compatibility.renderLimits : unlimitedStoreRenderLimits(),
      consumerContinuationRenderLimits: compatibility.renderLimits,
      usageCreatedAt: merchantUsageCreatedAtFilter(compatibility),
      enforceLegacyRenderLimits,
    },
  }
}

export function decideMerchantCommercialFeature(
  state: MerchantCommercialState,
  feature: CommercialFeature,
): EntitlementDecision {
  return canUseCommercialFeature(state, feature)
}

export function merchantFeatureAvailable(
  fields: MerchantCommercialFields,
  feature: CommercialFeature,
  usage: Partial<CommercialUsage> = {},
  now = new Date(),
): boolean {
  return resolveMerchantCommercialCapability(fields, usage, now).decisions[feature].allowed
}

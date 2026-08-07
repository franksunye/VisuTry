/**
 * Versionable merchant commercial entitlement — provider-independent.
 * Resolves plan identity + render/session allowances for Pilot enforcement.
 */

import {
  DEFAULT_STORE_DEMO_LIMITS,
  type StoreDemoLimits,
} from './usage-policy'
import type { TryOnOrigin } from './enums'

/** Founding Merchant Pilot Market-Capture offer v8 defaults. */
export const FOUNDING_PILOT_V8 = {
  planCode: 'FOUNDING_PILOT',
  commercialStage: 'MARKET_CAPTURE',
  pricingVersion: 'v8',
  entitlementVersion: 'v8',
  commerceSessionAllowance: 1500,
  standardRenderAllowance: 3500,
  premiumRenderAllowance: 0,
  campaignAllowance: 1,
  /** Per-session shopper UX ceilings — not a fixed 2-render product rule. */
  maxSuccessfulRendersPerSession: 16,
  maxAttemptsPerSession: 32,
} as const

export const FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS = 5000
export const FOUNDING_PILOT_PERIOD_DAYS = 30
const DAY_MS = 86_400_000

export type MerchantEntitlementFields = {
  planCode?: string | null
  commercialStage?: string | null
  pricingVersion?: string | null
  entitlementVersion?: string | null
  commerceSessionAllowance?: number | null
  standardRenderAllowance?: number | null
  premiumRenderAllowance?: number | null
  campaignAllowance?: number | null
  entitlementEffectiveFrom?: Date | null
  billingPeriodEnd?: Date | null
  commercialExceptionCode?: string | null
  /** Stable fallback anchor for legacy Pilot rows that predate explicit period fields. */
  createdAt?: Date | null
}

export type ResolvedMerchantEntitlement = {
  planCode: string
  commercialStage: string
  pricingVersion: string
  entitlementVersion: string
  tryOnOrigin: Extract<TryOnOrigin, 'STORE_DEMO' | 'STORE_PILOT'>
  commerceSessionAllowance: number
  standardRenderAllowance: number
  premiumRenderAllowance: number
  campaignAllowance: number
  commercialExceptionCode: string | null
  renderLimits: StoreDemoLimits
  billingPeriodEnd: Date | null
  entitlementEffectiveFrom: Date | null
  /** Half-open usage window: [usagePeriodStart, usagePeriodEnd). */
  usagePeriodStart: Date | null
  usagePeriodEnd: Date | null
}

function isFoundingPilot(fields: MerchantEntitlementFields): boolean {
  const plan = (fields.planCode ?? '').toUpperCase()
  const stage = (fields.commercialStage ?? '').toUpperCase()
  return plan === 'FOUNDING_PILOT' || stage === 'MARKET_CAPTURE'
}

function resolveStandardRenderAllowance(fields: MerchantEntitlementFields): number {
  if (
    typeof fields.standardRenderAllowance === 'number' &&
    fields.standardRenderAllowance >= 0
  ) {
    return fields.standardRenderAllowance
  }
  if (
    (fields.commercialExceptionCode ?? '').toUpperCase() === 'FOUNDING_LAUNCH_BONUS'
  ) {
    return FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS
  }
  return FOUNDING_PILOT_V8.standardRenderAllowance
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS)
}

/**
 * Resolve a deterministic 30-day Pilot usage period.
 * New paid rows should always persist entitlementEffectiveFrom + billingPeriodEnd.
 * createdAt is only a backward-compatible anchor for legacy Pilot rows.
 */
export function resolveMerchantUsagePeriod(
  fields: MerchantEntitlementFields,
  now = new Date(),
): { start: Date | null; end: Date | null } {
  if (!isFoundingPilot(fields)) return { start: null, end: null }

  const explicitStart = fields.entitlementEffectiveFrom ?? null
  const explicitEnd = fields.billingPeriodEnd ?? null

  if (explicitStart && explicitEnd) {
    return { start: explicitStart, end: explicitEnd }
  }
  if (explicitStart) {
    return { start: explicitStart, end: addDays(explicitStart, FOUNDING_PILOT_PERIOD_DAYS) }
  }
  if (explicitEnd) {
    return { start: addDays(explicitEnd, -FOUNDING_PILOT_PERIOD_DAYS), end: explicitEnd }
  }

  const anchor = fields.createdAt ?? now
  if (anchor.getTime() >= now.getTime()) {
    return { start: anchor, end: addDays(anchor, FOUNDING_PILOT_PERIOD_DAYS) }
  }

  const periodMs = FOUNDING_PILOT_PERIOD_DAYS * DAY_MS
  const completedPeriods = Math.floor((now.getTime() - anchor.getTime()) / periodMs)
  const start = new Date(anchor.getTime() + completedPeriods * periodMs)
  return { start, end: new Date(start.getTime() + periodMs) }
}

export function merchantUsageCreatedAtFilter(
  entitlement: Pick<ResolvedMerchantEntitlement, 'usagePeriodStart' | 'usagePeriodEnd'>,
): { gte?: Date; lt?: Date } | undefined {
  if (!entitlement.usagePeriodStart && !entitlement.usagePeriodEnd) return undefined
  return {
    ...(entitlement.usagePeriodStart ? { gte: entitlement.usagePeriodStart } : {}),
    ...(entitlement.usagePeriodEnd ? { lt: entitlement.usagePeriodEnd } : {}),
  }
}

/**
 * Resolve server-trusted entitlement from Merchant row fields.
 * Missing commercial fields → DEMO defaults (safe for seed/dev merchants).
 */
export function resolveMerchantEntitlement(
  fields: MerchantEntitlementFields,
  now = new Date(),
): ResolvedMerchantEntitlement {
  if (!isFoundingPilot(fields)) {
    return {
      planCode: fields.planCode?.trim() || 'DEMO',
      commercialStage: fields.commercialStage?.trim() || 'DEMO',
      pricingVersion: fields.pricingVersion?.trim() || 'demo',
      entitlementVersion: fields.entitlementVersion?.trim() || 'demo',
      tryOnOrigin: 'STORE_DEMO',
      commerceSessionAllowance:
        typeof fields.commerceSessionAllowance === 'number'
          ? fields.commerceSessionAllowance
          : Number.POSITIVE_INFINITY,
      standardRenderAllowance: DEFAULT_STORE_DEMO_LIMITS.maxSuccessfulRendersPerMerchant,
      premiumRenderAllowance:
        typeof fields.premiumRenderAllowance === 'number'
          ? fields.premiumRenderAllowance
          : 0,
      campaignAllowance:
        typeof fields.campaignAllowance === 'number' ? fields.campaignAllowance : 0,
      commercialExceptionCode: fields.commercialExceptionCode ?? null,
      renderLimits: { ...DEFAULT_STORE_DEMO_LIMITS },
      billingPeriodEnd: fields.billingPeriodEnd ?? null,
      entitlementEffectiveFrom: fields.entitlementEffectiveFrom ?? null,
      usagePeriodStart: null,
      usagePeriodEnd: null,
    }
  }

  const standardRenderAllowance = resolveStandardRenderAllowance(fields)
  const commerceSessionAllowance =
    typeof fields.commerceSessionAllowance === 'number'
      ? fields.commerceSessionAllowance
      : FOUNDING_PILOT_V8.commerceSessionAllowance
  const usagePeriod = resolveMerchantUsagePeriod(fields, now)

  return {
    planCode: 'FOUNDING_PILOT',
    commercialStage: fields.commercialStage?.trim() || FOUNDING_PILOT_V8.commercialStage,
    pricingVersion: fields.pricingVersion?.trim() || FOUNDING_PILOT_V8.pricingVersion,
    entitlementVersion:
      fields.entitlementVersion?.trim() || FOUNDING_PILOT_V8.entitlementVersion,
    tryOnOrigin: 'STORE_PILOT',
    commerceSessionAllowance,
    standardRenderAllowance,
    premiumRenderAllowance:
      typeof fields.premiumRenderAllowance === 'number'
        ? fields.premiumRenderAllowance
        : FOUNDING_PILOT_V8.premiumRenderAllowance,
    campaignAllowance:
      typeof fields.campaignAllowance === 'number'
        ? fields.campaignAllowance
        : FOUNDING_PILOT_V8.campaignAllowance,
    commercialExceptionCode: fields.commercialExceptionCode ?? null,
    renderLimits: {
      maxSuccessfulRendersPerMerchant: standardRenderAllowance,
      maxSuccessfulRendersPerSession: FOUNDING_PILOT_V8.maxSuccessfulRendersPerSession,
      maxAttemptsPerSession: FOUNDING_PILOT_V8.maxAttemptsPerSession,
      failedAttemptsCountTowardMerchantAllowance: false,
    },
    billingPeriodEnd: fields.billingPeriodEnd ?? usagePeriod.end,
    entitlementEffectiveFrom: fields.entitlementEffectiveFrom ?? usagePeriod.start,
    usagePeriodStart: usagePeriod.start,
    usagePeriodEnd: usagePeriod.end,
  }
}

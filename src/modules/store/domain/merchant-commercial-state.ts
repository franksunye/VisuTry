import { resolveMerchantUsagePeriod } from './merchant-entitlement'
import {
  getMerchantPlanDefinition,
  resolveMerchantPlanCode,
  type MerchantPlanCode,
  type MerchantPlanDefinition,
} from './merchant-commercial-plans'

export const COMMERCIAL_STATUSES = [
  'FREE', 'PILOT_ACTIVE', 'PILOT_EXPIRED', 'PAID_ACTIVE', 'USAGE_WARNING',
  'USAGE_EXHAUSTED', 'CANCEL_AT_PERIOD_END', 'EXPIRED', 'PAYMENT_ACTION_REQUIRED', 'PAST_DUE',
] as const
export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number]

export const COMMERCIAL_FEATURES = [
  'STORE', 'CATALOG', 'CAMPAIGN', 'RECOMMENDATION', 'GENERATIVE_TRY_ON', 'COMPARE',
  'BASIC_ANALYTICS', 'ADVANCED_ANALYTICS',
] as const
export type CommercialFeature = (typeof COMMERCIAL_FEATURES)[number]

export const USAGE_THRESHOLDS = ['NORMAL', 'NOTICE', 'WARNING', 'LIMIT_REACHED'] as const
export type UsageThreshold = (typeof USAGE_THRESHOLDS)[number]

export type MerchantCommercialFields = {
  planCode?: string | null
  commercialStatus?: string | null
  commercialStage?: string | null
  pricingVersion?: string | null
  entitlementVersion?: string | null
  commerceSessionAllowance?: number | null
  standardRenderAllowance?: number | null
  campaignAllowance?: number | null
  entitlementEffectiveFrom?: Date | null
  billingPeriodEnd?: Date | null
  commercialExceptionCode?: string | null
  createdAt?: Date | null
}

export type CommercialUsage = {
  aiCommerceSessions: number
  activeCampaigns: number
  catalogItems: number
  standardTryOnGenerations: number
}

export type UsagePeriod = { kind: 'none' | 'monthly' | 'fixed_30_days'; start: Date | null; end: Date | null }

export type MerchantCommercialState = {
  planCode: MerchantPlanCode
  plan: MerchantPlanDefinition
  status: CommercialStatus
  period: UsagePeriod
  usage: CommercialUsage
  aiCommerceSessionLimit: number | null
  aiCommerceSessionRemaining: number | null
  aiCommerceSessionPercentage: number | null
  threshold: UsageThreshold | null
  featureAvailability: Record<CommercialFeature, boolean>
  primaryAction: 'NONE' | 'UNLOCK_AI_TRY_ON' | 'MANAGE_PLAN' | 'UPGRADE_CAPACITY' | 'RESTORE_AI_CAPACITY' | 'CONTINUE_AFTER_PILOT' | 'RESOLVE_PAYMENT'
}

const DAY_MS = 86_400_000

function addMonths(anchor: Date, months: number): Date {
  const result = new Date(anchor.getTime())
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

function validDate(value: Date | null | undefined): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

function resolvePaidPeriod(fields: MerchantCommercialFields, now: Date): UsagePeriod {
  const explicitStart = validDate(fields.entitlementEffectiveFrom)
  const explicitEnd = validDate(fields.billingPeriodEnd)
  if (explicitStart && explicitEnd) return { kind: 'monthly', start: explicitStart, end: explicitEnd }
  if (explicitStart) return { kind: 'monthly', start: explicitStart, end: addMonths(explicitStart, 1) }
  if (explicitEnd) return { kind: 'monthly', start: addMonths(explicitEnd, -1), end: explicitEnd }
  let start = validDate(fields.createdAt) ?? now
  let end = addMonths(start, 1)
  while (end.getTime() <= now.getTime()) {
    start = end
    end = addMonths(start, 1)
  }
  return { kind: 'monthly', start, end }
}

export function resolveMerchantCommercialPeriod(fields: MerchantCommercialFields, now = new Date()): UsagePeriod {
  const planCode = resolveMerchantPlanCode(fields.planCode)
  if (planCode === 'FREE' || planCode === 'ENTERPRISE') return { kind: 'none', start: null, end: null }
  if (planCode === 'FOUNDING_PILOT') {
    const period = resolveMerchantUsagePeriod(fields, now)
    return { kind: 'fixed_30_days', start: period.start, end: period.end }
  }
  return resolvePaidPeriod(fields, now)
}

export function usageThreshold(used: number, included: number | null): UsageThreshold | null {
  if (included === null || included <= 0) return null
  const percentage = Math.max(0, used) / included * 100
  if (percentage >= 100) return 'LIMIT_REACHED'
  if (percentage >= 90) return 'WARNING'
  if (percentage >= 70) return 'NOTICE'
  return 'NORMAL'
}

export function percentageUsed(used: number, included: number | null): number | null {
  if (included === null || included <= 0) return null
  return Math.min(100, Math.max(0, Math.round(Math.max(0, used) / included * 100)))
}

function parseStatus(value: string | null | undefined): CommercialStatus | null {
  const normalized = value?.trim().toUpperCase()
  return normalized && (COMMERCIAL_STATUSES as readonly string[]).includes(normalized) ? normalized as CommercialStatus : null
}

export function resolveMerchantCommercialState(fields: MerchantCommercialFields, usage: Partial<CommercialUsage> = {}, now = new Date()): MerchantCommercialState {
  const planCode = resolveMerchantPlanCode(fields.planCode)
  const plan = getMerchantPlanDefinition(planCode)
  const period = resolveMerchantCommercialPeriod(fields, now)
  const normalizedUsage: CommercialUsage = {
    aiCommerceSessions: Math.max(0, usage.aiCommerceSessions ?? 0),
    activeCampaigns: Math.max(0, usage.activeCampaigns ?? 0),
    catalogItems: Math.max(0, usage.catalogItems ?? 0),
    standardTryOnGenerations: Math.max(0, usage.standardTryOnGenerations ?? 0),
  }
  const limit = plan.aiCommerceSessions
  const threshold = usageThreshold(normalizedUsage.aiCommerceSessions, limit)
  const periodExpired = Boolean(period.end && now.getTime() >= period.end.getTime())
  const explicitStatus = parseStatus(fields.commercialStatus)
  let status: CommercialStatus
  if (planCode === 'FREE') status = 'FREE'
  else if (planCode === 'FOUNDING_PILOT') {
    status = periodExpired ? 'PILOT_EXPIRED'
      : threshold === 'LIMIT_REACHED' ? 'USAGE_EXHAUSTED'
        : threshold === 'NOTICE' || threshold === 'WARNING' ? 'USAGE_WARNING'
          : 'PILOT_ACTIVE'
  }
  else if (periodExpired) status = 'EXPIRED'
  else if (explicitStatus && ['CANCEL_AT_PERIOD_END', 'PAYMENT_ACTION_REQUIRED', 'PAST_DUE'].includes(explicitStatus)) status = explicitStatus
  else if (threshold === 'LIMIT_REACHED') status = 'USAGE_EXHAUSTED'
  else if (threshold === 'NOTICE' || threshold === 'WARNING') status = 'USAGE_WARNING'
  else status = 'PAID_ACTIVE'

  const paidActive = !['EXPIRED', 'PILOT_EXPIRED', 'PAYMENT_ACTION_REQUIRED', 'PAST_DUE'].includes(status)
  const recommendation = plan.recommendation && paidActive
  const generativeTryOn = plan.generativeTryOn && paidActive && status !== 'USAGE_EXHAUSTED'
  const compare = plan.compare && paidActive
  const featureAvailability: Record<CommercialFeature, boolean> = {
    STORE: true,
    CATALOG: plan.catalogItems === null || normalizedUsage.catalogItems < plan.catalogItems,
    CAMPAIGN: plan.activeCampaigns === null || normalizedUsage.activeCampaigns < plan.activeCampaigns,
    RECOMMENDATION: recommendation || planCode === 'FREE',
    GENERATIVE_TRY_ON: generativeTryOn,
    COMPARE: compare,
    BASIC_ANALYTICS: plan.analytics === 'basic' || plan.analytics === 'advanced',
    ADVANCED_ANALYTICS: plan.analytics === 'advanced',
  }
  const primaryAction = status === 'PILOT_EXPIRED' ? 'CONTINUE_AFTER_PILOT'
    : status === 'PAYMENT_ACTION_REQUIRED' || status === 'PAST_DUE' ? 'RESOLVE_PAYMENT'
      : status === 'USAGE_EXHAUSTED' ? 'RESTORE_AI_CAPACITY'
        : status === 'USAGE_WARNING' ? 'UPGRADE_CAPACITY'
          : planCode === 'FREE' ? 'UNLOCK_AI_TRY_ON' : 'MANAGE_PLAN'

  return {
    planCode, plan, status, period, usage: normalizedUsage,
    aiCommerceSessionLimit: limit,
    aiCommerceSessionRemaining: limit === null ? null : Math.max(0, limit - normalizedUsage.aiCommerceSessions),
    aiCommerceSessionPercentage: percentageUsed(normalizedUsage.aiCommerceSessions, limit),
    threshold, featureAvailability, primaryAction,
  }
}

export type EntitlementDecision = {
  allowed: boolean
  feature: CommercialFeature
  code?: 'CAMPAIGN_LIMIT_REACHED' | 'CATALOG_LIMIT_REACHED' | 'AI_USAGE_LIMIT_REACHED' | 'FEATURE_NOT_INCLUDED' | 'COMMERCIAL_PERIOD_EXPIRED'
  message: string
  current?: number
  limit?: number | null
  recommendedPlan?: MerchantPlanCode
}

function recommendedCampaignPlan(planCode: MerchantPlanCode): MerchantPlanCode {
  if (planCode === 'FREE' || planCode === 'FOUNDING_PILOT') return 'LAUNCH'
  if (planCode === 'LAUNCH') return 'GROWTH'
  if (planCode === 'GROWTH') return 'SCALE'
  return 'ENTERPRISE'
}

function recommendedCatalogPlan(planCode: MerchantPlanCode): MerchantPlanCode {
  if (planCode === 'FREE' || planCode === 'FOUNDING_PILOT') return 'LAUNCH'
  if (planCode === 'LAUNCH') return 'GROWTH'
  if (planCode === 'GROWTH') return 'SCALE'
  return 'ENTERPRISE'
}

export function canUseCommercialFeature(state: MerchantCommercialState, feature: CommercialFeature): EntitlementDecision {
  if (state.featureAvailability[feature]) return { allowed: true, feature, message: 'Available.' }
  if (feature === 'CAMPAIGN') return { allowed: false, feature, code: 'CAMPAIGN_LIMIT_REACHED', message: `Your current plan includes up to ${state.plan.activeCampaigns ?? 'custom'} active Campaigns.`, current: state.usage.activeCampaigns, limit: state.plan.activeCampaigns, recommendedPlan: recommendedCampaignPlan(state.planCode) }
  if (feature === 'CATALOG') return { allowed: false, feature, code: 'CATALOG_LIMIT_REACHED', message: `Your current plan includes up to ${state.plan.catalogItems ?? 'custom'} catalog items.`, current: state.usage.catalogItems, limit: state.plan.catalogItems, recommendedPlan: recommendedCatalogPlan(state.planCode) }
  if (feature === 'GENERATIVE_TRY_ON' && state.status === 'USAGE_EXHAUSTED') return { allowed: false, feature, code: 'AI_USAGE_LIMIT_REACHED', message: 'Your included AI Commerce Sessions are fully used. Your Store remains live. Virtual Try-On is paused.', current: state.usage.aiCommerceSessions, limit: state.aiCommerceSessionLimit, recommendedPlan: state.planCode === 'LAUNCH' ? 'GROWTH' : 'SCALE' }
  if (['EXPIRED', 'PILOT_EXPIRED', 'PAYMENT_ACTION_REQUIRED', 'PAST_DUE'].includes(state.status)) return { allowed: false, feature, code: 'COMMERCIAL_PERIOD_EXPIRED', message: state.status === 'PILOT_EXPIRED' ? 'Your Founding Pilot has ended. Your Store and catalog remain available.' : 'This feature is not currently available for this commercial period.' }
  return { allowed: false, feature, code: 'FEATURE_NOT_INCLUDED', message: feature === 'GENERATIVE_TRY_ON' ? 'Virtual Try-On is not included in the Free plan.' : 'This feature is not included in the current plan.', recommendedPlan: 'LAUNCH' }
}

export function isCommercialPeriodActive(state: MerchantCommercialState): boolean {
  return !['EXPIRED', 'PILOT_EXPIRED', 'PAYMENT_ACTION_REQUIRED', 'PAST_DUE'].includes(state.status)
}

export function daysRemaining(period: UsagePeriod, now = new Date()): number | null {
  if (!period.end) return null
  return Math.max(0, Math.ceil((period.end.getTime() - now.getTime()) / DAY_MS))
}

export function commercialStateForPresentation(state: MerchantCommercialState) {
  return {
    planCode: state.planCode,
    planName: state.plan.name,
    priceLabel: state.plan.priceLabel,
    limits: {
      catalogItems: state.plan.catalogItems,
      activeCampaigns: state.plan.activeCampaigns,
      aiCommerceSessions: state.plan.aiCommerceSessions,
      standardTryOnGenerations: state.plan.standardTryOnGenerations,
      normalStoreTraffic: state.plan.normalStoreTraffic,
    },
    pilotCatalogRange: state.plan.pilotCatalogRange ?? null,
    setupLabel: state.plan.setupLabel ?? null,
    status: state.status,
    periodStart: state.period.start?.toISOString() ?? null,
    periodEnd: state.period.end?.toISOString() ?? null,
    daysRemaining: daysRemaining(state.period),
    usage: state.usage,
    aiCommerceSessionLimit: state.aiCommerceSessionLimit,
    aiCommerceSessionRemaining: state.aiCommerceSessionRemaining,
    aiCommerceSessionPercentage: state.aiCommerceSessionPercentage,
    threshold: state.threshold,
    features: state.featureAvailability,
    primaryAction: state.primaryAction,
  }
}

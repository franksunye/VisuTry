import { prisma } from '@/lib/prisma'
import {
  analyticsPeriodDto,
  computeExperienceAnalytics,
  resolveAnalyticsPeriod,
  type AnalyticsEventRow,
  type AnalyticsIntentRow,
  type AnalyticsRangeInput,
} from '@/modules/store/application/merchant-analytics-compute'
import { buildMerchantDistributionReport, MERCHANT_DISTRIBUTION_SOURCE_LABELS, type MerchantDistributionReport } from '@/modules/store/domain/merchant-distribution-report'
import { safeRate } from '@/modules/store/domain/merchant-analytics'
import {
  buildMerchantCommerceComparison,
  buildMerchantCommerceInterpretation,
  buildMerchantExperiencePerformance,
  buildMerchantSourceHighlights,
  type MerchantCommerceComparison,
  type MerchantCommerceInterpretation,
  type MerchantCommerceMetricValues,
  type MerchantExperiencePerformance,
  type MerchantSourceHighlights,
} from '../domain/merchant-control-insights'

export type MerchantCommerceIntelligence = {
  period: { from: string; to: string; timezone: 'UTC' }
  hasActivity: boolean
  totals: {
    visitors: number
    engagedShoppers: number
    recommendationActivity: number
    tryOnCompletions: number
    compareActivity: number
    productClicks: number
    highIntentShoppers: number
  }
  rates: { engagement: number | null; recommendation: number | null; tryOn: number | null; compare: number | null }
  comparison: MerchantCommerceComparison
  experiencePerformance: MerchantExperiencePerformance
  sourceHighlights: MerchantSourceHighlights
  interpretation: MerchantCommerceInterpretation
  acquisitionSources: Array<{ source: string; visitors: number }>
  distributionReport?: MerchantDistributionReport
  experiences: Array<{
    id: string
    type: 'STORE' | 'CAMPAIGN'
    name: string
    status: string
    referenceData: boolean
    visitors: number
    engagedShoppers: number
    recommendationActivity: number
    tryOnCompletions: number
    compareActivity: number
    productClicks: number
    highIntentShoppers: number
  }>
}

export type MerchantCommerceActivityExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  status: string
  referenceData: boolean
}

export type MerchantCommerceActivitySession = {
  id: string
  experienceId: string | null
  source: string | null
  medium: string | null
  referrer: string | null
  aiAgentSource: string | null
}

export type MerchantCommerceActivityEvent = AnalyticsEventRow & { experienceId: string | null }
export type MerchantCommerceActivityIntent = AnalyticsIntentRow & { experienceId: string | null }

export type MerchantCommerceActivity = {
  experiences: MerchantCommerceActivityExperience[]
  sessions: MerchantCommerceActivitySession[]
  events: MerchantCommerceActivityEvent[]
  intents: MerchantCommerceActivityIntent[]
}

function percentRate(value: number | null): number | null {
  return value == null ? null : Math.round(value * 1000) / 10
}

function eventTypeCount(events: readonly MerchantCommerceActivityEvent[], type: string): number {
  return events.filter((row) => row.type === type).reduce((total, row) => total + row.count, 0)
}

function intentTypeCount(intents: readonly MerchantCommerceActivityIntent[], type: string): number {
  return intents.filter((row) => row.type === type).reduce((total, row) => total + row.count, 0)
}

function scopedActivity(
  activity: MerchantCommerceActivity,
  experienceId: string | null,
): { sessionIds: string[]; events: AnalyticsEventRow[]; intents: AnalyticsIntentRow[] } {
  const sessions = experienceId
    ? activity.sessions.filter((session) => session.experienceId === experienceId)
    : activity.sessions
  const sessionIds = sessions.map((session) => session.id)
  const events = (experienceId
    ? activity.events.filter((event) => event.experienceId === experienceId)
    : activity.events
  ).map(({ merchantSessionId, merchantFrameId, type, count }) => ({ merchantSessionId, merchantFrameId, type, count }))
  const intents = (experienceId
    ? activity.intents.filter((intent) => intent.experienceId === experienceId)
    : activity.intents
  ).map(({ merchantSessionId, merchantFrameId, type, count }) => ({ merchantSessionId, merchantFrameId, type, count }))
  return { sessionIds, events, intents }
}

function overlayCounts(events: readonly MerchantCommerceActivityEvent[], intents: readonly MerchantCommerceActivityIntent[]) {
  return {
    recommendationActivity: eventTypeCount(events, 'merchant_recommendation_completed'),
    productClicks: intentTypeCount(intents, 'PRODUCT_CLICK'),
  }
}

function snapshot(
  activity: MerchantCommerceActivity,
  from: Date,
  to: Date,
): Omit<MerchantCommerceIntelligence, 'comparison' | 'experiencePerformance' | 'sourceHighlights' | 'interpretation'> {
  const overall = computeExperienceAnalytics({ ...scopedActivity(activity, null), includeTopFrames: false })
  const extras = overlayCounts(activity.events, activity.intents)
  const sources = new Map<string, number>()
  for (const session of activity.sessions) {
    const source = session.aiAgentSource
      ? `AI · ${session.aiAgentSource}`
      : session.source
        ? `${session.source}${session.medium ? ` / ${session.medium}` : ''}`
        : 'Direct'
    sources.set(source, (sources.get(source) ?? 0) + 1)
  }
  return {
    period: analyticsPeriodDto({ from, to }),
    hasActivity: overall.metrics.visits > 0,
    totals: {
      visitors: overall.metrics.visits,
      engagedShoppers: overall.metrics.engagedSessions,
      recommendationActivity: extras.recommendationActivity,
      tryOnCompletions: overall.metrics.tryOnCompletions,
      compareActivity: overall.metrics.compares,
      productClicks: extras.productClicks,
      highIntentShoppers: overall.metrics.highIntentSessions,
    },
    rates: {
      engagement: percentRate(overall.metrics.engagementRate),
      recommendation: percentRate(safeRate(extras.recommendationActivity, overall.metrics.visits)),
      tryOn: percentRate(safeRate(overall.metrics.tryOnCompletions, overall.metrics.visits)),
      compare: percentRate(safeRate(overall.metrics.compares, overall.metrics.visits)),
    },
    acquisitionSources: [...sources.entries()].map(([source, visitors]) => ({ source, visitors })).sort((a, b) => b.visitors - a.visitors).slice(0, 8),
    distributionReport: buildMerchantDistributionReport({
      sessions: activity.sessions,
      events: activity.events,
      intents: activity.intents,
    }),
    experiences: activity.experiences.map((experience) => {
      const scoped = computeExperienceAnalytics({ ...scopedActivity(activity, experience.id), includeTopFrames: false })
      const scopedExtras = overlayCounts(
        activity.events.filter((event) => event.experienceId === experience.id),
        activity.intents.filter((intent) => intent.experienceId === experience.id),
      )
      return {
        id: experience.id,
        type: experience.type,
        name: experience.name,
        status: experience.status,
        referenceData: experience.referenceData,
        visitors: scoped.metrics.visits,
        engagedShoppers: scoped.metrics.engagedSessions,
        recommendationActivity: scopedExtras.recommendationActivity,
        tryOnCompletions: scoped.metrics.tryOnCompletions,
        compareActivity: scoped.metrics.compares,
        productClicks: scopedExtras.productClicks,
        highIntentShoppers: scoped.metrics.highIntentSessions,
      }
    }),
  }
}

/**
 * Merchant overview intelligence built from C1 session-level analytics.
 * Overlay counts (recommendation events, product-click intents) stay available
 * for the Control Center cards but are not part of C1 engagement/high-intent.
 */
export function buildMerchantCommerceIntelligence(input: {
  current: MerchantCommerceActivity
  previous: MerchantCommerceActivity
  currentPeriod: { from: Date; to: Date }
  previousPeriod: { from: Date; to: Date }
}): MerchantCommerceIntelligence {
  const currentInsights = snapshot(input.current, input.currentPeriod.from, input.currentPeriod.to)
  const previousInsights = snapshot(input.previous, input.previousPeriod.from, input.previousPeriod.to)
  const comparison = buildMerchantCommerceComparison({
    current: currentInsights.totals satisfies MerchantCommerceMetricValues,
    previous: previousInsights.totals satisfies MerchantCommerceMetricValues,
    previousPeriod: previousInsights.period,
  })
  const experiencePerformance = buildMerchantExperiencePerformance(currentInsights.experiences.map((experience) => ({
    id: experience.id,
    name: experience.name,
    type: experience.type,
    visitors: experience.visitors,
    engagedShoppers: experience.engagedShoppers,
    tryOnCompletions: experience.tryOnCompletions,
    productClicks: experience.productClicks,
    highIntentShoppers: experience.highIntentShoppers,
  })))
  const sourceHighlights = buildMerchantSourceHighlights((currentInsights.distributionReport?.sources ?? []).map((source) => ({
    source: MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass],
    visitors: source.visitors,
    productClicks: source.productClicks,
    inquiries: source.inquiries,
    highIntentShoppers: source.highIntentShoppers,
  })))
  const experienceNames = new Map(input.current.experiences.map((experience) => [experience.id, experience.name]))
  const interpretation = buildMerchantCommerceInterpretation({
    current: currentInsights.totals,
    comparison,
    experiences: experiencePerformance,
    sources: sourceHighlights,
    experienceNames,
  })
  return { ...currentInsights, comparison, experiencePerformance, sourceHighlights, interpretation }
}

function mapGroup(row: { merchantSessionId: string | null; merchantFrameId?: string | null; experienceId: string | null; type: string; _count: { _all: number } }): MerchantCommerceActivityEvent {
  return {
    merchantSessionId: row.merchantSessionId,
    merchantFrameId: row.merchantFrameId ?? null,
    experienceId: row.experienceId,
    type: row.type,
    count: row._count._all,
  }
}

export async function getMerchantCommerceIntelligence(input: {
  merchantId: string
} & AnalyticsRangeInput): Promise<MerchantCommerceIntelligence> {
  const currentPeriod = resolveAnalyticsPeriod({ from: input.from, to: input.to })
  const windowMs = currentPeriod.to.getTime() - currentPeriod.from.getTime()
  const previousPeriod = { from: new Date(currentPeriod.from.getTime() - windowMs), to: currentPeriod.from }
  const experiences = await prisma.experience.findMany({
    where: { merchantId: input.merchantId, type: { in: ['STORE', 'CAMPAIGN'] } },
    select: { id: true, type: true, name: true, status: true, referenceData: true },
  })
  const loadWindow = async (from: Date, until: Date): Promise<MerchantCommerceActivity> => {
    const scope = { merchantId: input.merchantId, createdAt: { gte: from, lt: until } }
    const [sessions, events, intents] = await Promise.all([
      prisma.merchantSession.findMany({
        where: scope,
        select: { id: true, experienceId: true, source: true, medium: true, referrer: true, aiAgentSource: true },
      }),
      prisma.merchantEvent.groupBy({
        by: ['merchantSessionId', 'experienceId', 'merchantFrameId', 'type'],
        where: scope,
        _count: { _all: true },
      }),
      prisma.merchantIntent.groupBy({
        by: ['merchantSessionId', 'experienceId', 'merchantFrameId', 'type'],
        where: scope,
        _count: { _all: true },
      }),
    ])
    return {
      experiences: experiences as MerchantCommerceActivityExperience[],
      sessions: sessions as MerchantCommerceActivitySession[],
      events: (events as Array<{ merchantSessionId: string | null; experienceId: string | null; merchantFrameId: string | null; type: string; _count: { _all: number } }>).map(mapGroup),
      intents: (intents as Array<{ merchantSessionId: string; experienceId: string | null; merchantFrameId: string | null; type: string; _count: { _all: number } }>).map((row) => ({
        merchantSessionId: row.merchantSessionId,
        merchantFrameId: row.merchantFrameId,
        experienceId: row.experienceId,
        type: row.type,
        count: row._count._all,
      })),
    }
  }
  const [current, previous] = await Promise.all([
    loadWindow(currentPeriod.from, currentPeriod.to),
    loadWindow(previousPeriod.from, previousPeriod.to),
  ])
  return buildMerchantCommerceIntelligence({ current, previous, currentPeriod, previousPeriod })
}

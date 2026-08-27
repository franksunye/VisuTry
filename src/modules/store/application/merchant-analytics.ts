import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { requireAgentScope, type MerchantActorContext } from '@/modules/merchant/domain/actor'
import { resolveCampaignConversionPolicy } from '../domain/campaign-policy'
import { buildCampaignScorecard } from '../domain/merchant-analytics'
import {
  analyticsPeriodDto,
  computeExperienceAnalytics,
  MerchantAnalyticsError,
  referencedAnalyticsFrameIds,
  resolveAnalyticsPeriod,
  type AnalyticsRangeInput,
  type MerchantAnalyticsFunnelStage,
  type MerchantAnalyticsPeriodDto,
  type MerchantAnalyticsTopFrame,
  type MerchantIntentTotals,
} from './merchant-analytics-compute'

export {
  ANALYTICS_DEFAULT_RANGE_DAYS,
  ANALYTICS_MAX_RANGE_DAYS,
  MerchantAnalyticsError,
  resolveAnalyticsPeriod,
  type AnalyticsRangeInput,
} from './merchant-analytics-compute'

export type MerchantAnalyticsContext = {
  actor: MerchantActorContext
  experienceId: string
} & AnalyticsRangeInput

export type MerchantAnalyticsSummary = {
  experience: {
    id: string
    type: 'STORE' | 'CAMPAIGN'
    slug: string
    name: string
    status: string
    objective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null
    gate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null
  }
  period: MerchantAnalyticsPeriodDto
  referenceData: boolean
  metrics: import('../domain/merchant-analytics').MerchantAnalyticsMetrics
  scorecard: ReturnType<typeof buildCampaignScorecard>
}

export type MerchantAnalyticsFunnel = {
  experienceId: string
  period: MerchantAnalyticsPeriodDto
  referenceData: boolean
  stages: MerchantAnalyticsFunnelStage[]
}

export type { MerchantAnalyticsTopFrame }

export type MerchantIntentSummary = MerchantIntentTotals & {
  experienceId: string
  period: MerchantAnalyticsPeriodDto
  referenceData: boolean
}

type ExperienceAnalyticsRow = {
  id: string
  merchantId: string
  type: 'STORE' | 'CAMPAIGN'
  slug: string
  name: string
  status: string
  campaignObjective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null
  campaignGate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null
  presentationMode: 'ACTION_FIRST' | 'PRODUCT_FIRST' | 'EDITORIAL_FIRST' | null
  referenceData: boolean
}

async function authorizeActor(actor: MerchantActorContext): Promise<void> {
  requireAgentScope(actor, 'analytics:read')
  if (actor.actorType === 'HUMAN') {
    await requireMerchantMembership({ userId: actor.actorId, merchantId: actor.merchantId })
  }
}

async function findExperience(actor: MerchantActorContext, experienceId: string): Promise<ExperienceAnalyticsRow> {
  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, merchantId: actor.merchantId },
    select: {
      id: true,
      merchantId: true,
      type: true,
      slug: true,
      name: true,
      status: true,
      campaignObjective: true,
      campaignGate: true,
      presentationMode: true,
      referenceData: true,
    },
  })
  if (!experience || (experience.type !== 'STORE' && experience.type !== 'CAMPAIGN')) {
    throw new MerchantAnalyticsError('EXPERIENCE_NOT_FOUND', 'Experience not found.')
  }
  return experience as ExperienceAnalyticsRow
}

async function loadAnalytics(input: MerchantAnalyticsContext) {
  await authorizeActor(input.actor)
  const experience = await findExperience(input.actor, input.experienceId)
  const period = resolveAnalyticsPeriod(input)
  const scope = {
    merchantId: input.actor.merchantId,
    experienceId: experience.id,
    createdAt: { gte: period.from, lt: period.to },
  }

  const [sessionRows, eventGroups, intentGroups] = await Promise.all([
    prisma.merchantSession.findMany({ where: scope, select: { id: true } }),
    prisma.merchantEvent.groupBy({
      by: ['merchantSessionId', 'merchantFrameId', 'type'],
      where: scope,
      _count: { _all: true },
    }),
    prisma.merchantIntent.groupBy({
      by: ['merchantSessionId', 'merchantFrameId', 'type'],
      where: scope,
      _count: { _all: true },
    }),
  ])

  const sessionIds = (sessionRows as Array<{ id: string }>).map((row) => row.id)
  const events = (eventGroups as Array<{ merchantSessionId: string | null; merchantFrameId: string | null; type: string; _count: { _all: number } }>).map((row) => ({
    merchantSessionId: row.merchantSessionId,
    merchantFrameId: row.merchantFrameId,
    type: row.type,
    count: row._count._all,
  }))
  const intents = (intentGroups as Array<{ merchantSessionId: string; merchantFrameId: string | null; type: string; _count: { _all: number } }>).map((row) => ({
    merchantSessionId: row.merchantSessionId,
    merchantFrameId: row.merchantFrameId,
    type: row.type,
    count: row._count._all,
  }))
  const frameIds = referencedAnalyticsFrameIds(events, intents)
  const frames = frameIds.length
    ? await prisma.merchantFrame.findMany({
      where: { merchantId: input.actor.merchantId, id: { in: frameIds } },
      select: { id: true, sku: true, name: true, imageUrl: true },
    })
    : []
  const computed = computeExperienceAnalytics({ sessionIds, events, intents, frames })
  const objective = resolveCampaignConversionPolicy(experience)?.objective ?? null
  return { experience, period, objective, computed, referenceData: experience.referenceData }
}

function experienceDto(experience: ExperienceAnalyticsRow, objective: MerchantAnalyticsSummary['experience']['objective']) {
  return {
    id: experience.id,
    type: experience.type,
    slug: experience.slug,
    name: experience.name,
    status: experience.status,
    objective,
    gate: experience.type === 'CAMPAIGN' ? experience.campaignGate ?? 'NONE' : null,
  }
}

export async function getExperienceAnalyticsSummary(input: MerchantAnalyticsContext): Promise<MerchantAnalyticsSummary> {
  const data = await loadAnalytics(input)
  return {
    experience: experienceDto(data.experience, data.objective),
    period: analyticsPeriodDto(data.period),
    referenceData: data.referenceData,
    metrics: data.computed.metrics,
    scorecard: buildCampaignScorecard(data.objective, data.computed.metrics),
  }
}

export async function getExperienceFunnel(input: MerchantAnalyticsContext): Promise<MerchantAnalyticsFunnel> {
  const data = await loadAnalytics(input)
  return {
    experienceId: data.experience.id,
    period: analyticsPeriodDto(data.period),
    referenceData: data.referenceData,
    stages: data.computed.funnelStages,
  }
}

export async function getTopFramesByIntent(input: MerchantAnalyticsContext): Promise<{
  experienceId: string
  period: MerchantAnalyticsPeriodDto
  referenceData: boolean
  frames: MerchantAnalyticsTopFrame[]
}> {
  const data = await loadAnalytics(input)
  return {
    experienceId: data.experience.id,
    period: analyticsPeriodDto(data.period),
    referenceData: data.referenceData,
    frames: data.computed.topFrames,
  }
}

export async function getMerchantIntentSummary(input: MerchantAnalyticsContext): Promise<MerchantIntentSummary> {
  const data = await loadAnalytics(input)
  return {
    experienceId: data.experience.id,
    period: analyticsPeriodDto(data.period),
    referenceData: data.referenceData,
    ...data.computed.intent,
  }
}

export async function listMerchantExperienceAnalytics(input: {
  actor: MerchantActorContext
} & AnalyticsRangeInput): Promise<MerchantAnalyticsSummary[]> {
  await authorizeActor(input.actor)
  const period = resolveAnalyticsPeriod(input)
  const experiences = await prisma.experience.findMany({
    where: { merchantId: input.actor.merchantId, type: { in: ['STORE', 'CAMPAIGN'] } },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      merchantId: true,
      type: true,
      slug: true,
      name: true,
      status: true,
      campaignObjective: true,
      campaignGate: true,
      presentationMode: true,
      referenceData: true,
    },
  })
  const scope = {
    merchantId: input.actor.merchantId,
    createdAt: { gte: period.from, lt: period.to },
  }
  const [sessionRows, eventGroups, intentGroups] = await Promise.all([
    prisma.merchantSession.findMany({ where: scope, select: { id: true, experienceId: true } }),
    prisma.merchantEvent.groupBy({
      by: ['experienceId', 'merchantSessionId', 'merchantFrameId', 'type'],
      where: scope,
      _count: { _all: true },
    }),
    prisma.merchantIntent.groupBy({
      by: ['experienceId', 'merchantSessionId', 'merchantFrameId', 'type'],
      where: scope,
      _count: { _all: true },
    }),
  ])

  return (experiences as ExperienceAnalyticsRow[]).map((experience) => {
    const sessionIds = (sessionRows as Array<{ id: string; experienceId: string | null }>)
      .filter((row) => row.experienceId === experience.id)
      .map((row) => row.id)
    const events = (eventGroups as Array<{ experienceId: string | null; merchantSessionId: string | null; merchantFrameId: string | null; type: string; _count: { _all: number } }>)
      .filter((row) => row.experienceId === experience.id)
      .map((row) => ({
        merchantSessionId: row.merchantSessionId,
        merchantFrameId: row.merchantFrameId,
        type: row.type,
        count: row._count._all,
      }))
    const intents = (intentGroups as Array<{ experienceId: string | null; merchantSessionId: string; merchantFrameId: string | null; type: string; _count: { _all: number } }>)
      .filter((row) => row.experienceId === experience.id)
      .map((row) => ({
        merchantSessionId: row.merchantSessionId,
        merchantFrameId: row.merchantFrameId,
        type: row.type,
        count: row._count._all,
      }))
    const computed = computeExperienceAnalytics({ sessionIds, events, intents, includeTopFrames: false })
    const objective = resolveCampaignConversionPolicy(experience)?.objective ?? null
    return {
      experience: experienceDto(experience, objective),
      period: analyticsPeriodDto(period),
      referenceData: experience.referenceData,
      metrics: computed.metrics,
      scorecard: buildCampaignScorecard(objective, computed.metrics),
    }
  })
}

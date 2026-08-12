import { prisma } from '@/lib/prisma'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { requireAgentScope, type MerchantActorContext } from '@/modules/merchant/domain/actor'
import { resolveCampaignConversionPolicy } from '../domain/campaign-policy'
import {
  buildCampaignScorecard,
  highIntentScore,
  isHighIntentSession,
  safeRate,
  type MerchantAnalyticsMetrics,
  type MerchantAnalyticsSessionSignals,
} from '../domain/merchant-analytics'

const DEFAULT_RANGE_DAYS = 30
const MAX_RANGE_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

type AnalyticsPeriod = {
  from: Date
  to: Date
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

type SessionSignals = MerchantAnalyticsSessionSignals

type EventGroup = {
  merchantSessionId: string | null
  merchantFrameId: string | null
  type: string
  _count: { _all: number }
}

type IntentGroup = {
  merchantSessionId: string
  merchantFrameId: string | null
  type: 'FAVORITE' | 'PRODUCT_CLICK' | 'INQUIRY'
  _count: { _all: number }
}

type FrameRow = {
  id: string
  sku: string | null
  name: string
  imageUrl: string | null
}

export type AnalyticsRangeInput = {
  from?: string | Date | null
  to?: string | Date | null
}

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
  period: {
    from: string
    to: string
    timezone: 'UTC'
  }
  referenceData: boolean
  metrics: MerchantAnalyticsMetrics
  scorecard: ReturnType<typeof buildCampaignScorecard>
}

export type MerchantAnalyticsFunnel = {
  experienceId: string
  period: MerchantAnalyticsSummary['period']
  referenceData: boolean
  stages: Array<{ stage: 'VISIT' | 'ENGAGED' | 'TRY_ON_STARTED' | 'TRY_ON_COMPLETED' | 'HIGH_INTENT' | 'MERCHANT_CTA'; sessions: number | null; available: boolean }>
}

export type MerchantAnalyticsTopFrame = {
  frameId: string
  sku: string | null
  name: string
  imageUrl: string | null
  tryOnCount: number
  favoriteCount: number
  compareCount: number
  ctaCount: number | null
  highIntentInteractions: number
  intentScore: number
}

export type MerchantIntentSummary = {
  experienceId: string
  period: MerchantAnalyticsSummary['period']
  referenceData: boolean
  favorites: number
  compares: number
  merchantCtaClicks: number | null
  highIntentSessions: number
  identifiedSessions: number | null
}

export class MerchantAnalyticsError extends Error {
  readonly code: 'INVALID_RANGE' | 'EXPERIENCE_NOT_FOUND'
  readonly httpStatus: 400 | 404

  constructor(code: MerchantAnalyticsError['code'], message: string) {
    super(message)
    this.name = 'MerchantAnalyticsError'
    this.code = code
    this.httpStatus = code === 'EXPERIENCE_NOT_FOUND' ? 404 : 400
  }
}

function parseDate(value: string | Date | null | undefined, label: string): Date | null {
  if (value == null) return null
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new MerchantAnalyticsError('INVALID_RANGE', `${label} must be a valid date.`)
  return date
}

function resolvePeriod(input: AnalyticsRangeInput, now = new Date()): AnalyticsPeriod {
  const to = parseDate(input.to, 'to') ?? now
  const from = parseDate(input.from, 'from') ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS)
  if (from >= to) throw new MerchantAnalyticsError('INVALID_RANGE', 'from must be earlier than to.')
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    throw new MerchantAnalyticsError('INVALID_RANGE', `Analytics range cannot exceed ${MAX_RANGE_DAYS} days.`)
  }
  return { from, to }
}

function periodDto(period: AnalyticsPeriod) {
  return { from: period.from.toISOString(), to: period.to.toISOString(), timezone: 'UTC' as const }
}

function uniqueSessionCount(groups: Array<{ merchantSessionId: string | null }>): number {
  return new Set(groups.map((row) => row.merchantSessionId).filter((id): id is string => Boolean(id))).size
}

function ensureSessionSignals(map: Map<string, SessionSignals>, sessionId: string): SessionSignals {
  const existing = map.get(sessionId)
  if (existing) return existing
  const created: SessionSignals = {
    tryOnStarts: 0,
    tryOnCompletions: 0,
    uniqueFramesTried: 0,
    favorites: 0,
    compares: 0,
    frameInteractions: 0,
    productInteractions: 0,
  }
  map.set(sessionId, created)
  return created
}

function eventCount(groups: EventGroup[], type: string): number {
  return groups.filter((row) => row.type === type).reduce((total, row) => total + row._count._all, 0)
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
  const period = resolvePeriod(input)
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

  const validSessionIds = new Set((sessionRows as Array<{ id: string }>).map((row) => row.id))
  const events = (eventGroups as unknown as EventGroup[]).filter((row) => row.merchantSessionId && validSessionIds.has(row.merchantSessionId))
  const intents = (intentGroups as unknown as IntentGroup[]).filter((row) => validSessionIds.has(row.merchantSessionId))
  const sessionSignals = new Map<string, SessionSignals>()
  const completedFrameIds = new Set<string>()

  for (const row of events) {
    if (!row.merchantSessionId) continue
    const signal = ensureSessionSignals(sessionSignals, row.merchantSessionId)
    if (row.type === 'merchant_tryon_started') signal.tryOnStarts += row._count._all
    if (row.type === 'merchant_tryon_completed') {
      signal.tryOnCompletions += row._count._all
      if (row.merchantFrameId) {
        completedFrameIds.add(row.merchantFrameId)
        signal.uniqueFramesTried += 1
      }
    }
    if (row.type === 'merchant_frame_selected') signal.frameInteractions += row._count._all
    if (row.type === 'merchant_compare_started') signal.compares += row._count._all
  }
  for (const row of intents) {
    const signal = ensureSessionSignals(sessionSignals, row.merchantSessionId)
    if (row.type === 'FAVORITE') signal.favorites += row._count._all
  }

  const engagedSessions = Array.from(sessionSignals.values()).filter((signal) =>
    signal.frameInteractions > 0 || signal.tryOnStarts > 0 || signal.favorites > 0 || signal.compares > 0 || signal.productInteractions > 0,
  ).length
  const highIntentSessions = Array.from(sessionSignals.values()).filter(isHighIntentSession).length
  const favorites = intents.filter((row) => row.type === 'FAVORITE').reduce((total, row) => total + row._count._all, 0)
  const compares = eventCount(events, 'merchant_compare_started')
  const tryOnStarts = eventCount(events, 'merchant_tryon_started')
  const tryOnCompletions = eventCount(events, 'merchant_tryon_completed')
  const framesTried = events
    .filter((row) => row.type === 'merchant_tryon_completed' && row.merchantFrameId)
    .reduce((total, row) => total + row._count._all, 0)
  const objective = resolveCampaignConversionPolicy(experience)?.objective ?? null
  const metrics: MerchantAnalyticsMetrics = {
    visits: validSessionIds.size,
    engagedSessions,
    engagementRate: safeRate(engagedSessions, validSessionIds.size),
    tryOnStarts,
    tryOnCompletions,
    tryOnCompletionRate: safeRate(tryOnCompletions, tryOnStarts),
    framesTried,
    uniqueFramesTried: completedFrameIds.size,
    favorites,
    compares,
    merchantCtaClicks: null,
    highIntentSessions,
    highIntentRate: safeRate(highIntentSessions, validSessionIds.size),
  }

  const frameIds = new Set<string>()
  const frameStats = new Map<string, { tryOnCount: number; favoriteCount: number; compareCount: number; highIntentInteractions: number }>()
  const bumpFrame = (frameId: string | null, key: 'tryOnCount' | 'favoriteCount' | 'compareCount', count: number) => {
    if (!frameId) return
    frameIds.add(frameId)
    const stats = frameStats.get(frameId) ?? { tryOnCount: 0, favoriteCount: 0, compareCount: 0, highIntentInteractions: 0 }
    stats[key] += count
    frameStats.set(frameId, stats)
  }
  for (const row of events) {
    if (row.type === 'merchant_tryon_completed') bumpFrame(row.merchantFrameId, 'tryOnCount', row._count._all)
    if (row.type === 'merchant_compare_started') bumpFrame(row.merchantFrameId, 'compareCount', row._count._all)
  }
  for (const row of intents) if (row.type === 'FAVORITE') bumpFrame(row.merchantFrameId, 'favoriteCount', row._count._all)

  const eventsBySession = new Map<string, EventGroup[]>()
  for (const row of events) {
    if (!row.merchantSessionId) continue
    const rows = eventsBySession.get(row.merchantSessionId) ?? []
    rows.push(row)
    eventsBySession.set(row.merchantSessionId, rows)
  }
  for (const [sessionId, signal] of sessionSignals) {
    if (!isHighIntentSession(signal)) continue
    for (const row of eventsBySession.get(sessionId) ?? []) {
      if (row.merchantFrameId && (row.type === 'merchant_tryon_completed' || row.type === 'merchant_frame_selected')) {
        const stats = frameStats.get(row.merchantFrameId) ?? { tryOnCount: 0, favoriteCount: 0, compareCount: 0, highIntentInteractions: 0 }
        stats.highIntentInteractions += row._count._all
        frameStats.set(row.merchantFrameId, stats)
        frameIds.add(row.merchantFrameId)
      }
    }
  }

  const frames = frameIds.size
    ? await prisma.merchantFrame.findMany({ where: { merchantId: input.actor.merchantId, id: { in: Array.from(frameIds) } }, select: { id: true, sku: true, name: true, imageUrl: true } })
    : []
  if (frames.length !== frameIds.size) throw new MerchantAccessError()
  const frameById = new Map((frames as FrameRow[]).map((frame) => [frame.id, frame]))
  const topFrames: MerchantAnalyticsTopFrame[] = Array.from(frameStats.entries()).map(([frameId, stats]) => {
    const frame = frameById.get(frameId)
    return {
      frameId,
      sku: frame?.sku ?? null,
      name: frame?.name ?? 'Unknown frame',
      imageUrl: frame?.imageUrl ?? null,
      ...stats,
      ctaCount: null,
      intentScore: stats.tryOnCount * 2 + stats.favoriteCount * 3 + stats.compareCount * 2,
    }
  }).sort((a, b) => b.intentScore - a.intentScore || a.name.localeCompare(b.name))

  return { experience, period, objective, metrics, topFrames, sessionSignals, referenceData: experience.referenceData }
}

export async function getExperienceAnalyticsSummary(input: MerchantAnalyticsContext): Promise<MerchantAnalyticsSummary> {
  const data = await loadAnalytics(input)
  return {
    experience: {
      id: data.experience.id,
      type: data.experience.type,
      slug: data.experience.slug,
      name: data.experience.name,
      status: data.experience.status,
      objective: data.objective,
      gate: data.experience.type === 'CAMPAIGN' ? data.experience.campaignGate ?? 'NONE' : null,
    },
    period: periodDto(data.period),
    referenceData: data.referenceData,
    metrics: data.metrics,
    scorecard: buildCampaignScorecard(data.objective, data.metrics),
  }
}

export async function getExperienceFunnel(input: MerchantAnalyticsContext): Promise<MerchantAnalyticsFunnel> {
  const data = await loadAnalytics(input)
  return {
    experienceId: data.experience.id,
    period: periodDto(data.period),
    referenceData: data.referenceData,
    stages: [
      { stage: 'VISIT', sessions: data.metrics.visits, available: true },
      { stage: 'ENGAGED', sessions: data.metrics.engagedSessions, available: true },
      { stage: 'TRY_ON_STARTED', sessions: new Set(Array.from(data.sessionSignals.entries()).filter(([, signal]) => signal.tryOnStarts > 0).map(([id]) => id)).size, available: true },
      { stage: 'TRY_ON_COMPLETED', sessions: new Set(Array.from(data.sessionSignals.entries()).filter(([, signal]) => signal.tryOnCompletions > 0).map(([id]) => id)).size, available: true },
      { stage: 'HIGH_INTENT', sessions: data.metrics.highIntentSessions, available: true },
      { stage: 'MERCHANT_CTA', sessions: null, available: false },
    ],
  }
}

export async function getTopFramesByIntent(input: MerchantAnalyticsContext): Promise<{ experienceId: string; period: MerchantAnalyticsSummary['period']; referenceData: boolean; frames: MerchantAnalyticsTopFrame[] }> {
  const data = await loadAnalytics(input)
  return { experienceId: data.experience.id, period: periodDto(data.period), referenceData: data.referenceData, frames: data.topFrames }
}

export async function getMerchantIntentSummary(input: MerchantAnalyticsContext): Promise<MerchantIntentSummary> {
  const data = await loadAnalytics(input)
  return {
    experienceId: data.experience.id,
    period: periodDto(data.period),
    referenceData: data.referenceData,
    favorites: data.metrics.favorites,
    compares: data.metrics.compares,
    merchantCtaClicks: null,
    highIntentSessions: data.metrics.highIntentSessions,
    identifiedSessions: null,
  }
}

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { requireAgentScope, type MerchantActorContext } from '@/modules/merchant/domain/actor'
import { resolveCampaignConversionPolicy } from '../domain/campaign-policy'
import { buildCampaignScorecard, isHighIntentSession, safeRate, type MerchantAnalyticsMetrics, type MerchantAnalyticsSessionSignals } from '../domain/merchant-analytics'

const DEFAULT_RANGE_DAYS = 30
const MAX_RANGE_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

export type AnalyticsRangeInput = { from?: string | Date | null; to?: string | Date | null }
export type MerchantAnalyticsContext = { actor: MerchantActorContext; experienceId: string } & AnalyticsRangeInput

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

type Row = Record<string, unknown>
type Period = { from: Date; to: Date }
type Signal = MerchantAnalyticsSessionSignals & { triedFrameIds: Set<string> }

function dateValue(value: string | Date | null | undefined, label: string): Date | null {
  if (value == null) return null
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new MerchantAnalyticsError('INVALID_RANGE', `${label} must be a valid date.`)
  return date
}

function period(input: AnalyticsRangeInput): Period {
  const to = dateValue(input.to, 'to') ?? new Date()
  const from = dateValue(input.from, 'from') ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS)
  if (from >= to) throw new MerchantAnalyticsError('INVALID_RANGE', 'from must be earlier than to.')
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) throw new MerchantAnalyticsError('INVALID_RANGE', `Analytics range cannot exceed ${MAX_RANGE_DAYS} days.`)
  return { from, to }
}

function periodDto(value: Period) { return { from: value.from.toISOString(), to: value.to.toISOString(), timezone: 'UTC' as const } }
function countRows(rows: Array<Record<string, unknown>>) { return rows.reduce((total, row) => total + Number(row.count ?? 0), 0) }
function emptySignal(): Signal { return { tryOnStarts: 0, tryOnCompletions: 0, uniqueFramesTried: 0, favorites: 0, compares: 0, frameInteractions: 0, productInteractions: 0, triedFrameIds: new Set() } }
function ensureSignal(signals: Map<string, Signal>, id: string) { const value = signals.get(id) ?? emptySignal(); signals.set(id, value); return value }

async function loadAnalytics(input: MerchantAnalyticsContext) {
  requireAgentScope(input.actor, 'analytics:read')
  const range = period(input)
  const sql = getCloudflareSql()
  const experienceRows = await sql`
    SELECT e."id", e."merchantId", e."type", e."slug", e."name", e."status", e."campaignObjective", e."campaignGate", e."referenceData",
      m."referenceData" AS "merchantReferenceData"
    FROM "Experience" e JOIN "Merchant" m ON m."id" = e."merchantId"
    WHERE e."id" = ${input.experienceId} AND e."merchantId" = ${input.actor.merchantId} AND e."type" IN ('STORE', 'CAMPAIGN')
    LIMIT 1
  `
  const experience = experienceRows[0]
  if (!experience) throw new MerchantAnalyticsError('EXPERIENCE_NOT_FOUND', 'Experience not found.')
  const [sessions, events, intents] = await Promise.all([
    sql`SELECT "id" FROM "MerchantSession" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to}`,
    sql`SELECT "merchantSessionId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to} GROUP BY "merchantSessionId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to} GROUP BY "merchantSessionId", "merchantFrameId", "type"`,
  ])
  const validSessionIds = new Set(sessions.map((row) => String(row.id)))
  const signals = new Map<string, Signal>()
  const completedFrameIds = new Set<string>()
  const eventCount = (type: string) => events.filter((row) => String(row.type) === type).reduce((total, row) => total + Number(row.count ?? 0), 0)
  for (const row of events) {
    if (!row.merchantSessionId || !validSessionIds.has(String(row.merchantSessionId))) continue
    const signal = ensureSignal(signals, String(row.merchantSessionId))
    const type = String(row.type)
    const count = Number(row.count ?? 0)
    if (type === 'merchant_tryon_started') signal.tryOnStarts += count
    if (type === 'merchant_tryon_completed') {
      signal.tryOnCompletions += count
      const frameId = row.merchantFrameId == null ? null : String(row.merchantFrameId)
      if (frameId) { completedFrameIds.add(frameId); signal.triedFrameIds.add(frameId); signal.uniqueFramesTried = signal.triedFrameIds.size }
    }
    if (type === 'merchant_frame_selected') signal.frameInteractions += count
    if (type === 'merchant_compare_started') signal.compares += count
  }
  for (const row of intents) {
    const sessionId = String(row.merchantSessionId)
    if (!validSessionIds.has(sessionId)) continue
    const signal = ensureSignal(signals, sessionId)
    const type = String(row.type)
    const count = Number(row.count ?? 0)
    if (type === 'FAVORITE') signal.favorites += count
    if (type === 'PRODUCT_CLICK' || type === 'INQUIRY') signal.productInteractions += count
  }
  const engagedSessions = [...signals.values()].filter((signal) => signal.frameInteractions > 0 || signal.tryOnStarts > 0 || signal.favorites > 0 || signal.compares > 0 || signal.productInteractions > 0).length
  const highIntentSessions = [...signals.values()].filter(isHighIntentSession).length
  const metrics: MerchantAnalyticsMetrics = {
    visits: validSessionIds.size,
    engagedSessions,
    engagementRate: safeRate(engagedSessions, validSessionIds.size),
    tryOnStarts: eventCount('merchant_tryon_started'),
    tryOnCompletions: eventCount('merchant_tryon_completed'),
    tryOnCompletionRate: safeRate(eventCount('merchant_tryon_completed'), eventCount('merchant_tryon_started')),
    framesTried: eventCount('merchant_tryon_completed'),
    uniqueFramesTried: completedFrameIds.size,
    favorites: countRows(intents.filter((row) => String(row.type) === 'FAVORITE')),
    compares: eventCount('merchant_compare_started'),
    merchantCtaClicks: null,
    highIntentSessions,
    highIntentRate: safeRate(highIntentSessions, validSessionIds.size),
  }
  const objective = resolveCampaignConversionPolicy({ type: String(experience.type), campaignObjective: experience.campaignObjective == null ? null : String(experience.campaignObjective), campaignGate: experience.campaignGate == null ? null : String(experience.campaignGate) } as never)?.objective ?? null
  const frameIds = new Set<string>()
  for (const row of events) if (row.merchantFrameId && ['merchant_tryon_completed', 'merchant_compare_started', 'merchant_frame_selected'].includes(String(row.type))) frameIds.add(String(row.merchantFrameId))
  for (const row of intents) if (row.merchantFrameId && String(row.type) === 'FAVORITE') frameIds.add(String(row.merchantFrameId))
  const frames = frameIds.size ? await sql`SELECT "id", "sku", "name", "imageUrl" FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId} AND "id" = ANY(${[...frameIds]})` : []
  const frameById = new Map(frames.map((frame) => [String(frame.id), frame]))
  const topFrames = [...frameIds].map((frameId) => {
    const frame = frameById.get(frameId)
    const frameEvents = events.filter((row) => String(row.merchantFrameId) === frameId)
    const frameIntents = intents.filter((row) => String(row.merchantFrameId) === frameId)
    const tryOnCount = countRows(frameEvents.filter((row) => String(row.type) === 'merchant_tryon_completed'))
    const compareCount = countRows(frameEvents.filter((row) => String(row.type) === 'merchant_compare_started'))
    const favoriteCount = countRows(frameIntents.filter((row) => String(row.type) === 'FAVORITE'))
    return { frameId, sku: frame?.sku == null ? null : String(frame.sku), name: frame?.name == null ? 'Unknown frame' : String(frame.name), imageUrl: frame?.imageUrl == null ? null : String(frame.imageUrl), tryOnCount, favoriteCount, compareCount, ctaCount: null, highIntentInteractions: 0, intentScore: tryOnCount * 2 + favoriteCount * 3 + compareCount * 2 }
  }).sort((left, right) => right.intentScore - left.intentScore || left.name.localeCompare(right.name))
  return { experience, range, metrics, signals, topFrames, referenceData: Boolean(experience.referenceData) || Boolean(experience.merchantReferenceData), objective }
}

export async function getExperienceAnalyticsSummary(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return {
    experience: { id: String(data.experience.id), type: String(data.experience.type) as 'STORE' | 'CAMPAIGN', slug: String(data.experience.slug), name: String(data.experience.name), status: String(data.experience.status), objective: data.objective, gate: String(data.experience.type) === 'CAMPAIGN' ? String(data.experience.campaignGate ?? 'NONE') : null },
    period: periodDto(data.range),
    referenceData: data.referenceData,
    metrics: data.metrics,
    scorecard: buildCampaignScorecard(data.objective, data.metrics),
  }
}

export async function getExperienceFunnel(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  const signalEntries = [...data.signals.entries()]
  return {
    experienceId: String(data.experience.id),
    period: periodDto(data.range),
    referenceData: data.referenceData,
    stages: [
      { stage: 'VISIT', sessions: data.metrics.visits, available: true },
      { stage: 'ENGAGED', sessions: data.metrics.engagedSessions, available: true },
      { stage: 'TRY_ON_STARTED', sessions: new Set(signalEntries.filter(([, signal]) => signal.tryOnStarts > 0).map(([id]) => id)).size, available: true },
      { stage: 'TRY_ON_COMPLETED', sessions: new Set(signalEntries.filter(([, signal]) => signal.tryOnCompletions > 0).map(([id]) => id)).size, available: true },
      { stage: 'HIGH_INTENT', sessions: data.metrics.highIntentSessions, available: true },
      { stage: 'MERCHANT_CTA', sessions: null, available: false },
    ],
  }
}

export async function getTopFramesByIntent(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return { experienceId: String(data.experience.id), period: periodDto(data.range), referenceData: data.referenceData, frames: data.topFrames }
}

export async function getMerchantIntentSummary(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return { experienceId: String(data.experience.id), period: periodDto(data.range), referenceData: data.referenceData, tryOnStarts: data.metrics.tryOnStarts, tryOnCompletions: data.metrics.tryOnCompletions, framesTried: data.metrics.framesTried, uniqueFramesTried: data.metrics.uniqueFramesTried, favorites: data.metrics.favorites, compares: data.metrics.compares, merchantCtaClicks: null, highIntentSessions: data.metrics.highIntentSessions, identifiedSessions: null, identifiedIntentAvailable: false }
}

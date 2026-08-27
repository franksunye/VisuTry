import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import {
  isHighIntentSession,
  safeRate,
  type MerchantAnalyticsMetrics,
  type MerchantAnalyticsSessionSignals,
} from '../domain/merchant-analytics'

export const ANALYTICS_DEFAULT_RANGE_DAYS = 30
export const ANALYTICS_MAX_RANGE_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

export type AnalyticsPeriod = { from: Date; to: Date }

export type AnalyticsRangeInput = {
  from?: string | Date | null
  to?: string | Date | null
}

export type AnalyticsEventRow = {
  merchantSessionId: string | null
  merchantFrameId: string | null
  type: string
  count: number
}

export type AnalyticsIntentRow = {
  merchantSessionId: string
  merchantFrameId: string | null
  type: string
  count: number
}

export type AnalyticsFrameRow = {
  id: string
  sku: string | null
  name: string
  imageUrl: string | null
}

export type MerchantAnalyticsPeriodDto = {
  from: string
  to: string
  timezone: 'UTC'
}

export type MerchantAnalyticsFunnelStage = {
  stage: 'VISIT' | 'ENGAGED' | 'TRY_ON_STARTED' | 'TRY_ON_COMPLETED' | 'HIGH_INTENT' | 'MERCHANT_CTA'
  sessions: number | null
  available: boolean
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

export type MerchantIntentTotals = {
  tryOnStarts: number
  tryOnCompletions: number
  framesTried: number
  uniqueFramesTried: number
  favorites: number
  compares: number
  merchantCtaClicks: number | null
  highIntentSessions: number
  identifiedSessions: number | null
  identifiedIntentAvailable: false
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

export function parseAnalyticsDate(value: string | Date | null | undefined, label: string): Date | null {
  if (value == null) return null
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new MerchantAnalyticsError('INVALID_RANGE', `${label} must be a valid date.`)
  return date
}

export function resolveAnalyticsPeriod(input: AnalyticsRangeInput, now = new Date()): AnalyticsPeriod {
  const to = parseAnalyticsDate(input.to, 'to') ?? now
  const from = parseAnalyticsDate(input.from, 'from') ?? new Date(to.getTime() - ANALYTICS_DEFAULT_RANGE_DAYS * DAY_MS)
  if (from >= to) throw new MerchantAnalyticsError('INVALID_RANGE', 'from must be earlier than to.')
  if (to.getTime() - from.getTime() > ANALYTICS_MAX_RANGE_DAYS * DAY_MS) {
    throw new MerchantAnalyticsError('INVALID_RANGE', `Analytics range cannot exceed ${ANALYTICS_MAX_RANGE_DAYS} days.`)
  }
  return { from, to }
}

export function analyticsPeriodDto(period: AnalyticsPeriod): MerchantAnalyticsPeriodDto {
  return { from: period.from.toISOString(), to: period.to.toISOString(), timezone: 'UTC' }
}

function eventCount(events: AnalyticsEventRow[], type: string): number {
  return events.filter((row) => row.type === type).reduce((total, row) => total + row.count, 0)
}

function intentCount(intents: AnalyticsIntentRow[], type: string): number {
  return intents.filter((row) => row.type === type).reduce((total, row) => total + row.count, 0)
}

export function referencedAnalyticsFrameIds(
  events: readonly AnalyticsEventRow[],
  intents: readonly AnalyticsIntentRow[],
): string[] {
  const ids = new Set<string>()
  for (const row of events) {
    if (row.merchantFrameId && (row.type === 'merchant_tryon_completed' || row.type === 'merchant_compare_started' || row.type === 'merchant_frame_selected')) {
      ids.add(row.merchantFrameId)
    }
  }
  for (const row of intents) {
    if (row.merchantFrameId && row.type === 'FAVORITE') ids.add(row.merchantFrameId)
  }
  return [...ids]
}

type SessionCompute = MerchantAnalyticsSessionSignals & { triedFrameIds: Set<string> }

function emptySignal(): SessionCompute {
  return {
    tryOnStarts: 0,
    tryOnCompletions: 0,
    uniqueFramesTried: 0,
    favorites: 0,
    compares: 0,
    frameInteractions: 0,
    productInteractions: 0,
    triedFrameIds: new Set(),
  }
}

/**
 * Canonical C1 experience analytics from already tenant-scoped session/event/intent rows.
 *
 * Metric semantics (single-sourced):
 * - visits: distinct MerchantSession ids in range (inclusive from, exclusive to)
 * - engagedSessions: sessions with frame select, try-on start, favorite, compare, or product/inquiry intent
 * - tryOnStarts / tryOnCompletions: event counts (not unique sessions)
 * - framesTried: try-on completion event count; uniqueFramesTried: distinct completed frame ids
 * - favorites: FAVORITE intent count; compares: merchant_compare_started event count
 * - merchantCtaClicks / identifiedSessions: unavailable (null / false)
 * - highIntentSessions: sessions whose observed-behavior score is >= 4
 * - top-frame intentScore: tryOn*2 + favorite*3 + compare*2
 * - MERCHANT_CTA funnel stage: unavailable
 */
export function computeExperienceAnalytics(input: {
  sessionIds: readonly string[]
  events: readonly AnalyticsEventRow[]
  intents: readonly AnalyticsIntentRow[]
  frames?: readonly AnalyticsFrameRow[]
  includeTopFrames?: boolean
}): {
  metrics: MerchantAnalyticsMetrics
  funnelStages: MerchantAnalyticsFunnelStage[]
  topFrames: MerchantAnalyticsTopFrame[]
  intent: MerchantIntentTotals
  sessionSignals: Map<string, MerchantAnalyticsSessionSignals>
} {
  const validSessionIds = new Set(input.sessionIds)
  const events = input.events.filter((row) => row.merchantSessionId && validSessionIds.has(row.merchantSessionId))
  const intents = input.intents.filter((row) => validSessionIds.has(row.merchantSessionId))
  const sessionSignals = new Map<string, SessionCompute>()
  const completedFrameIds = new Set<string>()

  const ensure = (sessionId: string) => {
    const existing = sessionSignals.get(sessionId)
    if (existing) return existing
    const created = emptySignal()
    sessionSignals.set(sessionId, created)
    return created
  }

  for (const row of events) {
    if (!row.merchantSessionId) continue
    const signal = ensure(row.merchantSessionId)
    if (row.type === 'merchant_tryon_started') signal.tryOnStarts += row.count
    if (row.type === 'merchant_tryon_completed') {
      signal.tryOnCompletions += row.count
      if (row.merchantFrameId) {
        completedFrameIds.add(row.merchantFrameId)
        signal.triedFrameIds.add(row.merchantFrameId)
        signal.uniqueFramesTried = signal.triedFrameIds.size
      }
    }
    if (row.type === 'merchant_frame_selected') signal.frameInteractions += row.count
    if (row.type === 'merchant_compare_started') signal.compares += row.count
  }
  for (const row of intents) {
    const signal = ensure(row.merchantSessionId)
    if (row.type === 'FAVORITE') signal.favorites += row.count
    if (row.type === 'PRODUCT_CLICK' || row.type === 'INQUIRY') signal.productInteractions += row.count
  }

  const visits = validSessionIds.size
  const engagedSessions = Array.from(sessionSignals.values()).filter((signal) =>
    signal.frameInteractions > 0
    || signal.tryOnStarts > 0
    || signal.favorites > 0
    || signal.compares > 0
    || signal.productInteractions > 0,
  ).length
  const highIntentSessions = Array.from(sessionSignals.values()).filter(isHighIntentSession).length
  const tryOnStarts = eventCount(events, 'merchant_tryon_started')
  const tryOnCompletions = eventCount(events, 'merchant_tryon_completed')
  const framesTried = events
    .filter((row) => row.type === 'merchant_tryon_completed' && row.merchantFrameId)
    .reduce((total, row) => total + row.count, 0)
  const favorites = intentCount(intents, 'FAVORITE')
  const compares = eventCount(events, 'merchant_compare_started')

  const metrics: MerchantAnalyticsMetrics = {
    visits,
    engagedSessions,
    engagementRate: safeRate(engagedSessions, visits),
    tryOnStarts,
    tryOnCompletions,
    tryOnCompletionRate: safeRate(tryOnCompletions, tryOnStarts),
    framesTried,
    uniqueFramesTried: completedFrameIds.size,
    favorites,
    compares,
    merchantCtaClicks: null,
    highIntentSessions,
    highIntentRate: safeRate(highIntentSessions, visits),
  }

  const includeTopFrames = input.includeTopFrames !== false
  let topFrames: MerchantAnalyticsTopFrame[] = []
  if (includeTopFrames) {
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
      if (row.type === 'merchant_tryon_completed') bumpFrame(row.merchantFrameId, 'tryOnCount', row.count)
      if (row.type === 'merchant_compare_started') bumpFrame(row.merchantFrameId, 'compareCount', row.count)
    }
    for (const row of intents) if (row.type === 'FAVORITE') bumpFrame(row.merchantFrameId, 'favoriteCount', row.count)

    const eventsBySession = new Map<string, AnalyticsEventRow[]>()
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
          stats.highIntentInteractions += row.count
          frameStats.set(row.merchantFrameId, stats)
          frameIds.add(row.merchantFrameId)
        }
      }
    }

    const frameById = new Map((input.frames ?? []).map((frame) => [frame.id, frame]))
    for (const frameId of frameIds) {
      if (!frameById.has(frameId)) throw new MerchantAccessError()
    }
    topFrames = Array.from(frameStats.entries()).map(([frameId, stats]) => {
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
  }

  const publicSignals = new Map<string, MerchantAnalyticsSessionSignals>()
  for (const [id, signal] of sessionSignals) {
    publicSignals.set(id, {
      tryOnStarts: signal.tryOnStarts,
      tryOnCompletions: signal.tryOnCompletions,
      uniqueFramesTried: signal.uniqueFramesTried,
      favorites: signal.favorites,
      compares: signal.compares,
      frameInteractions: signal.frameInteractions,
      productInteractions: signal.productInteractions,
    })
  }

  return {
    metrics,
    funnelStages: [
      { stage: 'VISIT', sessions: metrics.visits, available: true },
      { stage: 'ENGAGED', sessions: metrics.engagedSessions, available: true },
      { stage: 'TRY_ON_STARTED', sessions: new Set(Array.from(sessionSignals.entries()).filter(([, signal]) => signal.tryOnStarts > 0).map(([id]) => id)).size, available: true },
      { stage: 'TRY_ON_COMPLETED', sessions: new Set(Array.from(sessionSignals.entries()).filter(([, signal]) => signal.tryOnCompletions > 0).map(([id]) => id)).size, available: true },
      { stage: 'HIGH_INTENT', sessions: metrics.highIntentSessions, available: true },
      { stage: 'MERCHANT_CTA', sessions: null, available: false },
    ],
    topFrames,
    intent: {
      tryOnStarts: metrics.tryOnStarts,
      tryOnCompletions: metrics.tryOnCompletions,
      framesTried: metrics.framesTried,
      uniqueFramesTried: metrics.uniqueFramesTried,
      favorites: metrics.favorites,
      compares: metrics.compares,
      merchantCtaClicks: null,
      highIntentSessions: metrics.highIntentSessions,
      identifiedSessions: null,
      identifiedIntentAvailable: false,
    },
    sessionSignals: publicSignals,
  }
}

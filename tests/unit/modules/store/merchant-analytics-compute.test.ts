import {
  computeExperienceAnalytics,
  MerchantAnalyticsError,
  resolveAnalyticsPeriod,
} from '@/modules/store/application/merchant-analytics-compute'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { highIntentScore, isHighIntentSession } from '@/modules/store/domain/merchant-analytics'

const sessionIds = ['session-1', 'session-2']
const events = [
  { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_frame_selected', count: 1 },
  { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
  { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 1 },
  { merchantSessionId: 'session-1', merchantFrameId: 'frame-2', type: 'merchant_tryon_completed', count: 1 },
  { merchantSessionId: 'session-1', merchantFrameId: null, type: 'merchant_compare_started', count: 1 },
  { merchantSessionId: 'session-2', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
]
const intents = [
  { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'FAVORITE', count: 1 },
  { merchantSessionId: 'session-2', merchantFrameId: 'frame-1', type: 'PRODUCT_CLICK', count: 1 },
]
const frames = [
  { id: 'frame-1', sku: 'F1', name: 'Frame One', imageUrl: 'https://cdn.test/f1.jpg' },
  { id: 'frame-2', sku: 'F2', name: 'Frame Two', imageUrl: null },
]

describe('canonical C1 analytics compute', () => {
  it('uses inclusive-exclusive UTC range defaults and rejects inverted/overlong ranges', () => {
    const period = resolveAnalyticsPeriod({ from: '2026-08-01T00:00:00.000Z', to: '2026-08-08T00:00:00.000Z' })
    expect(period.from.toISOString()).toBe('2026-08-01T00:00:00.000Z')
    expect(period.to.toISOString()).toBe('2026-08-08T00:00:00.000Z')
    expect(() => resolveAnalyticsPeriod({ from: '2026-08-08', to: '2026-08-01' })).toThrow(MerchantAnalyticsError)
    expect(() => resolveAnalyticsPeriod({ from: '2024-01-01', to: '2026-01-01' })).toThrow(MerchantAnalyticsError)
  })

  it('computes visit/engagement/high-intent metrics without identity or CTA', () => {
    const result = computeExperienceAnalytics({ sessionIds, events, intents, frames })
    expect(result.metrics).toMatchObject({
      visits: 2,
      engagedSessions: 2,
      engagementRate: 1,
      tryOnStarts: 2,
      tryOnCompletions: 2,
      tryOnCompletionRate: 1,
      framesTried: 2,
      uniqueFramesTried: 2,
      favorites: 1,
      compares: 1,
      merchantCtaClicks: null,
      highIntentSessions: 1,
      highIntentRate: 0.5,
    })
    expect(result.funnelStages.find((stage) => stage.stage === 'MERCHANT_CTA')).toEqual({
      stage: 'MERCHANT_CTA',
      sessions: null,
      available: false,
    })
    expect(result.intent.identifiedIntentAvailable).toBe(false)
    expect(result.intent.identifiedSessions).toBeNull()
  })

  it('returns zero counts and null rates for empty periods', () => {
    const result = computeExperienceAnalytics({ sessionIds: [], events: [], intents: [], frames: [] })
    expect(result.metrics).toMatchObject({
      visits: 0,
      engagedSessions: 0,
      engagementRate: null,
      tryOnCompletionRate: null,
      highIntentRate: null,
      favorites: 0,
    })
  })

  it('treats unique frames as a set and counts product/inquiry as product interactions', () => {
    const result = computeExperienceAnalytics({
      sessionIds: ['session-dup'],
      events: [
        { merchantSessionId: 'session-dup', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 2 },
      ],
      intents: [
        { merchantSessionId: 'session-dup', merchantFrameId: 'frame-1', type: 'PRODUCT_CLICK', count: 1 },
      ],
      frames,
      includeTopFrames: false,
    })
    expect(result.metrics.uniqueFramesTried).toBe(1)
    expect(result.metrics.framesTried).toBe(2)
    expect(result.sessionSignals.get('session-dup')?.productInteractions).toBe(1)
    expect(result.sessionSignals.get('session-dup')?.uniqueFramesTried).toBe(1)
  })

  it('rejects top-frame catalog rows that are not tenant-owned', () => {
    expect(() => computeExperienceAnalytics({
      sessionIds: ['session-1'],
      events: [{ merchantSessionId: 'session-1', merchantFrameId: 'frame-b', type: 'merchant_tryon_completed', count: 1 }],
      intents: [],
      frames: [],
    })).toThrow(MerchantAccessError)
  })

  it('does not treat recommendation-only sessions as C1 engagement', () => {
    const result = computeExperienceAnalytics({
      sessionIds: ['session-rec'],
      events: [
        { merchantSessionId: 'session-rec', merchantFrameId: 'frame-1', type: 'merchant_recommendation_completed', count: 1 },
      ],
      intents: [],
      includeTopFrames: false,
    })
    expect(result.metrics.visits).toBe(1)
    expect(result.metrics.engagedSessions).toBe(0)
    expect(result.metrics.engagementRate).toBe(0)
  })

  it('ignores events and intents that are not in the tenant-scoped session set', () => {
    const result = computeExperienceAnalytics({
      sessionIds: ['session-1'],
      events: [
        { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
        { merchantSessionId: 'other-tenant', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 9 },
      ],
      intents: [
        { merchantSessionId: 'other-tenant', merchantFrameId: 'frame-1', type: 'FAVORITE', count: 4 },
      ],
      includeTopFrames: false,
    })
    expect(result.metrics.visits).toBe(1)
    expect(result.metrics.tryOnCompletions).toBe(0)
    expect(result.metrics.favorites).toBe(0)
  })

  it('scores observed behavior without identity weight', () => {
    const signals = { tryOnStarts: 0, tryOnCompletions: 1, uniqueFramesTried: 1, favorites: 0, compares: 0, frameInteractions: 0, productInteractions: 0 }
    expect(highIntentScore(signals)).toBe(3)
    expect(isHighIntentSession({ ...signals, favorites: 1 })).toBe(true)
  })
})

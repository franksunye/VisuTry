import { computeExperienceAnalytics } from '@/modules/store/application/merchant-analytics-compute'
import {
  adminActivitySignals,
  adminPerformanceCards,
  formatC1Percent,
  formatC1PeriodCaption,
} from '@/app/(admin)/admin/store/merchants/[id]/merchant-insights-view'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'

const emptyOperational: MerchantInsightsDto['metrics'] = {
  sessions: 0,
  tryOnSessions: 0,
  photosUploaded: 0,
  recommendations: 0,
  tryOns: 0,
  tryOnFailures: 0,
  compareStarts: 0,
  favorites: 0,
  productClicks: 0,
  inquiries: 0,
}

describe('Admin merchant insights view semantics', () => {
  it('formats canonical C1 rates as percentages and empty rates as em dash', () => {
    expect(formatC1Percent(0.5)).toBe('50%')
    expect(formatC1Percent(0)).toBe('0%')
    expect(formatC1Percent(null)).toBe('—')
  })

  it('states the default UTC 30-day C1 period', () => {
    expect(formatC1PeriodCaption({
      from: '2026-07-28T00:00:00.000Z',
      to: '2026-08-27T00:00:00.000Z',
      timezone: 'UTC',
    })).toBe('Last 30 days · UTC · Jul 28, 2026 – Aug 26, 2026')
  })

  it('maps Performance snapshot cards from C1 metrics without local formulas', () => {
    const computed = computeExperienceAnalytics({
      sessionIds: ['session-1'],
      events: [
        { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
        { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 1 },
      ],
      intents: [{ merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'FAVORITE', count: 1 }],
      includeTopFrames: false,
    })
    const cards = adminPerformanceCards(computed.metrics)
    expect(cards.map((card) => card.key)).toEqual(['visits', 'engagement', 'tryOnCompletion', 'highIntent'])
    expect(cards.find((card) => card.key === 'visits')?.value).toBe('1')
    expect(cards.find((card) => card.key === 'engagement')?.value).toBe(formatC1Percent(computed.metrics.engagementRate))
    expect(cards.find((card) => card.key === 'tryOnCompletion')?.value).toBe(formatC1Percent(computed.metrics.tryOnCompletionRate))
    expect(cards.find((card) => card.key === 'highIntent')?.value).toBe(formatC1Percent(computed.metrics.highIntentRate))
  })

  it('does not present recommendation-only C1 traffic as engagement', () => {
    const computed = computeExperienceAnalytics({
      sessionIds: ['session-rec'],
      events: [{ merchantSessionId: 'session-rec', merchantFrameId: 'frame-1', type: 'merchant_recommendation_completed', count: 8 }],
      intents: [],
      includeTopFrames: false,
    })
    const cards = adminPerformanceCards(computed.metrics)
    expect(computed.metrics.engagedSessions).toBe(0)
    expect(cards.find((card) => card.key === 'engagement')?.value).toBe('0%')
    expect(adminActivitySignals({ ...emptyOperational, sessions: 1, recommendations: 8 }).find((row) => row.label === 'Recommendation')?.value).toBe(8)
  })

  it('does not turn repeated Try-On events in one session into a session percentage', () => {
    const computed = computeExperienceAnalytics({
      sessionIds: ['session-1'],
      events: [
        { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
        { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 5 },
      ],
      intents: [],
      includeTopFrames: false,
    })
    const cards = adminPerformanceCards(computed.metrics)
    const actions = adminActivitySignals({ ...emptyOperational, sessions: 1, tryOns: 5 })
    expect(computed.metrics.visits).toBe(1)
    expect(cards.find((card) => card.key === 'visits')?.value).toBe('1')
    expect(actions.find((row) => row.label === 'Try-On')?.value).toBe(5)
    expect(JSON.stringify(actions)).not.toMatch(/% of sessions/)
    expect(Object.keys(actions[0])).toEqual(['label', 'value'])
  })

  it('renders empty C1 rates as em dash and operational counts as zero', () => {
    const computed = computeExperienceAnalytics({ sessionIds: [], events: [], intents: [], includeTopFrames: false })
    const cards = adminPerformanceCards(computed.metrics)
    expect(cards.find((card) => card.key === 'visits')?.value).toBe('0')
    expect(cards.find((card) => card.key === 'engagement')?.value).toBe('—')
    expect(cards.find((card) => card.key === 'tryOnCompletion')?.value).toBe('—')
    expect(cards.find((card) => card.key === 'highIntent')?.value).toBe('—')
    expect(adminActivitySignals(emptyOperational).every((row) => row.value === 0)).toBe(true)
  })
})

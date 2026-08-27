import { buildMerchantCommerceIntelligence } from '@/modules/merchant/application/merchant-commerce-intelligence'

describe('merchant commerce intelligence overview', () => {
  it('builds merchant overview totals from the same C1 compute as Experience analytics', () => {
    const activity = {
      experiences: [
        { id: 'store-a', type: 'STORE' as const, name: 'Store A', status: 'ACTIVE', referenceData: false },
        { id: 'campaign-a', type: 'CAMPAIGN' as const, name: 'Campaign A', status: 'ACTIVE', referenceData: true },
      ],
      sessions: [
        { id: 'session-1', experienceId: 'store-a', source: 'direct', medium: null, referrer: null, aiAgentSource: null },
        { id: 'session-2', experienceId: 'campaign-a', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt' },
      ],
      events: [
        { merchantSessionId: 'session-1', experienceId: 'store-a', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', count: 1 },
        { merchantSessionId: 'session-1', experienceId: 'store-a', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 1 },
        { merchantSessionId: 'session-1', experienceId: 'store-a', merchantFrameId: 'frame-1', type: 'merchant_recommendation_completed', count: 1 },
      ],
      intents: [
        { merchantSessionId: 'session-1', experienceId: 'store-a', merchantFrameId: 'frame-1', type: 'FAVORITE', count: 1 },
        { merchantSessionId: 'session-2', experienceId: 'campaign-a', merchantFrameId: null, type: 'PRODUCT_CLICK', count: 1 },
      ],
    }
    const result = buildMerchantCommerceIntelligence({
      current: activity,
      previous: { ...activity, sessions: [], events: [], intents: [] },
      currentPeriod: { from: new Date('2026-07-28T00:00:00.000Z'), to: new Date('2026-08-27T00:00:00.000Z') },
      previousPeriod: { from: new Date('2026-06-28T00:00:00.000Z'), to: new Date('2026-07-28T00:00:00.000Z') },
    })

    expect(result.totals.visitors).toBe(2)
    expect(result.totals.engagedShoppers).toBe(2)
    expect(result.totals.tryOnCompletions).toBe(1)
    expect(result.totals.highIntentShoppers).toBe(1)
    expect(result.totals.recommendationActivity).toBe(1)
    expect(result.totals.productClicks).toBe(1)
    expect(result.experiences.find((experience) => experience.id === 'store-a')?.visitors).toBe(1)
    expect(result.experiences.find((experience) => experience.id === 'campaign-a')?.visitors).toBe(1)
    expect(result.period.timezone).toBe('UTC')
    expect(result.experiences.find((experience) => experience.id === 'store-a')?.recommendationActivity).toBe(1)
    expect(JSON.stringify(result)).not.toContain('email')
  })

  it('keeps recommendation overlay counts off the C1 engagement numerator', () => {
    const activity = {
      experiences: [{ id: 'store-a', type: 'STORE' as const, name: 'Store A', status: 'ACTIVE', referenceData: false }],
      sessions: [{ id: 'session-rec', experienceId: 'store-a', source: 'direct', medium: null, referrer: null, aiAgentSource: null }],
      events: [{ merchantSessionId: 'session-rec', experienceId: 'store-a', merchantFrameId: 'frame-1', type: 'merchant_recommendation_completed', count: 1 }],
      intents: [],
    }
    const result = buildMerchantCommerceIntelligence({
      current: activity,
      previous: { ...activity, sessions: [], events: [], intents: [] },
      currentPeriod: { from: new Date('2026-07-28T00:00:00.000Z'), to: new Date('2026-08-27T00:00:00.000Z') },
      previousPeriod: { from: new Date('2026-06-28T00:00:00.000Z'), to: new Date('2026-07-28T00:00:00.000Z') },
    })
    expect(result.totals.visitors).toBe(1)
    expect(result.totals.engagedShoppers).toBe(0)
    expect(result.totals.recommendationActivity).toBe(1)
    expect(result.rates.engagement).toBe(0)
  })

  it('returns a zero-data overview without inventing rates', () => {
    const empty = {
      experiences: [{ id: 'store-a', type: 'STORE' as const, name: 'Store A', status: 'ACTIVE', referenceData: false }],
      sessions: [],
      events: [],
      intents: [],
    }
    const result = buildMerchantCommerceIntelligence({
      current: empty,
      previous: empty,
      currentPeriod: { from: new Date('2026-07-28T00:00:00.000Z'), to: new Date('2026-08-27T00:00:00.000Z') },
      previousPeriod: { from: new Date('2026-06-28T00:00:00.000Z'), to: new Date('2026-07-28T00:00:00.000Z') },
    })
    expect(result.hasActivity).toBe(false)
    expect(result.totals.visitors).toBe(0)
    expect(result.rates.engagement).toBeNull()
    expect(result.interpretation.nextAction).toContain('Ask Agent')
  })
})

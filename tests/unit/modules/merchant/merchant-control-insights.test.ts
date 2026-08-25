import {
  buildMerchantCommerceComparison,
  buildMerchantCommerceInterpretation,
  buildMerchantExperiencePerformance,
  buildMerchantSourceHighlights,
} from '@/modules/merchant/domain/merchant-control-insights'

const zeroMetrics = { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }

describe('merchant control insight summaries', () => {
  it('does not invent a percentage when the previous period had no activity', () => {
    const result = buildMerchantCommerceComparison({
      current: { ...zeroMetrics, visitors: 3 },
      previous: zeroMetrics,
      previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' },
    })
    expect(result.reliable).toBe(false)
    expect(result.deltas.visitors).toBeNull()
  })

  it('marks a comparison reliable only when both periods have enough visitors', () => {
    const result = buildMerchantCommerceComparison({
      current: { ...zeroMetrics, visitors: 2 },
      previous: { ...zeroMetrics, visitors: 2 },
      previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' },
    })
    expect(result.reliable).toBe(true)
    expect(result.deltas.visitors).toBe(0)
  })

  it('withholds experience winners from low-volume data', () => {
    const result = buildMerchantExperiencePerformance([
      { id: 'store', type: 'STORE', name: 'Store', visitors: 1, engagedShoppers: 1, tryOnCompletions: 1, productClicks: 0, highIntentShoppers: 0 },
      { id: 'campaign', type: 'CAMPAIGN', name: 'Campaign', visitors: 1, engagedShoppers: 0, tryOnCompletions: 0, productClicks: 0, highIntentShoppers: 0 },
    ])
    expect(result.reliable).toBe(false)
    expect(result.topExperienceId).toBeNull()
  })

  it('returns deterministic leaders and metric-specific interpretation', () => {
    const experiences = buildMerchantExperiencePerformance([
      { id: 'store', type: 'STORE', name: 'Store', visitors: 4, engagedShoppers: 2, tryOnCompletions: 1, productClicks: 0, highIntentShoppers: 0 },
      { id: 'campaign', type: 'CAMPAIGN', name: 'Campaign', visitors: 4, engagedShoppers: 2, tryOnCompletions: 2, productClicks: 1, highIntentShoppers: 1 },
    ])
    const sources = buildMerchantSourceHighlights([
      { source: 'ChatGPT', visitors: 4, productClicks: 1, inquiries: 0, highIntentShoppers: 1 },
      { source: 'Organic search', visitors: 2, productClicks: 0, inquiries: 0, highIntentShoppers: 0 },
    ])
    const interpretation = buildMerchantCommerceInterpretation({
      current: { ...zeroMetrics, visitors: 8 },
      comparison: { previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' }, previous: { ...zeroMetrics, visitors: 4 }, deltas: { ...zeroMetrics, visitors: 100 }, reliable: true },
      experiences,
      sources,
      experienceNames: new Map([['campaign', 'Campaign']]),
    })
    expect(experiences.topExperienceId).toBe('campaign')
    expect(experiences.topMetric).toBe('highIntentShoppers')
    expect(sources.topVisitors).toBe('ChatGPT')
    expect(interpretation.evidence).toContain('Campaign led the observed high-intent shopper signal in this window.')
  })
})

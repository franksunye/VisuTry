import {
  buildMerchantDistributionReport,
  classifyMerchantDistributionSource,
} from '@/modules/store/domain/merchant-distribution-report'

describe('merchant distribution report', () => {
  it('classifies supported source classes without promoting unknown referrals to AI', () => {
    expect(classifyMerchantDistributionSource({ id: '1', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt' })).toBe('chatgpt')
    expect(classifyMerchantDistributionSource({ id: '2', source: 'google.com', medium: 'organic', referrer: null, aiAgentSource: null })).toBe('organic_search')
    expect(classifyMerchantDistributionSource({ id: '3', source: 'meta', medium: 'paid_social', referrer: null, aiAgentSource: null })).toBe('paid')
    expect(classifyMerchantDistributionSource({ id: '4', source: 'instagram.com', medium: 'social', referrer: null, aiAgentSource: null })).toBe('social')
    expect(classifyMerchantDistributionSource({ id: '5', source: null, medium: 'referral', referrer: 'https://example.com', aiAgentSource: null })).toBe('generic_referral')
    expect(classifyMerchantDistributionSource({ id: '6', source: null, medium: null, referrer: null, aiAgentSource: null })).toBe('direct')
  })

  it('joins durable source classes to Store/Campaign decision actions by session', () => {
    const report = buildMerchantDistributionReport({
      sessions: [
        { id: 'chat-session', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt' },
        { id: 'search-session', source: 'google.com', medium: 'organic', referrer: null, aiAgentSource: null },
        { id: 'direct-session', source: null, medium: null, referrer: null, aiAgentSource: null },
      ],
      events: [
        { merchantSessionId: 'chat-session', merchantFrameId: 'frame-1', type: 'merchant_recommendation_completed', count: 1 },
        { merchantSessionId: 'chat-session', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', count: 1 },
        { merchantSessionId: 'search-session', merchantFrameId: 'frame-2', type: 'merchant_compare_started', count: 2 },
      ],
      intents: [
        { merchantSessionId: 'chat-session', type: 'PRODUCT_CLICK', count: 1 },
        { merchantSessionId: 'direct-session', type: 'INQUIRY', count: 1 },
      ],
    })

    expect(report.scope).toBe('MERCHANT_STORE_CAMPAIGN_SESSIONS')
    expect(report.consumerEventBoundary).toMatch(/GA4\/dataLayer/)
    expect(report.sources).toEqual([
      expect.objectContaining({ sourceClass: 'chatgpt', visitors: 1, engagedShoppers: 1, recommendationActivity: 1, tryOnCompletions: 1, productClicks: 1, highIntentShoppers: 0 }),
      expect.objectContaining({ sourceClass: 'direct', visitors: 1, engagedShoppers: 0, inquiries: 1 }),
      expect.objectContaining({ sourceClass: 'organic_search', visitors: 1, engagedShoppers: 1, compareActivity: 2, highIntentShoppers: 1 }),
    ])
  })
})

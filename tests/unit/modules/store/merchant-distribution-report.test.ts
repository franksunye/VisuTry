import {
  buildMerchantDistributionReport,
  classifyMerchantDistributionSource,
  classifyMerchantDistributionSession,
} from '@/modules/store/domain/merchant-distribution-report'

describe('merchant distribution report', () => {
  it('classifies supported source classes without promoting unknown referrals to AI', () => {
    expect(classifyMerchantDistributionSource({ id: '1', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt' })).toBe('chatgpt')
    expect(classifyMerchantDistributionSource({ id: '2', source: 'google.com', medium: 'organic', referrer: null, aiAgentSource: null })).toBe('organic_search')
    expect(classifyMerchantDistributionSource({ id: '3', source: 'meta', medium: 'paid_social', referrer: null, aiAgentSource: null })).toBe('paid')
    expect(classifyMerchantDistributionSource({ id: '4', source: 'instagram.com', medium: 'social', referrer: null, aiAgentSource: null })).toBe('social')
    expect(classifyMerchantDistributionSource({ id: '5', source: null, medium: 'referral', referrer: 'https://example.com', aiAgentSource: null })).toBe('generic_referral')
    expect(classifyMerchantDistributionSource({ id: '6', source: null, medium: null, referrer: null, aiAgentSource: null })).toBe('direct')
    expect(classifyMerchantDistributionSource({ id: '7', source: 'reddit.com', medium: 'social', referrer: null, aiAgentSource: null })).toBe('reddit')
    expect(classifyMerchantDistributionSource({ id: '8', source: null, medium: 'referral', referrer: 'https://www.youtube.com/watch?v=1', aiAgentSource: null })).toBe('youtube')
  })

  it('classifies VisuTry internal discovery separately from external referrals', () => {
    expect(classifyMerchantDistributionSource({ id: 'internal', source: 'visutry', medium: 'internal', acquisitionSurface: 'discover', referrer: null, aiAgentSource: 'chatgpt' })).toBe('internal')
    expect(classifyMerchantDistributionSession({ id: 'internal', source: 'visutry', medium: 'internal', acquisitionSurface: 'discover', referrer: null, aiAgentSource: null, merchantClassification: 'REAL', merchantPilotType: 'LIVE', referenceData: false, merchantReferenceData: false, experienceId: 'experience-1', experienceType: 'STORE' })).toBe('INTERNAL')
    expect(classifyMerchantDistributionSession({ id: 'chatgpt', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt', merchantClassification: 'REAL', merchantPilotType: 'LIVE', referenceData: false, merchantReferenceData: false, experienceId: 'experience-1', experienceType: 'STORE' })).toBe('QUALIFYING')
    expect(classifyMerchantDistributionSession({ id: 'search', source: 'google.com', medium: 'organic', referrer: null, aiAgentSource: null, merchantClassification: 'REAL', merchantPilotType: 'LIVE', referenceData: false, merchantReferenceData: false, experienceId: 'experience-1', experienceType: 'STORE' })).toBe('QUALIFYING')
    expect(classifyMerchantDistributionSession({ id: 'test', source: 'test', medium: 'test', referrer: null, aiAgentSource: null, merchantClassification: 'TEST', experienceId: 'experience-1', experienceType: 'STORE' })).toBe('TEST_OR_AUTOMATION')
    expect(classifyMerchantDistributionSession({ id: 'automation', source: 'test', medium: 'automation', referrer: null, aiAgentSource: null, merchantClassification: 'AUTOMATION', experienceId: 'experience-1', experienceType: 'STORE' })).toBe('TEST_OR_AUTOMATION')
    expect(classifyMerchantDistributionSession({ id: 'internal-merchant', source: 'visutry', medium: 'internal', referrer: null, aiAgentSource: null, merchantClassification: 'INTERNAL', merchantPilotType: 'INTERNAL', experienceId: 'experience-1', experienceType: 'STORE' })).toBe('REFERENCE_OR_INTERNAL')
    expect(classifyMerchantDistributionSession({ id: 'reference', source: null, medium: null, referrer: null, aiAgentSource: null, merchantClassification: 'REFERENCE', merchantReferenceData: true, experienceId: 'experience-1', experienceType: 'CAMPAIGN' })).toBe('REFERENCE_OR_INTERNAL')
    expect(classifyMerchantDistributionSession({ id: 'suspicious', source: null, medium: null, referrer: null, aiAgentSource: null, merchantClassification: 'SUSPICIOUS', experienceId: 'experience-1', experienceType: 'STORE' })).toBe('SUSPICIOUS')
  })

  it('retains internal discovery in QA reporting without counting it as external visitors', () => {
    const report = buildMerchantDistributionReport({
      sessions: [
        { id: 'internal', source: 'visutry', medium: 'internal', acquisitionSurface: 'discover', referrer: null, aiAgentSource: null, experienceId: 'experience-1', experienceType: 'STORE' },
        { id: 'chatgpt', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt', experienceId: 'experience-1', experienceType: 'STORE' },
        { id: 'search', source: 'google.com', medium: 'organic', referrer: null, aiAgentSource: null, experienceId: 'experience-1', experienceType: 'STORE' },
      ],
      events: [],
      intents: [],
    })

    expect(report.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceClass: 'internal', visitors: 1 }),
      expect.objectContaining({ sourceClass: 'chatgpt', visitors: 1 }),
      expect.objectContaining({ sourceClass: 'organic_search', visitors: 1 }),
    ]))
  })

  it('joins durable source classes to Store/Campaign decision actions by session', () => {
    const report = buildMerchantDistributionReport({
      sessions: [
        { id: 'chat-session', source: null, medium: null, referrer: null, aiAgentSource: 'chatgpt', experienceId: 'experience-campaign', merchantSlug: 'merchant-a', merchantName: 'Merchant A', experienceType: 'CAMPAIGN', experienceSlug: 'edit', experienceName: 'Focused Edit' },
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
    expect(report.experiences).toEqual([
      expect.objectContaining({
        experienceId: 'experience-campaign',
        merchantSlug: 'merchant-a',
        experienceType: 'CAMPAIGN',
        experienceSlug: 'edit',
        visitors: 1,
        recommendationActivity: 1,
        tryOnCompletions: 1,
        productClicks: 1,
      }),
    ])
  })
})

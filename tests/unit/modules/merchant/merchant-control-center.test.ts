import { getMerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { findMany: jest.fn(), count: jest.fn() },
    merchantSession: { count: jest.fn() },
    merchantAgentCredential: { count: jest.fn() },
    merchantFrame: { findMany: jest.fn(), count: jest.fn() },
    merchantUsageLedger: { count: jest.fn() },
    merchantOperationAudit: { findMany: jest.fn() },
  },
}))

jest.mock('@/modules/merchant/application/merchant-commerce-intelligence', () => ({
  getMerchantCommerceIntelligence: jest.fn(async () => ({
    period: { from: '2026-07-28T00:00:00.000Z', to: '2026-08-27T00:00:00.000Z', timezone: 'UTC' },
    hasActivity: true,
    totals: { visitors: 2, engagedShoppers: 1, recommendationActivity: 0, tryOnCompletions: 1, compareActivity: 0, productClicks: 0, highIntentShoppers: 1 },
    rates: { engagement: 50, recommendation: null, tryOn: 50, compare: null },
    comparison: { previousPeriod: { from: '2026-06-28T00:00:00.000Z', to: '2026-07-28T00:00:00.000Z', timezone: 'UTC' }, previous: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }, deltas: { visitors: null, engagedShoppers: null, recommendationActivity: null, tryOnCompletions: null, compareActivity: null, productClicks: null, highIntentShoppers: null }, reliable: false },
    experiencePerformance: { reliable: false, ranked: [], topExperienceId: null, topMetric: null, needsAttentionExperienceId: null },
    sourceHighlights: { topVisitors: null, topDownstreamIntent: null, topHighIntent: null, reliable: false },
    interpretation: { summary: 'Review the observed shopper signals below.', evidence: [], nextAction: 'Ask Agent to compare these Experiences' },
    acquisitionSources: [],
    experiences: [],
  })),
}))

const db = prisma as unknown as {
  merchant: { findUnique: jest.Mock }
  experience: { findMany: jest.Mock; count: jest.Mock }
  merchantSession: { count: jest.Mock }
  merchantAgentCredential: { count: jest.Mock }
  merchantFrame: { findMany: jest.Mock; count: jest.Mock }
  merchantUsageLedger: { count: jest.Mock }
  merchantOperationAudit: { findMany: jest.Mock }
}

describe('merchant control center read model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.merchant.findUnique.mockResolvedValue({ id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE', referenceData: false })
    db.experience.findMany.mockResolvedValue([
      { id: 'store-a', type: 'STORE', name: 'Alpha Store', slug: 'alpha', status: 'ACTIVE', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, campaignObjective: null, campaignGate: null, presentationMode: null, referenceData: false, updatedAt: new Date('2026-08-01'), frames: [{ merchantFrameId: 'frame-a', merchantFrame: { id: 'frame-a', sku: 'A-1', name: 'Frame A', brand: 'Alpha', imageUrl: 'https://example.com/a.jpg', shape: 'ROUND', widthClass: null, source: 'MANUAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED' } }] },
      { id: 'campaign-a', type: 'CAMPAIGN', name: 'Historical Campaign', slug: 'historical', status: 'ACTIVE', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, campaignObjective: null, campaignGate: null, presentationMode: null, referenceData: false, updatedAt: new Date('2026-08-02'), frames: [] },
    ])
    db.merchantSession.count.mockResolvedValue(2)
    db.merchantAgentCredential.count.mockResolvedValue(1)
    db.merchantFrame.findMany.mockResolvedValue([{ id: 'frame-a', sku: 'A-1', name: 'Frame A', brand: 'Alpha', imageUrl: 'https://example.com/a.jpg', shape: 'ROUND', widthClass: null, source: 'MANUAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED' }])
    db.experience.count.mockResolvedValue(1)
    db.merchantFrame.count.mockResolvedValue(1)
    db.merchantUsageLedger.count.mockResolvedValue(0)
    db.merchantOperationAudit.findMany.mockResolvedValue([])
  })

  it('returns bounded tenant-scoped status with resolved defaults', async () => {
    const result = await getMerchantControlCenter({ merchantId: 'merchant-a' })
    expect(result).toMatchObject({ merchant: { id: 'merchant-a' }, activeCampaignCount: 1, shopperActivityAvailable: true, credentialUsage: { active: 1 } })
    expect(result?.commerceIntelligence?.totals).toEqual({
      visitors: 2,
      engagedShoppers: 1,
      recommendationActivity: 0,
      tryOnCompletions: 1,
      compareActivity: 0,
      productClicks: 0,
      highIntentShoppers: 1,
    })
    expect(result?.store?.policy).toEqual({ objective: null, gate: null, presentation: 'PRODUCT_FIRST' })
    expect(result?.experiences.find((experience) => experience.type === 'CAMPAIGN')?.policy).toEqual({ objective: 'INTENT', gate: 'NONE', presentation: 'EDITORIAL_FIRST' })
    expect(result?.experiences.find((experience) => experience.type === 'CAMPAIGN')?.readiness).toMatchObject({
      status: 'INCOMPLETE',
      issues: expect.arrayContaining(['HEADLINE_REQUIRED', 'FRAMES_REQUIRED']),
    })
    expect(db.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a' } }))
    expect(JSON.stringify(result)).not.toContain('merchant-b')
  })

  it('returns no tenant data for an unknown merchant locator', async () => {
    db.merchant.findUnique.mockResolvedValue(null)
    await expect(getMerchantControlCenter({ merchantId: 'merchant-b' })).resolves.toBeNull()
    expect(db.experience.findMany).not.toHaveBeenCalled()
  })
})

import { getMerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { findMany: jest.fn() },
    merchantSession: { count: jest.fn() },
    merchantAgentCredential: { count: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    merchantOperationAudit: { findMany: jest.fn() },
  },
}))

const db = prisma as unknown as {
  merchant: { findUnique: jest.Mock }
  experience: { findMany: jest.Mock }
  merchantSession: { count: jest.Mock }
  merchantAgentCredential: { count: jest.Mock }
  merchantFrame: { findMany: jest.Mock }
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
    db.merchantOperationAudit.findMany.mockResolvedValue([])
  })

  it('returns bounded tenant-scoped status with resolved defaults', async () => {
    const result = await getMerchantControlCenter({ merchantId: 'merchant-a' })
    expect(result).toMatchObject({ merchant: { id: 'merchant-a' }, activeCampaignCount: 1, shopperActivityAvailable: true, credentialUsage: { active: 1 } })
    expect(result?.store?.policy).toEqual({ objective: null, gate: null, presentation: 'PRODUCT_FIRST' })
    expect(result?.experiences.find((experience) => experience.type === 'CAMPAIGN')?.policy).toEqual({ objective: 'INTENT', gate: 'NONE', presentation: 'EDITORIAL_FIRST' })
    expect(db.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a' } }))
    expect(JSON.stringify(result)).not.toContain('merchant-b')
  })

  it('returns no tenant data for an unknown merchant locator', async () => {
    db.merchant.findUnique.mockResolvedValue(null)
    await expect(getMerchantControlCenter({ merchantId: 'merchant-b' })).resolves.toBeNull()
    expect(db.experience.findMany).not.toHaveBeenCalled()
  })
})

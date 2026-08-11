import { getExperienceAdminWorkspace } from '@/modules/store/application/get-experience-admin'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { findMany: jest.fn() },
    merchantFrame: { count: jest.fn() },
    merchantSession: { groupBy: jest.fn() },
    merchantEvent: { groupBy: jest.fn() },
    merchantIntent: { groupBy: jest.fn() },
  },
}))

const db = prisma as unknown as {
  merchant: { findUnique: jest.Mock }
  experience: { findMany: jest.Mock }
  merchantFrame: { count: jest.Mock }
  merchantSession: { groupBy: jest.Mock }
  merchantEvent: { groupBy: jest.Mock }
  merchantIntent: { groupBy: jest.Mock }
}

describe('Merchant Experience admin analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.merchant.findUnique.mockResolvedValue({
      id: 'merchant-a',
      slug: 'ello-sunglasses',
      name: 'ello sunglasses',
      referenceData: true,
    })
    db.experience.findMany.mockResolvedValue([
      {
        id: 'store-a',
        merchantId: 'merchant-a',
        type: 'STORE',
        slug: 'default',
        name: 'ello Store',
        status: 'ACTIVE',
        startAt: null,
        endAt: null,
        referenceData: true,
        frames: Array.from({ length: 10 }, (_, index) => ({ merchantFrameId: `store-frame-${index}` })),
      },
      {
        id: 'campaign-a',
        merchantId: 'merchant-a',
        type: 'CAMPAIGN',
        slug: 'petite-fit',
        name: 'Petite Fit',
        status: 'ACTIVE',
        startAt: new Date('2026-08-01T00:00:00Z'),
        endAt: null,
        referenceData: true,
        frames: Array.from({ length: 4 }, (_, index) => ({ merchantFrameId: `campaign-a-frame-${index}` })),
      },
      {
        id: 'campaign-b',
        merchantId: 'merchant-a',
        type: 'CAMPAIGN',
        slug: 'summer-sunglasses',
        name: 'Summer Sunglasses',
        status: 'ACTIVE',
        startAt: null,
        endAt: null,
        referenceData: true,
        frames: Array.from({ length: 7 }, (_, index) => ({ merchantFrameId: `campaign-b-frame-${index}` })),
      },
    ])
    db.merchantFrame.count.mockResolvedValue(20)
    db.merchantSession.groupBy.mockResolvedValue([
      { experienceId: 'store-a', _count: { _all: 10 } },
      { experienceId: 'campaign-a', _count: { _all: 4 } },
      { experienceId: null, _count: { _all: 3 } },
    ])
    db.merchantEvent.groupBy.mockResolvedValue([
      { experienceId: 'campaign-a', type: 'merchant_recommendation_completed', _count: { _all: 3 } },
      { experienceId: 'campaign-a', type: 'merchant_tryon_completed', _count: { _all: 2 } },
      { experienceId: 'campaign-a', type: 'merchant_compare_started', _count: { _all: 1 } },
    ])
    db.merchantIntent.groupBy.mockResolvedValue([
      { experienceId: 'campaign-a', type: 'FAVORITE', _count: { _all: 2 } },
      { experienceId: 'campaign-a', type: 'PRODUCT_CLICK', _count: { _all: 1 } },
      { experienceId: null, type: 'INQUIRY', _count: { _all: 1 } },
    ])
  })

  it('keeps Store and Campaign rows separate while showing Legacy / Unassigned in All', async () => {
    const result = await getExperienceAdminWorkspace({ merchantId: 'merchant-a' })

    expect(result?.experiences.map((experience) => [experience.type, experience.slug])).toEqual([
      ['STORE', 'default'],
      ['CAMPAIGN', 'petite-fit'],
      ['CAMPAIGN', 'summer-sunglasses'],
    ])
    expect(result?.merchant.merchantCatalogFrameCount).toBe(20)
    expect(result?.experiences[0].catalogFrameCount).toBe(10)
    expect(result?.experiences[1].catalogFrameCount).toBe(4)
    expect(result?.experiences[2].catalogFrameCount).toBe(7)
    expect(result?.experiences[1].metrics).toEqual({
      sessions: 4,
      recommendations: 3,
      tryOns: 2,
      compareStarts: 1,
      favorites: 2,
      productClicks: 1,
      inquiries: 0,
    })
    expect(result?.legacy.metrics.sessions).toBe(3)
    expect(result?.legacy.metrics.inquiries).toBe(1)
    expect(db.merchantSession.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a' } }))
    expect(db.merchantFrame.count).toHaveBeenCalledWith({ where: { merchantId: 'merchant-a', status: 'ACTIVE' } })
  })

  it('applies Store/Campaign filters without changing tenant scope', async () => {
    await getExperienceAdminWorkspace({ merchantId: 'merchant-a', filter: 'CAMPAIGN' })

    expect(db.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchantId: 'merchant-a', type: 'CAMPAIGN' },
    }))
  })

  it('returns null for an unknown merchant', async () => {
    db.merchant.findUnique.mockResolvedValue(null)
    await expect(getExperienceAdminWorkspace({ merchantId: 'missing' })).resolves.toBeNull()
    expect(db.experience.findMany).not.toHaveBeenCalled()
  })
})

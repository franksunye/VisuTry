import { getMerchantInsights } from '@/modules/store/application/get-merchant-insights'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn() },
    merchantSession: { count: jest.fn(), findMany: jest.fn() },
    merchantEvent: { count: jest.fn(), findMany: jest.fn() },
    merchantIntent: { count: jest.fn(), findMany: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
  },
}))

const db = prisma as unknown as {
  experience: { findFirst: jest.Mock }
  merchantSession: { count: jest.Mock; findMany: jest.Mock }
  merchantEvent: { count: jest.Mock; findMany: jest.Mock }
  merchantIntent: { count: jest.Mock; findMany: jest.Mock }
  merchantFrame: { findMany: jest.Mock }
}

describe('Experience analytics scope', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.experience.findFirst.mockResolvedValue({ id: 'experience-1', referenceData: true })
    db.merchantSession.count.mockResolvedValue(0)
    db.merchantSession.findMany.mockResolvedValue([])
    db.merchantEvent.count.mockResolvedValue(0)
    db.merchantEvent.findMany.mockResolvedValue([])
    db.merchantIntent.count.mockResolvedValue(0)
    db.merchantIntent.findMany.mockResolvedValue([])
    db.merchantFrame.findMany.mockResolvedValue([])
  })

  it('filters sessions, events, intents, and catalog by one tenant-scoped experience', async () => {
    const result = await getMerchantInsights({
      merchants: {
        findById: jest.fn().mockResolvedValue({
          id: 'merchant-1',
          slug: 'ello-sunglasses',
          name: 'ello sunglasses',
          logoUrl: null,
          websiteUrl: null,
          contactEmail: null,
          accentColor: null,
          status: 'ACTIVE',
          referenceData: false,
          pilotType: 'LIVE',
          planCode: null,
          commercialStage: null,
          pricingVersion: null,
          entitlementVersion: null,
          commerceSessionAllowance: null,
          standardRenderAllowance: null,
          premiumRenderAllowance: null,
          campaignAllowance: null,
          entitlementEffectiveFrom: null,
          billingPeriodEnd: null,
          commercialExceptionCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findBySlug: jest.fn(),
        listAllAdmin: jest.fn(),
      },
      events: { appendIdempotent: jest.fn(), listByMerchant: jest.fn() },
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
    })

    expect(result.experienceId).toBe('experience-1')
    expect(db.merchantSession.count).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-1', experienceId: 'experience-1' },
    })
    expect(db.merchantEvent.count).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchantId: 'merchant-1', experienceId: 'experience-1', type: 'merchant_tryon_completed' },
    }))
    expect(db.merchantIntent.count).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchantId: 'merchant-1', experienceId: 'experience-1', type: 'FAVORITE' },
    }))
    expect(db.merchantFrame.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        merchantId: 'merchant-1',
        experienceFrames: { some: { experienceId: 'experience-1', active: true } },
      },
    }))
  })
})

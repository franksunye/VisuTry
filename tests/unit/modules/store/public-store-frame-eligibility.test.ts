jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantFrame: { findMany: jest.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { createPrismaMerchantFrameRepository } from '@/modules/store/infrastructure/prisma/frame-repository'
import type { ExperienceRecord } from '@/modules/store/application'

const now = new Date('2026-08-27T00:00:00.000Z')

function experience(type: 'STORE' | 'CAMPAIGN'): ExperienceRecord {
  return {
    id: 'experience-a', merchantId: 'merchant-a', type, slug: 'store', name: 'Store', status: 'ACTIVE',
    headline: null, description: null, heroAssetUrl: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
    secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, offerLabel: null, offerCode: null, offerTerms: null,
    startAt: null, endAt: null, referenceData: false, defaultSource: null, defaultCampaign: null, referenceMetadata: null,
    frameIds: ['frame-valid', 'frame-pending', 'frame-invalid'], createdAt: now, updatedAt: now,
  }
}

function frame(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, merchantId: 'merchant-a', sku: null, externalId: `external-${id}`, name: `Frame ${id}`,
    brand: null, imageUrl: 'https://cdn.example.test/frame.jpg', productUrl: `https://shop.example.test/${id}`,
    price: null, currency: 'usd', shape: 'round', material: null, color: null, widthClass: null,
    updatedAt: now, source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED', ...overrides,
  }
}

describe('public Store frame eligibility', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows importable shape-pending products in Store while excluding unsafe products', async () => {
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([
      frame('frame-valid'),
      frame('frame-pending', { shape: '', enrichmentStatus: 'PENDING' }),
      frame('frame-invalid', { imageUrl: null }),
    ])

    const repository = createPrismaMerchantFrameRepository()
    const result = await repository.findPublicActiveByMerchantAndExperience!('merchant-a', experience('STORE'))

    expect(result.map((item) => item.id)).toEqual(['frame-valid', 'frame-pending'])
    expect(result.find((item) => item.id === 'frame-pending')).toMatchObject({ name: 'Frame frame-pending', imageUrl: 'https://cdn.example.test/frame.jpg' })
    expect(prisma.merchantFrame.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ merchantId: 'merchant-a', status: 'ACTIVE' }) }))
  })

  it('does not change Campaign public frame behavior', async () => {
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([
      frame('frame-pending', { shape: '', enrichmentStatus: 'PENDING' }),
      frame('frame-invalid', { imageUrl: null }),
    ])

    const repository = createPrismaMerchantFrameRepository()
    const result = await repository.findPublicActiveByMerchantAndExperience!('merchant-a', experience('CAMPAIGN'))

    expect(result.map((item) => item.id)).toEqual(['frame-pending', 'frame-invalid'])
  })
})

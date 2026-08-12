jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { CampaignServiceError, createCampaignDraft, publishCampaign, setCampaignFrames, updateCampaign } from '@/modules/store/application/campaign-service'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'

const baseRow = {
  id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN' as const, slug: 'small-faces', name: 'Small Faces', status: 'DRAFT' as const,
  headline: 'Small face collection', description: null, heroAssetUrl: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
  secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, offerLabel: null, offerCode: null, offerTerms: null,
  startAt: null, endAt: null, campaignObjective: 'INTENT' as const, campaignGate: 'NONE' as const, presentationMode: 'EDITORIAL_FIRST' as const,
  referenceData: false, defaultSource: null, defaultCampaign: null, referenceMetadata: null, createdAt: new Date(), updatedAt: new Date(),
  frames: [{ merchantFrameId: 'frame-a', merchantFrame: { status: 'ACTIVE' as const } }],
}

describe('Campaign application service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a draft with safe defaults', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.experience.create as jest.Mock).mockResolvedValue(baseRow)

    const result = await createCampaignDraft({ merchantId: 'merchant-a', name: 'Small Faces' })

    expect(result.status).toBe('DRAFT')
    expect(result.objective).toBe('INTENT')
    expect(result.gate).toBe('NONE')
    expect(result.presentationMode).toBe('EDITORIAL_FIRST')
    expect(prisma.experience.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'CAMPAIGN', status: 'DRAFT', campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST' }) }))
  })

  it('rejects invalid policy and date ranges', async () => {
    await expect(createCampaignDraft({ merchantId: 'merchant-a', name: 'Bad', objective: 'INVALID' as never })).rejects.toBeInstanceOf(CampaignServiceError)
    await expect(createCampaignDraft({ merchantId: 'merchant-a', name: 'Bad', startAt: '2026-01-02', endAt: '2026-01-01' })).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' })
  })

  it('updates only bounded policy fields and preserves tenant ownership', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.update as jest.Mock).mockResolvedValue({ ...baseRow, campaignObjective: 'LEAD', campaignGate: 'OPT_IN_AFTER_VALUE' })

    const result = await updateCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', objective: 'LEAD', gate: 'OPT_IN_AFTER_VALUE' })

    expect(result.objective).toBe('LEAD')
    expect(prisma.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN' } }))
  })

  it('denies cross-tenant campaign access and frame selection', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(updateCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-b', objective: 'INTENT' })).rejects.toBeInstanceOf(MerchantAccessError)
    await expect(setCampaignFrames({ merchantId: 'merchant-a', campaignId: 'campaign-b', frameIds: ['frame-b'] })).rejects.toBeInstanceOf(MerchantAccessError)
  })

  it('requires approval and readiness before publishing', async () => {
    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: false })).rejects.toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ ...baseRow, frames: [] })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_NOT_READY' })
  })
})

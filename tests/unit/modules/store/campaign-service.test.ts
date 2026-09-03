jest.mock('@/lib/prisma', () => ({
    prisma: {
      merchant: { findUnique: jest.fn() },
      experience: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    merchantFrame: { findMany: jest.fn(), count: jest.fn() },
      merchantUsageLedger: { count: jest.fn() },
      experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
  },
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { archiveCampaign, CampaignServiceError, createCampaignDraft, previewCampaign, publishCampaign, setCampaignFrames, updateCampaign } from '@/modules/store/application/campaign-service'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'

const baseRow = {
  id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN' as const, slug: 'small-faces', name: 'Small Faces', status: 'DRAFT' as const,
  headline: 'Small face collection', description: null, heroAssetUrl: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
  secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, offerLabel: null, offerCode: null, offerTerms: null,
  startAt: null, endAt: null, campaignObjective: 'INTENT' as const, campaignGate: 'NONE' as const, presentationMode: 'EDITORIAL_FIRST' as const,
  referenceData: false, defaultSource: null, defaultCampaign: null, referenceMetadata: null, createdAt: new Date(), updatedAt: new Date(),
  frames: [{ merchantFrameId: 'frame-a', merchantFrame: { id: 'frame-a', sku: null, externalId: 'shopify:product-1', productUrl: 'https://shop.example.test/products/frame-a', name: 'Frame A', imageUrl: 'https://cdn.example.test/frame-a.jpg', shape: 'round', widthClass: 'small', source: 'EXTERNAL' as const, enrichmentStatus: 'APPROVED' as const, status: 'ACTIVE' as const } }],
}

const activeLaunchPeriodStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
const activeLaunchPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)

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
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'small-faces' } }))
  })

  it('rejects invalid policy and date ranges', async () => {
    await expect(createCampaignDraft({ merchantId: 'merchant-a', name: 'Bad', objective: 'INVALID' as never })).rejects.toBeInstanceOf(CampaignServiceError)
    await expect(createCampaignDraft({ merchantId: 'merchant-a', name: 'Bad', startAt: '2026-01-02', endAt: '2026-01-01' })).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' })
  })

  it('returns a stable conflict when an idempotent slug request changes policy', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)

    await expect(createCampaignDraft({ merchantId: 'merchant-a', name: 'Small Faces', objective: 'LEAD' })).rejects.toMatchObject({ code: 'CAMPAIGN_SLUG_CONFLICT' })
  })

  it('updates only bounded policy fields and preserves tenant ownership', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.update as jest.Mock).mockResolvedValue({ ...baseRow, campaignObjective: 'LEAD', campaignGate: 'OPT_IN_AFTER_VALUE' })

    const result = await updateCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', objective: 'LEAD', gate: 'OPT_IN_AFTER_VALUE' })

    expect(result.objective).toBe('LEAD')
    expect(prisma.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN' } }))
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'small-faces' } }))
  })

  it('invalidates after a successful frame transaction and not after a failed write', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([baseRow.frames[0].merchantFrame])
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    }))

    await setCampaignFrames({ merchantId: 'merchant-a', campaignId: 'campaign-a', frameIds: ['frame-a'] })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'small-faces' } }))

    jest.clearAllMocks()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.update as jest.Mock).mockRejectedValue(new Error('write failed'))
    await expect(updateCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', objective: 'LEAD' })).rejects.toThrow('write failed')
    expect(prisma.experience.update).toHaveBeenCalled()
  })

  it('denies cross-tenant campaign access and frame selection', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(updateCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-b', objective: 'INTENT' })).rejects.toBeInstanceOf(MerchantAccessError)
    await expect(setCampaignFrames({ merchantId: 'merchant-a', campaignId: 'campaign-b', frameIds: ['frame-b'] })).rejects.toBeInstanceOf(MerchantAccessError)
  })

  it('rejects active but ineligible catalog frames', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([
      { id: 'frame-a', sku: 'SKU-A', name: 'Frame A', imageUrl: null, shape: 'round', widthClass: 'small', status: 'ACTIVE' },
    ])

    await expect(setCampaignFrames({ merchantId: 'merchant-a', campaignId: 'campaign-a', frameIds: ['frame-a'] })).rejects.toBeInstanceOf(MerchantAccessError)
  })

  it('keeps Campaign preview side-effect free', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })

    const result = await previewCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })

    expect(result.readiness.ready).toBe(true)
    expect(prisma.experience.update).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('accepts a stable external identity without a merchant SKU for Campaign readiness', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })

    const result = await previewCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })

    expect(result.readiness.ready).toBe(true)
    expect(result.readiness.blockingIssues).toEqual([])
  })

  it('requires approval and readiness before publishing', async () => {
    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: false })).rejects.toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ ...baseRow, frames: [] })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_NOT_READY' })
  })

  it('returns a structured limit decision instead of activating a second Launch Campaign', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    const merchant = { slug: 'merchant-a', referenceData: false, planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', entitlementEffectiveFrom: activeLaunchPeriodStart, billingPeriodEnd: activeLaunchPeriodEnd, createdAt: activeLaunchPeriodStart }
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      $queryRaw: jest.fn(),
      merchant: { findUnique: jest.fn().mockResolvedValue(merchant) },
      experience: { findFirst: jest.fn().mockResolvedValue(baseRow), count: jest.fn().mockResolvedValue(1), update: jest.fn() },
    }))

    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_LIMIT_REACHED', httpStatus: 409 })
    expect(prisma.experience.update).not.toHaveBeenCalled()
  })

  it('atomically limits concurrent Launch Campaign publishes to one ACTIVE Campaign', async () => {
    const merchant = { slug: 'merchant-a', referenceData: false, planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', entitlementEffectiveFrom: activeLaunchPeriodStart, billingPeriodEnd: activeLaunchPeriodEnd, createdAt: activeLaunchPeriodStart }
    const rows = new Map<string, any>([
      ['campaign-a', baseRow],
      ['campaign-b', { ...baseRow, id: 'campaign-b', slug: 'large-faces', name: 'Large Faces' }],
    ])
    const active = new Set<string>()
    let lockTail = Promise.resolve()
    ;(prisma.experience.findFirst as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const previous = lockTail
      let release!: () => void
      lockTail = new Promise<void>((resolve) => { release = resolve })
      await previous
      const tx = {
        $queryRaw: jest.fn(),
        merchant: { findUnique: jest.fn().mockResolvedValue(merchant) },
        experience: {
          findFirst: jest.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
          count: jest.fn(async () => active.size),
          update: jest.fn(async ({ where }: { where: { id: string } }) => {
            const row = rows.get(where.id)!
            active.add(where.id)
            const updated = { ...row, status: 'ACTIVE' as const }
            rows.set(where.id, updated)
            return updated
          }),
        },
      }
      try { return await callback(tx) } finally { release() }
    })

    const results = await Promise.allSettled([
      publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true }),
      publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-b', approved: true }),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const rejection = results.find((result) => result.status === 'rejected')
    expect(rejection).toMatchObject({ status: 'rejected', reason: expect.objectContaining({ code: 'CAMPAIGN_LIMIT_REACHED' }) })
    expect(active.size).toBe(1)
  })

  it('invalidates publish and archive transitions after the database write', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.update as jest.Mock).mockResolvedValue({ ...baseRow, status: 'ACTIVE' })
    await publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'small-faces' } }))

    jest.clearAllMocks()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(baseRow)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    ;(prisma.experience.update as jest.Mock).mockResolvedValue({ ...baseRow, status: 'ARCHIVED' })
    await archiveCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'small-faces' } }))
  })

  it('keeps archived Campaigns from being republished', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ ...baseRow, status: 'ARCHIVED' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a', referenceData: false })

    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_NOT_READY' })
  })
})

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { count: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
}))
jest.mock('@/modules/store/application/experience-command-service-prisma', () => ({
  experienceCommands: { updateSharedConfiguration: jest.fn() },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(({ mutation }: { mutation: () => unknown }) => mutation()),
}))
jest.mock('@/modules/store/application/public-edge-paths-server', () => ({
  getPublicEdgeTagsForMerchant: jest.fn().mockResolvedValue([]),
}))

import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { updateMerchantBrand, updateMerchantExperienceHero } from '@/modules/merchant/application/merchant-brand-kit'

const owner = { userId: 'owner-a', merchantId: 'merchant-a' }
const merchant = { id: owner.merchantId, slug: 'merchant-a', name: 'Merchant A', logoUrl: null, accentColor: null }
const tx = {
  $queryRaw: jest.fn(),
  experience: { count: jest.fn() },
  merchant: { update: jest.fn() },
}

describe('Brand Kit owner authorization and canonical persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ role: 'OWNER' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
    ;(prisma.experience.count as jest.Mock).mockResolvedValue(0)
    ;(tx.$queryRaw as jest.Mock).mockResolvedValue([{ id: merchant.id }])
    ;(tx.experience.count as jest.Mock).mockResolvedValue(0)
    ;(tx.merchant.update as jest.Mock).mockResolvedValue({ ...merchant, accentColor: '#1D4ED8' })
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx))
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'experience-a', type: 'STORE', status: 'DRAFT',
    })
    ;(experienceCommands.updateSharedConfiguration as jest.Mock).mockResolvedValue({ status: 'DRAFT' })
  })

  it('requires OWNER for merchant identity mutation', async () => {
    await updateMerchantBrand({ ...owner, accentColor: '#1D4ED8' })
    expect(requireMerchantMembership).toHaveBeenCalledWith({ ...owner, roles: ['OWNER'] })
    expect(tx.merchant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: merchant.id },
      data: { accentColor: '#1D4ED8' },
    }))
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'merchant', merchantSlug: merchant.slug },
    }))
  })

  it('fails closed and never mutates when identity owner permission is denied', async () => {
    ;(requireMerchantMembership as jest.Mock).mockRejectedValue(new Error('forbidden'))
    await expect(updateMerchantBrand({ ...owner, accentColor: '#1D4ED8', approvedLiveChange: true })).rejects.toThrow('forbidden')
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('requires approval when any Store/Campaign is already ACTIVE', async () => {
    ;(tx.experience.count as jest.Mock).mockResolvedValue(1)
    await expect(updateMerchantBrand({ ...owner, accentColor: '#1D4ED8' }))
      .rejects.toMatchObject({ code: 'LIVE_CHANGE_CONFIRMATION_REQUIRED', httpStatus: 409 })
    expect(tx.merchant.update).not.toHaveBeenCalled()
    await updateMerchantBrand({ ...owner, accentColor: '#1D4ED8', approvedLiveChange: true })
    expect(tx.merchant.update).toHaveBeenCalledTimes(1)
  })

  it('rejects an unrelated merchant logo URL even with owner approval', async () => {
    await expect(updateMerchantBrand({
      ...owner,
      logoUrl: 'https://a.public.blob.vercel-storage.com/merchant-brand/merchant-other/logo/logo.png',
      approvedLiveChange: true,
    })).rejects.toMatchObject({ code: 'INVALID_BRAND_MEDIA' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('uses canonical Experience commands and protects Draft status without live confirmation', async () => {
    const url = 'https://a.public.blob.vercel-storage.com/merchant-brand/merchant-a/hero/experience-a/abc123.png'
    await updateMerchantExperienceHero({ ...owner, experienceId: 'experience-a', heroAssetUrl: url })
    expect(experienceCommands.updateSharedConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: owner.merchantId, experienceId: 'experience-a',
      expectedType: 'STORE', patch: { heroAssetUrl: url }, draftOnly: true,
    }))
  })

  it('blocks active hero changes without explicit approval and retains the tenant check', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: 'experience-a', type: 'CAMPAIGN', status: 'ACTIVE' })
    await expect(updateMerchantExperienceHero({ ...owner, experienceId: 'experience-a', heroAssetUrl: null })).rejects
      .toMatchObject({ code: 'LIVE_CHANGE_CONFIRMATION_REQUIRED' })
    expect(experienceCommands.updateSharedConfiguration).not.toHaveBeenCalled()
    await updateMerchantExperienceHero({ ...owner, experienceId: 'experience-a', heroAssetUrl: null, approvedLiveChange: true })
    expect(experienceCommands.updateSharedConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      expectedType: 'CAMPAIGN', patch: { heroAssetUrl: null }, draftOnly: false,
    }))
    expect(prisma.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'experience-a', merchantId: 'merchant-a' }),
    }))
  })

  it('rejects missing or archived Experience without writing media', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(updateMerchantExperienceHero({ ...owner, experienceId: 'foreign', heroAssetUrl: null, approvedLiveChange: true })).rejects
      .toMatchObject({ code: 'EXPERIENCE_NOT_FOUND' })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: 'archived', type: 'STORE', status: 'ARCHIVED' })
    await expect(updateMerchantExperienceHero({ ...owner, experienceId: 'archived', heroAssetUrl: null, approvedLiveChange: true })).rejects
      .toMatchObject({ code: 'EXPERIENCE_NOT_FOUND' })
    expect(experienceCommands.updateSharedConfiguration).not.toHaveBeenCalled()
  })
})

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))
jest.mock('@/modules/store/application/public-edge-paths-server', () => ({
  getPublicEdgeTagsForMerchant: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  MerchantOnboardingError: class MerchantOnboardingError extends Error {
    readonly code: string
    readonly httpStatus: number
    constructor(code: string, message: string, httpStatus: number) {
      super(message)
      this.code = code
      this.httpStatus = httpStatus
    }
  },
}))

import { prisma } from '@/lib/prisma'
import { changeMerchantFrameLifecycle } from '@/modules/merchant/application/merchant-catalog-lifecycle'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner-a', merchantId: 'merchant-a', membershipId: 'membership-a' }
const tx = {
  $queryRaw: jest.fn(),
  experienceFrame: { count: jest.fn() },
  merchantFrame: { update: jest.fn() },
  merchantOperationAudit: { create: jest.fn() },
}

describe('human Catalog archive / restore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (run) => run(tx))
    tx.$queryRaw.mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'ACTIVE' }])
    tx.experienceFrame.count.mockResolvedValue(0)
    tx.merchantFrame.update.mockResolvedValue({ id: 'frame-a', status: 'INACTIVE' })
    tx.merchantOperationAudit.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('archives a tenant-owned unselected frame with transaction audit and invalidation', async () => {
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-a', action: 'ARCHIVE' }))
      .resolves.toEqual({ id: 'frame-a', status: 'INACTIVE' })
    expect(tx.experienceFrame.count).toHaveBeenCalledWith({ where: { merchantId: 'merchant-a', merchantFrameId: 'frame-a' } })
    expect(tx.merchantFrame.update).toHaveBeenCalledWith({ where: { id: 'frame-a', merchantId: 'merchant-a' }, data: { status: 'INACTIVE' } })
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'catalog.archived', resourceId: 'frame-a', actorType: 'HUMAN' }),
    })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'catalog', merchantSlug: 'merchant-a' } }))
  })

  it('refuses to archive any Store/Campaign selection, including Drafts', async () => {
    tx.experienceFrame.count.mockResolvedValueOnce(1)
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-a', action: 'ARCHIVE' }))
      .rejects.toMatchObject({ code: 'PRODUCT_IN_USE', httpStatus: 409 })
    expect(tx.merchantFrame.update).not.toHaveBeenCalled()
  })

  it('restores an archived item without reattaching or republishing it', async () => {
    tx.$queryRaw.mockReset().mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'INACTIVE' }])
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-a', action: 'RESTORE' }))
      .resolves.toEqual({ id: 'frame-a', status: 'ACTIVE' })
    expect(tx.merchantFrame.update).toHaveBeenCalledWith({ where: { id: 'frame-a', merchantId: 'merchant-a' }, data: { status: 'ACTIVE' } })
    expect(tx.experienceFrame.count).not.toHaveBeenCalled()
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'catalog.restored' }),
    })
  })

  it('treats repeated archive as an idempotent no-op, without duplicate audit', async () => {
    tx.$queryRaw.mockReset().mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'INACTIVE' }])
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-a', action: 'ARCHIVE' }))
      .resolves.toEqual({ id: 'frame-a', status: 'INACTIVE' })
    expect(tx.merchantFrame.update).not.toHaveBeenCalled()
    expect(tx.merchantOperationAudit.create).not.toHaveBeenCalled()
  })

  it('conceals a foreign ID and rejects an invalid restore transition', async () => {
    tx.$queryRaw.mockReset().mockResolvedValueOnce([{ id: 'merchant-a' }]).mockResolvedValueOnce([])
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-foreign', action: 'ARCHIVE' }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    tx.$queryRaw.mockReset().mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'DRAFT' }])
    await expect(changeMerchantFrameLifecycle({ actor, frameId: 'frame-a', action: 'RESTORE' }))
      .rejects.toMatchObject({ code: 'CATALOG_LIFECYCLE_CONFLICT', httpStatus: 409 })
    expect(tx.merchantFrame.update).not.toHaveBeenCalled()
  })

  it('requires an existing human membership before reading tenant data', async () => {
    await expect(changeMerchantFrameLifecycle({ actor: { ...actor, membershipId: undefined }, frameId: 'frame-a', action: 'ARCHIVE' }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(prisma.merchant.findUnique).not.toHaveBeenCalled()
  })
})

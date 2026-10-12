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

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { deleteUnusedMerchantFrame } from '@/modules/merchant/application/merchant-catalog-delete'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner-a', merchantId: 'merchant-a', membershipId: 'membership-a' }

const tx = {
  $queryRaw: jest.fn(),
  experienceFrame: { count: jest.fn() },
  merchantIntent: { count: jest.fn() },
  merchantEvent: { count: jest.fn() },
  tryOnTask: { count: jest.fn() },
  merchantFrame: { delete: jest.fn() },
  merchantOperationAudit: { create: jest.fn() },
}

describe('deleteUnusedMerchantFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
    tx.$queryRaw.mockResolvedValue([{ id: 'frame-a' }])
    tx.experienceFrame.count.mockResolvedValue(0)
    tx.merchantIntent.count.mockResolvedValue(0)
    tx.merchantEvent.count.mockResolvedValue(0)
    tx.tryOnTask.count.mockResolvedValue(0)
    tx.merchantFrame.delete.mockResolvedValue({ id: 'frame-a' })
    tx.merchantOperationAudit.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('actually deletes an unused tenant-owned product, audits within the transaction and invalidates discovery', async () => {
    await expect(deleteUnusedMerchantFrame({ actor, frameId: 'frame-a' })).resolves.toEqual({ id: 'frame-a' })
    expect(tx.merchantFrame.delete).toHaveBeenCalledWith({ where: { id: 'frame-a', merchantId: 'merchant-a' } })
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ merchantId: 'merchant-a', actorType: 'HUMAN', action: 'catalog.deleted', resourceId: 'frame-a' }),
    })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'catalog', merchantSlug: 'merchant-a' } }))
  })

  it.each(['experienceFrame', 'merchantIntent', 'merchantEvent', 'tryOnTask'] as const)(
    'returns a non-destructive 409 for a referenced product: %s',
    async (relation) => {
      tx[relation].count.mockResolvedValueOnce(1)
      await expect(deleteUnusedMerchantFrame({ actor, frameId: 'frame-a' })).rejects.toMatchObject({ code: 'PRODUCT_IN_USE', httpStatus: 409 })
      expect(tx.merchantFrame.delete).not.toHaveBeenCalled()
      expect(tx.merchantOperationAudit.create).not.toHaveBeenCalled()
    },
  )

  it('conceals missing or other-tenant frame IDs', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(deleteUnusedMerchantFrame({ actor, frameId: 'foreign-frame' })).rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(tx.merchantFrame.delete).not.toHaveBeenCalled()
  })

  it('turns a concurrent restrictive FK conflict into business 409, not an internal error', async () => {
    tx.merchantFrame.delete.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('foreign-key relation still exists', {
      code: 'P2003',
      clientVersion: 'test',
    }))
    await expect(deleteUnusedMerchantFrame({ actor, frameId: 'frame-a' })).rejects.toMatchObject({ code: 'PRODUCT_IN_USE', httpStatus: 409 })
    expect(tx.merchantOperationAudit.create).not.toHaveBeenCalled()
  })

  it('rejects a direct call without a membership, before touching storage', async () => {
    await expect(deleteUnusedMerchantFrame({ actor: { ...actor, membershipId: undefined }, frameId: 'frame-a' })).rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(prisma.merchant.findUnique).not.toHaveBeenCalled()
  })
})

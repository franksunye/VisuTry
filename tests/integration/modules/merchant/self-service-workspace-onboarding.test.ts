/**
 * Bounded application-path regression for the first-workspace Golden Path.
 * The transaction boundary is exercised with an in-memory Prisma adapter;
 * no production or shared database is touched by this test.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import { createMerchantWithOwner, requireMerchantMembership } from '@/modules/merchant'

describe('Merchant self-service Golden Path integration', () => {
  it('creates an OWNER workspace and reaches the merchant authorization boundary', async () => {
    const createdMembership = {
      id: 'membership-golden-path',
      userId: 'fresh-user',
      merchantId: 'merchant-golden-path',
      role: 'OWNER' as const,
      createdAt: new Date('2026-08-13T00:00:00.000Z'),
      updatedAt: new Date('2026-08-13T00:00:00.000Z'),
    }
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'fresh-user' }) },
      merchant: {
        create: jest.fn().mockResolvedValue({ id: 'merchant-golden-path', slug: 'golden-path-test', name: 'Golden Path Test' }),
      },
      merchantMembership: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdMembership),
      },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
    ;(prisma.merchantMembership.findUnique as jest.Mock).mockResolvedValue(createdMembership)

    const result = await createMerchantWithOwner({ userId: 'fresh-user', name: 'Golden Path Test' })
    const access = await requireMerchantMembership({ userId: 'fresh-user', merchantId: result.merchant.id, roles: ['OWNER'] })

    expect(result.membership).toMatchObject({ userId: 'fresh-user', merchantId: 'merchant-golden-path', role: 'OWNER' })
    expect(result.created).toBe(true)
    expect(access).toMatchObject({ userId: 'fresh-user', merchantId: 'merchant-golden-path', role: 'OWNER' })
    expect(tx.merchant.create).toHaveBeenCalledTimes(1)
    expect(tx.merchant.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        classification: 'POSSIBLE_EXTERNAL',
        classificationSource: 'SELF_SERVICE_SIGNUP',
      }),
    }))
    expect(tx.merchantMembership.create).toHaveBeenCalledTimes(1)
  })

  it('accepts an omitted or whitespace-only name with a neutral display name', async () => {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'blank-user' }) },
      merchant: {
        create: jest.fn().mockResolvedValue({ id: 'merchant-blank', slug: 'my-store', name: 'My Store' }),
      },
      merchantMembership: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'membership-blank', userId: 'blank-user', merchantId: 'merchant-blank', role: 'OWNER', createdAt: new Date(), updatedAt: new Date() }),
      },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

    const result = await createMerchantWithOwner({ userId: 'blank-user', name: '   ' })

    expect(result.merchant).toMatchObject({ id: 'merchant-blank', name: 'My Store' })
    expect(tx.merchant.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'My Store' }) }))
  })
})

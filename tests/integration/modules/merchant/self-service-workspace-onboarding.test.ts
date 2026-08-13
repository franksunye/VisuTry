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
    expect(access).toMatchObject({ userId: 'fresh-user', merchantId: 'merchant-golden-path', role: 'OWNER' })
    expect(tx.merchant.create).toHaveBeenCalledTimes(1)
    expect(tx.merchantMembership.create).toHaveBeenCalledTimes(1)
  })
})

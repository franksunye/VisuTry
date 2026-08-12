jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    merchant: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import {
  MerchantAccessError,
  createMerchantMembership,
  createMerchantWithOwner,
  getMerchantForUser,
  listMembersForMerchant,
  listMerchantsForUser,
  removeMerchantMembership,
  requireMerchantMembership,
} from '@/modules/merchant'

const membership = {
  id: 'membership-a-a',
  userId: 'user-a',
  merchantId: 'merchant-a',
  role: 'OWNER' as const,
  createdAt: new Date('2026-08-12T00:00:00.000Z'),
  updatedAt: new Date('2026-08-12T00:00:00.000Z'),
}

const merchantMembership = prisma.merchantMembership as unknown as {
  findUnique: jest.Mock
  findMany: jest.Mock
  create: jest.Mock
  count: jest.Mock
  delete: jest.Mock
}

describe('Merchant human membership foundation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authorizes only an explicit membership for the target merchant', async () => {
    merchantMembership.findUnique.mockResolvedValue(membership)

    await expect(requireMerchantMembership({
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).resolves.toEqual({
      userId: 'user-a',
      merchantId: 'merchant-a',
      membershipId: 'membership-a-a',
      role: 'OWNER',
    })

    expect(merchantMembership.findUnique).toHaveBeenCalledWith({
      where: {
        userId_merchantId: {
          userId: 'user-a',
          merchantId: 'merchant-a',
        },
      },
      select: expect.objectContaining({ id: true, role: true }),
    })
  })

  it('denies cross-tenant access with anti-enumeration 404', async () => {
    merchantMembership.findUnique.mockResolvedValue(null)

    const denial = requireMerchantMembership({
      userId: 'user-a',
      merchantId: 'merchant-b',
    })

    await expect(denial).rejects.toBeInstanceOf(MerchantAccessError)
    await expect(denial).rejects.toMatchObject({ httpStatus: 404 })
  })

  it('does not turn a global admin into a merchant owner without membership', async () => {
    merchantMembership.findUnique.mockResolvedValue(null)

    await expect(requireMerchantMembership({
      userId: 'platform-admin',
      merchantId: 'merchant-a',
    })).rejects.toMatchObject({ httpStatus: 404 })
  })

  it('supports role-scoped authorization without using User.role', async () => {
    merchantMembership.findUnique.mockResolvedValue({ ...membership, role: 'ADMIN' })

    await expect(requireMerchantMembership({
      userId: 'user-a',
      merchantId: 'merchant-a',
      roles: ['OWNER'],
    })).rejects.toMatchObject({ httpStatus: 404 })

    await expect(requireMerchantMembership({
      userId: 'user-a',
      merchantId: 'merchant-a',
      roles: ['ADMIN'],
    })).resolves.toMatchObject({ role: 'ADMIN' })
  })

  it('creates an explicit membership and keeps the composite key database-owned', async () => {
    merchantMembership.findUnique.mockResolvedValue(membership)
    merchantMembership.create.mockResolvedValue(membership)

    await expect(createMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
      role: 'OWNER',
    })).resolves.toEqual(membership)

    expect(merchantMembership.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER' },
    }))
  })

  it('supports one user across multiple merchants and multiple users in one merchant', async () => {
    merchantMembership.findMany
      .mockResolvedValueOnce([
        { ...membership, merchant: { id: 'merchant-a', slug: 'a', name: 'A', status: 'ACTIVE' } },
        { ...membership, id: 'membership-a-c', merchantId: 'merchant-c', merchant: { id: 'merchant-c', slug: 'c', name: 'C', status: 'ACTIVE' } },
      ])
      .mockResolvedValueOnce([
        { ...membership, merchant: { id: 'merchant-a', slug: 'a', name: 'A', status: 'ACTIVE' } },
        { ...membership, id: 'membership-b-a', userId: 'user-b', role: 'ADMIN', merchant: { id: 'merchant-a', slug: 'a', name: 'A', status: 'ACTIVE' } },
      ])

    await expect(listMerchantsForUser('user-a')).resolves.toHaveLength(2)
    merchantMembership.findUnique.mockResolvedValue(membership)
    await expect(listMembersForMerchant({ actorUserId: 'user-a', merchantId: 'merchant-a' })).resolves.toHaveLength(2)
  })

  it('returns the authorized merchant through the shared read service', async () => {
    merchantMembership.findUnique.mockResolvedValue(membership)
    merchantMembership.findMany.mockResolvedValue([{
      ...membership,
      merchant: { id: 'merchant-a', slug: 'a', name: 'A', status: 'ACTIVE' },
    }])

    await expect(getMerchantForUser({ userId: 'user-a', merchantId: 'merchant-a' })).resolves.toMatchObject({
      merchant: { id: 'merchant-a', slug: 'a' },
      membership: { id: 'membership-a-a', role: 'OWNER' },
    })
  })

  it('prevents removing the last owner', async () => {
    const tx = {
      merchantMembership: {
        findUnique: jest.fn().mockResolvedValue(membership),
        count: jest.fn().mockResolvedValue(1),
        delete: jest.fn(),
      },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
    merchantMembership.findUnique.mockResolvedValue(membership)

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).rejects.toThrow('at least one owner')
    expect(tx.merchantMembership.delete).not.toHaveBeenCalled()
  })

  it('removes an owner when another owner remains', async () => {
    const tx = {
      merchantMembership: {
        findUnique: jest.fn().mockResolvedValue(membership),
        count: jest.fn().mockResolvedValue(2),
        delete: jest.fn().mockResolvedValue(membership),
      },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
    merchantMembership.findUnique.mockResolvedValue(membership)

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).resolves.toEqual(membership)
  })

  it('provisions a merchant and its owner in one transaction', async () => {
    const tx = {
      merchant: { create: jest.fn() },
      merchantMembership: { create: jest.fn() },
    }
    tx.merchant.create.mockResolvedValue({ id: 'merchant-new', slug: 'new', name: 'New' })
    tx.merchantMembership.create.mockResolvedValue({ ...membership, merchantId: 'merchant-new' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

    await expect(createMerchantWithOwner({
      userId: 'user-a',
      slug: 'new',
      name: 'New',
    })).resolves.toMatchObject({
      merchant: { id: 'merchant-new' },
      membership: { merchantId: 'merchant-new', role: 'OWNER' },
    })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.merchantMembership.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { userId: 'user-a', merchantId: 'merchant-new', role: 'OWNER' },
    }))
  })
})

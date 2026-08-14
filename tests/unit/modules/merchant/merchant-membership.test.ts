jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import {
  MerchantAccessError,
  createMerchantMembership,
  createMerchantWithOwner,
  MerchantProvisioningError,
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

const adminMembership = {
  ...membership,
  id: 'membership-a-admin',
  role: 'ADMIN' as const,
}

type MembershipFixture = typeof membership | typeof adminMembership

const merchantMembership = prisma.merchantMembership as unknown as {
  findUnique: jest.Mock
  findMany: jest.Mock
  create: jest.Mock
  count: jest.Mock
  delete: jest.Mock
}

function setupRemoval(input: {
  actor: MembershipFixture
  target: MembershipFixture
  ownerCount: number
}) {
  const tx = {
    merchantMembership: {
      findUnique: jest.fn().mockResolvedValue(input.target),
      count: jest.fn().mockResolvedValue(input.ownerCount),
      delete: jest.fn().mockResolvedValue(input.target),
    },
  }
  merchantMembership.findUnique.mockResolvedValue(input.actor)
  ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
  return tx
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

  it('allows an OWNER to create an OWNER and keeps the composite key database-owned', async () => {
    merchantMembership.findUnique.mockResolvedValue(membership)
    merchantMembership.create.mockResolvedValue({ ...membership, id: 'membership-b-a', userId: 'user-b' })

    await expect(createMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-b',
      merchantId: 'merchant-a',
      role: 'OWNER',
    })).resolves.toMatchObject({ id: 'membership-b-a', userId: 'user-b', role: 'OWNER' })

    expect(merchantMembership.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { userId: 'user-b', merchantId: 'merchant-a', role: 'OWNER' },
    }))
  })

  it('allows an OWNER to create an ADMIN', async () => {
    merchantMembership.findUnique.mockResolvedValue(membership)
    merchantMembership.create.mockResolvedValue(adminMembership)

    await expect(createMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-b',
      merchantId: 'merchant-a',
      role: 'ADMIN',
    })).resolves.toEqual(adminMembership)
  })

  it('allows an ADMIN to create an ADMIN', async () => {
    merchantMembership.findUnique.mockResolvedValue(adminMembership)
    merchantMembership.create.mockResolvedValue({ ...adminMembership, userId: 'user-c' })

    await expect(createMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-c',
      merchantId: 'merchant-a',
      role: 'ADMIN',
    })).resolves.toMatchObject({ userId: 'user-c', role: 'ADMIN' })
  })

  it('denies an ADMIN creating an OWNER without revealing the requested role', async () => {
    merchantMembership.findUnique.mockResolvedValue(adminMembership)

    await expect(createMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-c',
      merchantId: 'merchant-a',
      role: 'OWNER',
    })).rejects.toMatchObject({ httpStatus: 404 })
    expect(merchantMembership.create).not.toHaveBeenCalled()
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

  it('allows an OWNER to remove an ADMIN', async () => {
    const tx = setupRemoval({
      actor: membership,
      target: { ...adminMembership, userId: 'user-b' },
      ownerCount: 1,
    })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-b',
      merchantId: 'merchant-a',
    })).resolves.toMatchObject({ userId: 'user-b', role: 'ADMIN' })
    expect(tx.merchantMembership.delete).toHaveBeenCalled()
  })

  it('allows an ADMIN to remove an ADMIN, including self-removal', async () => {
    const tx = setupRemoval({ actor: adminMembership, target: adminMembership, ownerCount: 1 })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).resolves.toEqual(adminMembership)
    expect(tx.merchantMembership.delete).toHaveBeenCalled()
  })

  it('denies an ADMIN removing an OWNER', async () => {
    const tx = setupRemoval({
      actor: adminMembership,
      target: { ...membership, userId: 'user-b' },
      ownerCount: 2,
    })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-b',
      merchantId: 'merchant-a',
    })).rejects.toMatchObject({ httpStatus: 404 })
    expect(tx.merchantMembership.delete).not.toHaveBeenCalled()
  })

  it('allows an OWNER to remove an OWNER when another OWNER remains', async () => {
    const tx = setupRemoval({
      actor: membership,
      target: { ...membership, id: 'membership-b-a', userId: 'user-b' },
      ownerCount: 2,
    })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-b',
      merchantId: 'merchant-a',
    })).resolves.toMatchObject({ id: 'membership-b-a', userId: 'user-b', role: 'OWNER' })
    expect(tx.merchantMembership.delete).toHaveBeenCalled()
  })

  it('allows OWNER self-removal only when another OWNER remains', async () => {
    const tx = setupRemoval({ actor: membership, target: membership, ownerCount: 2 })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).resolves.toEqual(membership)
    expect(tx.merchantMembership.delete).toHaveBeenCalled()
  })

  it('denies OWNER self-removal when it is the last OWNER', async () => {
    const tx = setupRemoval({ actor: membership, target: membership, ownerCount: 1 })

    await expect(removeMerchantMembership({
      actorUserId: 'user-a',
      userId: 'user-a',
      merchantId: 'merchant-a',
    })).rejects.toThrow('at least one owner')
    expect(tx.merchantMembership.delete).not.toHaveBeenCalled()
  })

  it('provisions a merchant and its owner in one transaction', async () => {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'user-a' }) },
      merchant: { create: jest.fn() },
      merchantMembership: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
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
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-a' },
      data: { updatedAt: expect.any(Date) },
    }))
    expect(tx.user.update.mock.calls[0][0].data).not.toHaveProperty('role')
  })

  it('returns the existing workspace on a repeated first-workspace submit', async () => {
    const existing = {
      id: 'membership-existing',
      userId: 'user-a',
      merchantId: 'merchant-existing',
      role: 'OWNER' as const,
      createdAt: new Date('2026-08-12T00:00:00.000Z'),
      updatedAt: new Date('2026-08-12T00:00:00.000Z'),
      merchant: { id: 'merchant-existing', slug: 'existing', name: 'Existing' },
    }
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'user-a' }) },
      merchant: { create: jest.fn() },
      merchantMembership: { findFirst: jest.fn().mockResolvedValue(existing), create: jest.fn() },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

    await expect(createMerchantWithOwner({ userId: 'user-a', name: 'Another Name' })).resolves.toMatchObject({
      merchant: existing.merchant,
      membership: { id: existing.id, role: 'OWNER' },
    })
    expect(tx.merchant.create).not.toHaveBeenCalled()
  })

  it('validates merchant name and website before opening a transaction', async () => {
    await expect(createMerchantWithOwner({ userId: 'user-a', name: ' ' })).rejects.toBeInstanceOf(MerchantProvisioningError)
    await expect(createMerchantWithOwner({ userId: 'user-a', name: 'Valid Name', websiteUrl: 'javascript:alert(1)' })).rejects.toMatchObject({ code: 'INVALID_WEBSITE_URL' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('keeps Merchant and OWNER creation atomic when membership creation fails', async () => {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'user-a' }) },
      merchant: { create: jest.fn().mockResolvedValue({ id: 'merchant-new', slug: 'new', name: 'New' }) },
      merchantMembership: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockRejectedValue(new Error('membership failed')) },
    }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

    await expect(createMerchantWithOwner({ userId: 'user-a', name: 'New' })).rejects.toThrow('membership failed')
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  canCreateMerchantMembership,
  canRemoveMerchantMembership,
  isMerchantMembershipRole,
  type MerchantMembershipRecord,
  type MerchantMembershipRole,
} from '../domain/membership'
import { MerchantAccessError, requireMerchantMembership } from './merchant-access'

export type MerchantSummary = {
  id: string
  slug: string
  name: string
  status: string
}

export type MerchantForUser = {
  merchant: MerchantSummary
  membership: MerchantMembershipRecord
}

const membershipSelect = {
  id: true,
  userId: true,
  merchantId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

const membershipWithMerchantSelect = {
  ...membershipSelect,
  merchant: {
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
    },
  },
} as const

export async function createMerchantMembership(input: {
  actorUserId: string
  userId: string
  merchantId: string
  role: MerchantMembershipRole
}): Promise<MerchantMembershipRecord> {
  const actorMembership = await requireMerchantMembership({
    userId: input.actorUserId,
    merchantId: input.merchantId,
    roles: ['OWNER', 'ADMIN'],
  })

  if (!isMerchantMembershipRole(input.role)) {
    throw new Error('Unsupported merchant membership role.')
  }
  if (!canCreateMerchantMembership(actorMembership.role, input.role)) {
    throw new MerchantAccessError()
  }

  return prisma.merchantMembership.create({
    data: {
      userId: input.userId,
      merchantId: input.merchantId,
      role: input.role,
    },
    select: membershipSelect,
  })
}

export async function getMerchantForUser(input: {
  userId: string
  merchantId: string
}): Promise<MerchantForUser> {
  const membership = await requireMerchantMembership({
    userId: input.userId,
    merchantId: input.merchantId,
  })

  const rows = await prisma.merchantMembership.findMany({
    where: { userId: input.userId, merchantId: input.merchantId },
    orderBy: { createdAt: 'asc' },
    select: membershipWithMerchantSelect,
  })
  const row = rows.find((candidate) => candidate.id === membership.membershipId)
  if (!row) throw new MerchantAccessError()

  return {
    merchant: row.merchant,
    membership: {
      id: row.id,
      userId: row.userId,
      merchantId: row.merchantId,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  }
}

export async function listMerchantsForUser(userId: string): Promise<MerchantForUser[]> {
  const rows = await prisma.merchantMembership.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: membershipWithMerchantSelect,
  })

  return rows.map(({ merchant, ...membership }) => ({ merchant, membership }))
}

export async function listMembersForMerchant(input: {
  actorUserId: string
  merchantId: string
}): Promise<MerchantMembershipRecord[]> {
  await requireMerchantMembership({
    userId: input.actorUserId,
    merchantId: input.merchantId,
    roles: ['OWNER', 'ADMIN'],
  })

  const rows = await prisma.merchantMembership.findMany({
    where: { merchantId: input.merchantId },
    orderBy: { createdAt: 'asc' },
    select: membershipWithMerchantSelect,
  })

  return rows.map(({ merchant: _merchant, ...membership }) => membership)
}

export async function removeMerchantMembership(input: {
  actorUserId: string
  userId: string
  merchantId: string
}): Promise<MerchantMembershipRecord> {
  const actorMembership = await requireMerchantMembership({
    userId: input.actorUserId,
    merchantId: input.merchantId,
    roles: ['OWNER', 'ADMIN'],
  })

  return prisma.$transaction(async (tx) => {
    const membership = await tx.merchantMembership.findUnique({
      where: { userId_merchantId: { userId: input.userId, merchantId: input.merchantId } },
      select: membershipSelect,
    })
    if (!membership || !isMerchantMembershipRole(membership.role)) {
      throw new MerchantAccessError()
    }
    if (!canRemoveMerchantMembership(actorMembership.role, membership.role)) {
      throw new MerchantAccessError()
    }

    if (membership.role === 'OWNER') {
      const ownerCount = await tx.merchantMembership.count({
        where: { merchantId: input.merchantId, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        throw new Error('A merchant must retain at least one owner.')
      }
    }

    return tx.merchantMembership.delete({
      where: { userId_merchantId: { userId: input.userId, merchantId: input.merchantId } },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

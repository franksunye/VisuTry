import { prisma } from '@/lib/prisma'
import {
  isMerchantMembershipRole,
  type MerchantMembershipRecord,
  type MerchantMembershipRole,
} from '../domain/membership'

export type MerchantMembershipRepository = {
  findUnique: (args: {
    where: { userId_merchantId: { userId: string; merchantId: string } }
    select: { id: true; userId: true; merchantId: true; role: true; createdAt: true; updatedAt: true }
  }) => Promise<MerchantMembershipRecord | null>
}

export type MerchantAuthorization = {
  userId: string
  merchantId: string
  membershipId: string
  role: MerchantMembershipRole
}

export class MerchantAccessError extends Error {
  readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('Merchant access was not found.')
    this.name = 'MerchantAccessError'
  }
}

const membershipSelect = {
  id: true,
  userId: true,
  merchantId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function requireMerchantMembership(input: {
  userId: string
  merchantId: string
  roles?: readonly MerchantMembershipRole[]
  repository?: MerchantMembershipRepository
}): Promise<MerchantAuthorization> {
  const repository = input.repository ?? prisma.merchantMembership
  const membership = await repository.findUnique({
    where: {
      userId_merchantId: {
        userId: input.userId,
        merchantId: input.merchantId,
      },
    },
    select: membershipSelect,
  })

  if (!membership || !isMerchantMembershipRole(membership.role)) {
    throw new MerchantAccessError()
  }

  if (input.roles && !input.roles.includes(membership.role)) {
    throw new MerchantAccessError()
  }

  return {
    userId: membership.userId,
    merchantId: membership.merchantId,
    membershipId: membership.id,
    role: membership.role,
  }
}

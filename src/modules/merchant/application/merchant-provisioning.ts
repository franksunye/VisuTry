import { prisma } from '@/lib/prisma'
import type { MerchantMembershipRecord } from '../domain/membership'

export type CreateMerchantWithOwnerInput = {
  userId: string
  slug: string
  name: string
}

export type MerchantWithOwner = {
  merchant: {
    id: string
    slug: string
    name: string
  }
  membership: MerchantMembershipRecord
}

export async function createMerchantWithOwner(
  input: CreateMerchantWithOwnerInput,
): Promise<MerchantWithOwner> {
  return prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.create({
      data: {
        slug: input.slug,
        name: input.name,
      },
      select: { id: true, slug: true, name: true },
    })
    const membership = await tx.merchantMembership.create({
      data: {
        userId: input.userId,
        merchantId: merchant.id,
        role: 'OWNER',
      },
      select: {
        id: true,
        userId: true,
        merchantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { merchant, membership }
  })
}

/** Explicit internal/bootstrap operation; never run as an implicit backfill. */
export async function assignMerchantOwner(input: {
  userId: string
  merchantId: string
}): Promise<MerchantMembershipRecord> {
  return prisma.merchantMembership.create({
    data: {
      userId: input.userId,
      merchantId: input.merchantId,
      role: 'OWNER',
    },
    select: {
      id: true,
      userId: true,
      merchantId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

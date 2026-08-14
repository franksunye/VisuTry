import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/programmatic-seo'
import type { MerchantMembershipRecord } from '../domain/membership'

export type CreateMerchantWithOwnerInput = {
  userId: string
  slug?: string
  name?: string
  websiteUrl?: string | null
}

export type MerchantWithOwner = {
  merchant: {
    id: string
    slug: string
    name: string
  }
  membership: MerchantMembershipRecord
}

export class MerchantProvisioningError extends Error {
  readonly code: 'INVALID_MERCHANT_NAME' | 'INVALID_WEBSITE_URL' | 'SLUG_UNAVAILABLE'

  constructor(code: MerchantProvisioningError['code'], message: string) {
    super(message)
    this.name = 'MerchantProvisioningError'
    this.code = code
  }
}

function normalizeInput(input: CreateMerchantWithOwnerInput) {
  const suppliedName = input.name === undefined ? null : input.name.trim()
  const name = suppliedName === null ? 'My Merchant Workspace' : suppliedName
  if (name.length < 2 || name.length > 120) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must be between 2 and 120 characters.')
  }

  const websiteUrl = input.websiteUrl?.trim() || null
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported protocol')
    } catch {
      throw new MerchantProvisioningError('INVALID_WEBSITE_URL', 'Website URL must be a valid http(s) URL.')
    }
  }

  const baseSlug = slugify((input.slug || name).trim()).slice(0, 180).replace(/-+$/u, '')
  if (!baseSlug) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must contain letters or numbers.')
  }

  return { name, websiteUrl, baseSlug }
}

async function createMerchantWithOwnerAttempt(
  input: CreateMerchantWithOwnerInput,
  normalized: ReturnType<typeof normalizeInput>,
  attempt: number,
): Promise<MerchantWithOwner> {
  return prisma.$transaction(async (tx) => {
    // Serialize first-workspace creation for this user without changing User.role.
    await tx.user.update({
      where: { id: input.userId },
      data: { updatedAt: new Date() },
      select: { id: true },
    })

    const existingMembership = await tx.merchantMembership.findFirst({
      where: { userId: input.userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        merchantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        merchant: { select: { id: true, slug: true, name: true } },
      },
    })
    if (existingMembership) {
      return {
        merchant: existingMembership.merchant,
        membership: {
          id: existingMembership.id,
          userId: existingMembership.userId,
          merchantId: existingMembership.merchantId,
          role: existingMembership.role,
          createdAt: existingMembership.createdAt,
          updatedAt: existingMembership.updatedAt,
        },
      }
    }

    const slug = attempt === 0 ? normalized.baseSlug : `${normalized.baseSlug}-${attempt + 1}`
    const merchant = await tx.merchant.create({
      data: {
        slug,
        name: normalized.name,
        websiteUrl: normalized.websiteUrl,
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
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function createMerchantWithOwner(
  input: CreateMerchantWithOwnerInput,
): Promise<MerchantWithOwner> {
  const normalized = normalizeInput(input)
  let slugAttempt = 0
  let serializationRetries = 0
  while (slugAttempt < 5 && serializationRetries < 5) {
    try {
      return await createMerchantWithOwnerAttempt(input, normalized, slugAttempt)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034' && serializationRetries < 4) {
          serializationRetries += 1
          continue
        }
        if (error.code === 'P2002' && slugAttempt < 4) {
          slugAttempt += 1
          continue
        }
        if (error.code === 'P2002') {
          throw new MerchantProvisioningError('SLUG_UNAVAILABLE', 'That merchant name is currently unavailable.')
        }
      }
      throw error
    }
  }
  throw new MerchantProvisioningError('SLUG_UNAVAILABLE', 'That merchant name is currently unavailable.')
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

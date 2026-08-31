import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/programmatic-seo'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import {
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE,
} from '../domain/merchant-classification'
import type { MerchantMembershipRecord } from '../domain/membership'
import { merchantSlugForAttempt } from './merchant-slug'

const MAX_SLUG_ATTEMPTS = 100

export type CreateMerchantWithOwnerInput = {
  userId: string
  slug?: string
  name?: string
  websiteUrl?: string | null
  source?: string | null
  campaign?: string | null
}

export type MerchantWithOwner = {
  merchant: {
    id: string
    slug: string
    name: string
  }
  membership: MerchantMembershipRecord
  created: boolean
}

type MerchantProvisioningAttemptResult = MerchantWithOwner & { created: boolean }

function isMerchantSlugUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false
  const meta = error.meta as { target?: unknown; constraint?: unknown } | undefined
  const target = Array.isArray(meta?.target) ? meta.target.map(String) : [String(meta?.target ?? '')]
  const constraint = String(meta?.constraint ?? '')
  return target.includes('slug') || /merchant[_\s-]*slug|slug[_\s-]*key/iu.test(constraint)
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
  // The onboarding form intentionally makes the name optional. Treat an
  // omitted, empty, or whitespace-only value the same way so a blank form
  // cannot fall into the slug/name validation path.
  const name = input.name?.trim() || 'My Store'
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

  const baseSlug = slugify(input.slug?.trim() || name).slice(0, 180).replace(/-+$/u, '')
  if (!baseSlug) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must contain letters or numbers.')
  }

  const source = input.source?.trim().slice(0, 200) || null
  const campaign = input.campaign?.trim().slice(0, 200) || null

  return { name, websiteUrl, baseSlug, source, campaign }
}

async function createMerchantWithOwnerAttempt(
  input: CreateMerchantWithOwnerInput,
  normalized: ReturnType<typeof normalizeInput>,
  slug: string,
): Promise<MerchantProvisioningAttemptResult> {
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
      // Self-service onboarding provisions the user's first workspace only.
      // The locked membership is the idempotency record for refreshes, retries,
      // callback replays, and concurrent submits.
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
        created: false,
      }
    }

    const merchant = await tx.merchant.create({
      data: {
        slug,
        name: normalized.name,
        websiteUrl: normalized.websiteUrl,
        defaultSource: normalized.source,
        defaultCampaign: normalized.campaign,
        classification: PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION,
        classificationSource: PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE,
        classificationReason: PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON,
        planCode: 'FREE',
        pricingVersion: 'v1',
        entitlementVersion: 'v1',
        commercialStatus: 'FREE',
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

    return { merchant, membership, created: true }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function createMerchantWithOwner(
  input: CreateMerchantWithOwnerInput,
): Promise<MerchantWithOwner> {
  const normalized = normalizeInput(input)
  let slugAttempt = 0
  let serializationRetries = 0
  while (slugAttempt < MAX_SLUG_ATTEMPTS && serializationRetries < 5) {
    try {
      const slug = merchantSlugForAttempt(normalized.baseSlug, slugAttempt)
      const result = await withPublicDiscoveryInvalidation({
        target: { kind: 'merchant', merchantSlug: slug },
        invalidate: (attempt) => attempt.created,
        mutation: () => createMerchantWithOwnerAttempt(input, normalized, slug),
      })
      return { merchant: result.merchant, membership: result.membership, created: result.created }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034' && serializationRetries < 4) {
          serializationRetries += 1
          continue
        }
        if (isMerchantSlugUniqueViolation(error) && slugAttempt < MAX_SLUG_ATTEMPTS - 1) {
          slugAttempt += 1
          serializationRetries = 0
          continue
        }
        if (isMerchantSlugUniqueViolation(error)) {
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

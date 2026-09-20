import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { resolveAppEnvironment } from '@/lib/app-environment'
import { slugify } from '@/lib/programmatic-seo'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import {
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE,
} from '../domain/merchant-classification'
import type { MerchantMembershipRecord } from '../domain/membership'
import { merchantSlugForAttempt } from './merchant-slug'
import { recordMerchantActivationEventWithClient } from './merchant-activation'
import { MERCHANT_ACTIVATION_EVENT, type MerchantActivationAttributionInput } from '../domain/merchant-activation'

const MAX_SLUG_ATTEMPTS = 100

export type CreateMerchantWithOwnerInput = {
  userId: string
  slug?: string
  name?: string
  websiteUrl?: string | null
  source?: string | null
  campaign?: string | null
  commercialIntent?: string | null
  signupCorrelationId?: string | null
  attribution?: MerchantActivationAttributionInput | null
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
  // Name validation is intentionally deferred until after the existing-owner
  // lookup inside the transaction. An existing owner retry must return its
  // current workspace idempotently, even if an old replay omitted `name`.
  const name = input.name?.trim() || null
  const websiteUrl = input.websiteUrl?.trim() || null
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported protocol')
    } catch {
      throw new MerchantProvisioningError('INVALID_WEBSITE_URL', 'Website URL must be a valid http(s) URL.')
    }
  }

  const baseSlug = name
    ? slugify(input.slug?.trim() || name).slice(0, 180).replace(/-+$/u, '') || null
    : null

  const source = input.source?.trim().slice(0, 200) || null
  const campaign = input.campaign?.trim().slice(0, 200) || null

  return { name, websiteUrl, baseSlug, source, campaign }
}

function assertNewMerchantIdentity(normalized: ReturnType<typeof normalizeInput>): asserts normalized is ReturnType<typeof normalizeInput> & { name: string; baseSlug: string } {
  if (!normalized.name || normalized.name.length < 2 || normalized.name.length > 120) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must be between 2 and 120 characters.')
  }
  if (!normalized.baseSlug) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must contain letters or numbers.')
  }
}

async function createMerchantWithOwnerAttempt(
  input: CreateMerchantWithOwnerInput,
  normalized: ReturnType<typeof normalizeInput>,
  slug: string,
): Promise<MerchantProvisioningAttemptResult> {
  return prisma.$transaction(async (tx) => {
    const isLocalQa = resolveAppEnvironment() === 'local'
    const classification = isLocalQa ? 'TEST' : PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION
    const classificationSource = isLocalQa ? 'LOCAL_QA' : PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE
    const classificationReason = isLocalQa
      ? 'Created by the Local Merchant Growth Lab QA fixture.'
      : PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON
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

    // Do not mutate User, Merchant, Membership, or the activation ledger until
    // the new-workspace identity has passed the server-side gate.
    assertNewMerchantIdentity(normalized)

    // Serialize first-workspace creation for this user without changing
    // User.role, then re-check membership after the lock for concurrent
    // requests that started with the same empty state.
    await tx.user.update({
      where: { id: input.userId },
      data: { updatedAt: new Date() },
      select: { id: true },
    })

    const existingMembershipAfterLock = await tx.merchantMembership.findFirst({
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
    if (existingMembershipAfterLock) {
      return {
        merchant: existingMembershipAfterLock.merchant,
        membership: {
          id: existingMembershipAfterLock.id,
          userId: existingMembershipAfterLock.userId,
          merchantId: existingMembershipAfterLock.merchantId,
          role: existingMembershipAfterLock.role,
          createdAt: existingMembershipAfterLock.createdAt,
          updatedAt: existingMembershipAfterLock.updatedAt,
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
        classification,
        classificationSource,
        classificationReason,
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

    await recordMerchantActivationEventWithClient(tx, {
      merchantId: merchant.id,
      eventType: MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED,
      source: 'SERVER',
      correlationId: input.signupCorrelationId,
      attribution: input.attribution,
      intent: input.commercialIntent,
      metadata: {
        classification,
        classification_source: classificationSource,
        commercial_intent: input.commercialIntent,
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
      // An invalid identity still enters the transaction so an existing
      // membership can be returned idempotently; the attempt asserts it only
      // after confirming that no workspace exists.
      const slug = merchantSlugForAttempt(normalized.baseSlug ?? '', slugAttempt)
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

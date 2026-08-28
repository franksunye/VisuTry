import { getTryOnConfig } from '@/config/try-on-types'
import { Prisma, TaskStatus, TryOnType } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  buildStoreGenerationIdempotencyKey,
  evaluateStoreDemoAllowance,
  isMerchantEntitlementActive,
  merchantInactive,
  merchantNotFound,
  merchantUsageCreatedAtFilter,
  resolveMerchantEntitlement,
  selectUsagePolicy,
  resolveStoreExperiencePolicy,
  experiencePolicyMetadata,
  experienceContainsFrame,
  resolveMerchantSponsoredUsagePolicy,
  sponsoredUsageFailureAction,
  authRequiredForContinuation,
  consumerEntitlementRequired,
} from '../domain'
import { canUseCommercialFeature, isCanonicalMerchantCommercialFields } from '../domain/merchant-commercial-state'
import { consumeAICommerceSession } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { checkUserQuota } from '@/lib/quota'
import { calculateExpiresAt } from '@/config/retention'
import type { AssetStore } from './ports/asset-store'
import type { StoreGenerationPort } from './ports/generation'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
  ExperienceRepository,
  StoreUsageRepository,
  MerchantSponsoredUsageRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'
import { recordStoreTryOnAttempt } from './settle-store-usage'
import { fetchImageAsFile } from './fetch-image-file'
import { assertSameMerchantTenant } from './tenant-guards'
import {
  DEFAULT_STORE_ABUSE_LIMITS,
  dayWindowStart,
  retryAfterSeconds,
} from './store-abuse-limits'
import { computeStoreAssetExpiresAt } from '../infrastructure/config/store-demo-limits'
import {
  buildDispatchLeaseFields,
  type DispatchFence,
  resolvePlaceholderReuseAction,
} from './store-dispatch-lease'
import { acquireStoreDispatchTakeover } from './store-task-leases'

export type SubmitStoreTryOnInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  assets: AssetStore
  generation: StoreGenerationPort
  experiences?: ExperienceRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  merchantFrameId: string
  batchId: string
  clientSubmissionId: string
  locale?: string | null
  deviceType?: string | null
  clientIp?: string | null
  userId?: string | null
  sponsoredUsage?: MerchantSponsoredUsageRepository
}

export type SubmitStoreTryOnResult = {
  taskId: string
  status: string
  merchantFrameId: string
  reusedExisting: boolean
  entitlementSource: 'MERCHANT_SPONSORED' | 'CONSUMER_ENTITLEMENT' | 'LEGACY_STORE'
  frame: {
    id: string
    name: string
    imageUrl: string | null
    productUrl: string | null
    price: number | null
    currency: string | null
    shape: string
  }
}

function frameDto(frame: {
  id: string
  name: string
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
}) {
  return {
    id: frame.id,
    name: frame.name,
    imageUrl: frame.imageUrl,
    productUrl: frame.productUrl,
    price: frame.price,
    currency: frame.currency,
    shape: frame.shape,
  }
}

async function assertStoreBatchFrameLimit(input: {
  merchantId: string
  merchantSessionId: string
  merchantFrameId: string
  batchId: string
  maxCompareFrames: number
}) {
  const existingTasks = await prisma.tryOnTask.findMany({
    where: {
      merchantId: input.merchantId,
      merchantSessionId: input.merchantSessionId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
    },
    select: { merchantFrameId: true, batchId: true },
  })
  const batchFrameIds = new Set(
    existingTasks
      .filter((task) => task.batchId === input.batchId)
      .map((task) => task.merchantFrameId)
      .filter((frameId): frameId is string => Boolean(frameId)),
  )
  batchFrameIds.add(input.merchantFrameId)

  if (batchFrameIds.size > input.maxCompareFrames) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      `Try-on supports up to ${input.maxCompareFrames} frames per batch.`,
      400,
    )
  }
}

/**
 * Reserve a distinct frame in a Store batch inside the claim transaction.
 * PostgreSQL's transaction-scoped advisory lock serializes claims for the
 * same merchant/session/batch without a process-local mutex.
 */
export async function reserveStoreBatchFrame(
  tx: Prisma.TransactionClient,
  input: {
    merchantId: string
    merchantSessionId: string
    merchantFrameId: string
    batchId: string
    maxCompareFrames: number
  },
) {
  const lockKey = `${input.merchantId}:${input.merchantSessionId}:${input.batchId}`
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
  `

  const existingTasks = await tx.tryOnTask.findMany({
    where: {
      merchantId: input.merchantId,
      merchantSessionId: input.merchantSessionId,
      batchId: input.batchId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
    },
    select: { merchantFrameId: true },
  })
  const batchFrameIds = new Set(
    existingTasks
      .map((task) => task.merchantFrameId)
      .filter((frameId): frameId is string => Boolean(frameId)),
  )
  batchFrameIds.add(input.merchantFrameId)

  if (batchFrameIds.size > input.maxCompareFrames) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      `Try-on supports up to ${input.maxCompareFrames} frames per batch.`,
      400,
    )
  }
}

async function markStoreClaimFailed(
  taskId: string,
  lease: DispatchFence,
  error: unknown,
): Promise<boolean> {
  const now = new Date()
  const reason =
    error instanceof Error ? error.message.slice(0, 500) : 'claim_post_commit_failed'
  const existing = await prisma.tryOnTask.findUnique({
    where: { id: taskId },
    select: {
      metadata: true,
      status: true,
      dispatchLeaseOwner: true,
      dispatchVersion: true,
    },
  })
  if (!existing) return false
  if (existing.status === TaskStatus.COMPLETED) {
    return false
  }
  if (existing.status === TaskStatus.FAILED) {
    return (
      existing.dispatchLeaseOwner === lease.owner &&
      existing.dispatchVersion === lease.version
    )
  }
  const metadata = (existing.metadata ?? {}) as Record<string, unknown>
  const updated = await prisma.tryOnTask.updateMany({
    where: {
      id: taskId,
      dispatchLeaseOwner: lease.owner,
      dispatchVersion: lease.version,
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.FAILED] },
      userImageUrl: { startsWith: 'pending:' },
    },
    data: {
      status: TaskStatus.FAILED,
      errorMessage: reason,
      metadata: {
        ...metadata,
        claimFailedAt: now.toISOString(),
        claimFailureReason: reason,
      },
    },
  })
  return updated.count > 0
}

/**
 * Atomically claim a placeholder TryOnTask + RENDER_ATTEMPT (+ merchant abuse bump).
 * Reuse of the same idempotency key burns no additional attempt.
 */
async function claimStoreTryOnSlot(input: {
  merchantId: string
  merchantSessionId: string
  merchantFrameId: string
  idempotencyKey: string
  clientSubmissionId: string
  clientIp?: string | null
  expiresAt?: Date
  renderLimits: import('../domain').StoreDemoLimits
  usageCreatedAt?: { gte?: Date; lt?: Date }
  tryOnOrigin: 'STORE_DEMO' | 'STORE_PILOT'
  batchId: string
  maxCompareFrames: number
  userId?: string | null
  usagePolicyKind: 'store_demo_allowance' | 'merchant_allowance' | 'merchant_sponsored' | 'consumer_quota'
  sponsoredReservationId?: string | null
}): Promise<{
  taskId: string
  reusedExisting: boolean
  dispatchLease: DispatchFence | null
}> {
  const maxAttempts = 3
  const abuseWindow = dayWindowStart()
  const ip = input.clientIp || 'unknown'
  const lease = buildDispatchLeaseFields()
  const leaseOwner = randomUUID()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.tryOnTask.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          })
          if (existing) {
            if (existing.merchantId !== input.merchantId) {
              throw new StoreDomainError(
                'IDEMPOTENCY_CONFLICT',
                'Try-on submission conflict.',
                409,
              )
            }
            return { taskId: existing.id, reusedExisting: true, dispatchLease: null }
          }

          await reserveStoreBatchFrame(tx, {
            merchantId: input.merchantId,
            merchantSessionId: input.merchantSessionId,
            merchantFrameId: input.merchantFrameId,
            batchId: input.batchId,
            maxCompareFrames: input.maxCompareFrames,
          })

          const [merchantSuccessfulRenders, sessionSuccessfulRenders, sessionAttempts] =
            await Promise.all([
              tx.merchantUsageLedger.count({
                where: {
                  merchantId: input.merchantId,
                  kind: 'RENDER_SUCCESS',
                  ...(input.usageCreatedAt ? { createdAt: input.usageCreatedAt } : {}),
                },
              }),
              tx.merchantUsageLedger.count({
                where: {
                  merchantId: input.merchantId,
                  merchantSessionId: input.merchantSessionId,
                  kind: 'RENDER_SUCCESS',
                },
              }),
              tx.merchantUsageLedger.count({
                where: {
                  merchantId: input.merchantId,
                  merchantSessionId: input.merchantSessionId,
                  kind: 'RENDER_ATTEMPT',
                },
              }),
            ])

          const allowance = evaluateStoreDemoAllowance(input.renderLimits, {
            merchantSuccessfulRenders,
            sessionSuccessfulRenders,
            sessionAttempts,
          })
          if (!allowance.allowed) {
            throw new StoreDomainError('ALLOWANCE_EXCEEDED', allowance.reason, 429)
          }

          const merchantAbuse = await tx.storeAbuseCounter.upsert({
            where: {
              merchantId_bucket_windowStart: {
                merchantId: input.merchantId,
                bucket: 'attempt:merchant',
                windowStart: abuseWindow,
              },
            },
            create: {
              merchantId: input.merchantId,
              bucket: 'attempt:merchant',
              windowStart: abuseWindow,
              count: 1,
            },
            update: { count: { increment: 1 } },
          })
          if (merchantAbuse.count > DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay) {
            throw new StoreDomainError(
              'ALLOWANCE_EXCEEDED',
              'Merchant daily try-on attempt limit reached.',
              429,
              `retry_after=${retryAfterSeconds(abuseWindow, 86400_000)}`,
            )
          }

          const ipAbuse = await tx.storeAbuseCounter.upsert({
            where: {
              merchantId_bucket_windowStart: {
                merchantId: input.merchantId,
                bucket: `attempt:ip:${ip}`,
                windowStart: abuseWindow,
              },
            },
            create: {
              merchantId: input.merchantId,
              bucket: `attempt:ip:${ip}`,
              windowStart: abuseWindow,
              count: 1,
            },
            update: { count: { increment: 1 } },
          })
          if (ipAbuse.count > 40) {
            throw new StoreDomainError(
              'ALLOWANCE_EXCEEDED',
              'Too many try-on attempts from this network.',
              429,
              `retry_after=${retryAfterSeconds(abuseWindow, 86400_000)}`,
            )
          }

          const failureAbuse = await tx.storeAbuseCounter.findUnique({
            where: {
              merchantId_bucket_windowStart: {
                merchantId: input.merchantId,
                bucket: 'failure:merchant',
                windowStart: abuseWindow,
              },
            },
          })
          if (
            failureAbuse &&
            failureAbuse.count >= DEFAULT_STORE_ABUSE_LIMITS.maxFailuresPerMerchantPerDay
          ) {
            throw new StoreDomainError(
              'ALLOWANCE_EXCEEDED',
              'Merchant daily try-on failure limit reached.',
              429,
              `retry_after=${retryAfterSeconds(abuseWindow, 86400_000)}`,
            )
          }

          const task = await tx.tryOnTask.create({
            data: {
              userId: input.userId ?? null,
              type: TryOnType.GLASSES,
              userImageUrl: 'pending://user',
              itemImageUrl: 'pending://item',
              status: TaskStatus.PENDING,
              origin: input.tryOnOrigin,
              merchantId: input.merchantId,
              merchantSessionId: input.merchantSessionId,
              merchantFrameId: input.merchantFrameId,
              idempotencyKey: input.idempotencyKey,
              clientSubmissionId: input.clientSubmissionId,
              batchId: input.batchId,
              expiresAt: input.expiresAt ?? computeStoreAssetExpiresAt(),
              retentionStatus: 'ACTIVE',
              metadata: {
                ...lease,
                batchId: input.batchId,
                usagePolicyKind: input.usagePolicyKind,
                ...(input.sponsoredReservationId
                  ? { sponsoredReservationId: input.sponsoredReservationId }
                  : {}),
              },
              dispatchLeaseOwner: leaseOwner,
              dispatchLeaseUntil: new Date(lease.dispatchLeaseUntil),
              dispatchVersion: 1,
            },
          })

          await tx.merchantUsageLedger.create({
            data: {
              merchantId: input.merchantId,
              merchantSessionId: input.merchantSessionId,
              tryOnTaskId: task.id,
              kind: 'RENDER_ATTEMPT',
            },
          })

          return {
            taskId: task.id,
            reusedExisting: false,
            dispatchLease: { owner: leaseOwner, version: 1 },
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      if (error instanceof StoreDomainError) throw error
      const code = (error as { code?: string })?.code
      if (code === 'P2002') {
        const raced = await prisma.tryOnTask.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        })
        if (raced) {
          return { taskId: raced.id, reusedExisting: true, dispatchLease: null }
        }
      }
      if (code !== 'P2034' || attempt === maxAttempts) throw error
    }
  }
  throw new Error('Store try-on claim retry limit exceeded')
}

export async function submitStoreFrameTryOn(
  input: SubmitStoreTryOnInput,
): Promise<SubmitStoreTryOnResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)
  if (!experiencePolicy.tryOnEnabled) {
    throw new StoreDomainError(
      'CAPABILITY_DISABLED',
      'Try-On is not enabled for this store.',
      403,
    )
  }

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })
  assertSameMerchantTenant(merchant.id, session.merchantId, 'session')
  const experience = session.experienceId && input.experiences
    ? await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    : null

  const frame = await input.frames.findActiveByMerchantAndId(
    merchant.id,
    input.merchantFrameId,
  )
  if (!frame) {
    throw new StoreDomainError('FRAME_INACTIVE', 'This frame is no longer available.', 409)
  }
  assertSameMerchantTenant(merchant.id, frame.merchantId, 'frame')
  if (experience && !experienceContainsFrame(experience, frame.id)) {
    throw new StoreDomainError('FRAME_INACTIVE', 'This frame is not part of the current experience.', 409)
  }

  await assertStoreBatchFrameLimit({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    merchantFrameId: frame.id,
    batchId: input.batchId,
    maxCompareFrames: experiencePolicy.maxCompareFrames,
  })

  if (!session.photoAssetId) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'Upload a photo before starting try-on.',
      400,
    )
  }

  const photoBytes = await input.assets.getBytes(session.photoAssetId, merchant.id)
  if (!photoBytes) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'Your session photo is unavailable. Please upload again.',
      400,
    )
  }

  let frameImageUrl = frame.imageUrl
  if (!frameImageUrl && frame.imageAssetId) {
    frameImageUrl = await input.assets.getProviderDeliveryUrl(frame.imageAssetId, merchant.id)
  }
  if (!frameImageUrl) {
    throw new StoreDomainError(
      'FRAME_INACTIVE',
      'This frame is missing a product image.',
      409,
    )
  }

  const userImage = new File([new Uint8Array(photoBytes.body)], `shopper-${session.id}.jpg`, {
    type: photoBytes.contentType || 'image/jpeg',
  })
  let itemImage: File
  try {
    itemImage = await fetchImageAsFile(frameImageUrl, `frame-${frame.id}.jpg`)
  } catch {
    throw new StoreDomainError(
      'FRAME_INACTIVE',
      'This frame image could not be loaded. Please try another frame.',
      409,
    )
  }

  const entitlement = resolveMerchantEntitlement(merchant)
  if (!isMerchantEntitlementActive(entitlement)) {
    throw new StoreDomainError(
      'MERCHANT_INACTIVE',
      'This store is temporarily unavailable.',
      403,
      'Merchant Pilot entitlement period is not active.',
    )
  }
  const usageCreatedAt = merchantUsageCreatedAtFilter(entitlement)

  const idempotencyKey = buildStoreGenerationIdempotencyKey({
    merchantSessionId: session.id,
    merchantFrameId: frame.id,
    clientSubmissionId: input.clientSubmissionId,
  })

  const existingBeforeClaim = await prisma.tryOnTask.findUnique({
    where: { idempotencyKey },
    select: { id: true, userId: true, metadata: true },
  })
  const existingMetadata = (existingBeforeClaim?.metadata ?? {}) as Record<string, unknown>
  const hasCanonicalCommercialPlan = isCanonicalMerchantCommercialFields(merchant)
  if (hasCanonicalCommercialPlan && !existingBeforeClaim) {
    const commercialSession = await consumeAICommerceSession({
      merchantId: merchant.id,
      merchantSessionId: session.id,
    })
    const decision = canUseCommercialFeature(commercialSession.state, 'GENERATIVE_TRY_ON')
    if (!decision.allowed && !commercialSession.alreadyConsumed) {
      throw new StoreDomainError(
        decision.code ?? 'FEATURE_NOT_INCLUDED',
        'Virtual Try-On is temporarily unavailable for this Store.',
        decision.code === 'AI_USAGE_LIMIT_REACHED' ? 429 : 409,
        decision.message,
      )
    }
  }
  let usagePolicy = selectUsagePolicy(
    {
      kind: 'store',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: frame.id,
    },
    entitlement.tryOnOrigin,
  )
  let sponsoredReservationId: string | null = null
  let taskUserId: string | null = null
  let consumerRetentionExpiresAt: Date | undefined
  let entitlementSource: SubmitStoreTryOnResult['entitlementSource'] = 'LEGACY_STORE'

  if (existingBeforeClaim) {
    if (existingMetadata.usagePolicyKind === 'consumer_quota') {
      usagePolicy = { kind: 'consumer_quota' }
      taskUserId = existingBeforeClaim.userId
      entitlementSource = 'CONSUMER_ENTITLEMENT'
    } else if (existingMetadata.usagePolicyKind === 'merchant_sponsored') {
      usagePolicy = { kind: 'merchant_sponsored', merchantId: merchant.id }
      sponsoredReservationId = typeof existingMetadata.sponsoredReservationId === 'string'
        ? existingMetadata.sponsoredReservationId
        : null
      entitlementSource = 'MERCHANT_SPONSORED'
    }
  } else {
    const sponsoredPolicy = resolveMerchantSponsoredUsagePolicy(merchant)
    if (sponsoredPolicy.enabled) {
      if (!input.sponsoredUsage) {
        throw new StoreDomainError(
          'INTERNAL_ERROR',
          'Sponsored usage enforcement is unavailable.',
          500,
        )
      }

      const reservation = await input.sponsoredUsage.reserve({
        merchantId: merchant.id,
        merchantSessionId: session.id,
        experienceId: session.experienceId,
        userId: input.userId ?? null,
        shopperIdentityHash: session.anonymousVisitorId ?? session.capabilityTokenHash,
        usageType: 'SPONSORED_GENERATION',
        limit: sponsoredPolicy.sponsoredGenerationLimit,
        rollingWindowHours: sponsoredPolicy.rollingWindowHours,
        idempotencyKey,
      })

      if (reservation && reservation.status !== 'RELEASED') {
        sponsoredReservationId = reservation.id
        usagePolicy = { kind: 'merchant_sponsored', merchantId: merchant.id }
        entitlementSource = 'MERCHANT_SPONSORED'
      } else {
        if (!input.userId) throw authRequiredForContinuation()
        const user = await prisma.user.findUnique({ where: { id: input.userId } })
        if (!user || !checkUserQuota(user).allowed) {
          throw consumerEntitlementRequired()
        }
        usagePolicy = { kind: 'consumer_quota' }
        taskUserId = input.userId
        consumerRetentionExpiresAt = calculateExpiresAt(user)
        entitlementSource = 'CONSUMER_ENTITLEMENT'
      }
    }
  }

  const claimRenderLimits = usagePolicy.kind === 'consumer_quota'
    ? {
        ...entitlement.renderLimits,
        maxSuccessfulRendersPerMerchant: Number.POSITIVE_INFINITY,
        maxSuccessfulRendersPerSession: Number.POSITIVE_INFINITY,
      }
    : hasCanonicalCommercialPlan && merchant.planCode !== 'FOUNDING_PILOT'
      ? {
          ...entitlement.renderLimits,
          maxSuccessfulRendersPerMerchant: Number.POSITIVE_INFINITY,
          maxSuccessfulRendersPerSession: Number.POSITIVE_INFINITY,
          maxAttemptsPerSession: Number.POSITIVE_INFINITY,
        }
      : entitlement.renderLimits

  let claim: Awaited<ReturnType<typeof claimStoreTryOnSlot>>
  try {
    claim = await claimStoreTryOnSlot({
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: frame.id,
      idempotencyKey,
      clientSubmissionId: input.clientSubmissionId,
      clientIp: input.clientIp,
      renderLimits: claimRenderLimits,
      usageCreatedAt: usagePolicy.kind === 'consumer_quota' ? undefined : usageCreatedAt,
      tryOnOrigin: entitlement.tryOnOrigin,
      batchId: input.batchId,
      maxCompareFrames: experiencePolicy.maxCompareFrames,
      userId: taskUserId,
      expiresAt: usagePolicy.kind === 'consumer_quota' ? consumerRetentionExpiresAt : undefined,
      usagePolicyKind: usagePolicy.kind,
      sponsoredReservationId,
    })
  } catch (error) {
    if (sponsoredReservationId && input.sponsoredUsage) {
      await input.sponsoredUsage.release(sponsoredReservationId).catch(() => undefined)
    }
    throw error
  }

  let shouldDispatch = !claim.reusedExisting
  let dispatchLease = claim.dispatchLease

  if (claim.reusedExisting) {
    const existingTask = await prisma.tryOnTask.findUnique({
      where: { id: claim.taskId },
    })
    const action = resolvePlaceholderReuseAction({
      status: existingTask?.status ?? 'PENDING',
      userImageUrl: existingTask?.userImageUrl ?? 'pending://user',
      metadata: (existingTask?.metadata ?? {}) as Record<string, unknown>,
      dispatchLeaseUntil: existingTask?.dispatchLeaseUntil,
    })

    if (action === 'return_existing' || action === 'wait_inflight') {
      const reused = await input.generation.findExistingByIdempotencyKey(
        idempotencyKey,
        merchant.id,
      )
      return {
        taskId: claim.taskId,
        status:
          reused?.status ??
          (existingTask?.status === TaskStatus.FAILED
            ? 'failed'
            : existingTask?.status === TaskStatus.COMPLETED
              ? 'completed'
              : 'submitted'),
        merchantFrameId: frame.id,
        reusedExisting: true,
        entitlementSource,
        frame: frameDto(frame),
      }
    }

    const takeoverLease = await acquireStoreDispatchTakeover({ taskId: claim.taskId })
    if (!takeoverLease) {
      return {
        taskId: claim.taskId,
        status: 'submitted',
        merchantFrameId: frame.id,
        reusedExisting: true,
        entitlementSource,
        frame: frameDto(frame),
      }
    }
    dispatchLease = takeoverLease
    shouldDispatch = true
  }

  if (!dispatchLease) {
    throw new Error('Store dispatch lease was not acquired')
  }

  if (!shouldDispatch) {
    return {
      taskId: claim.taskId,
      status: 'submitted',
      merchantFrameId: frame.id,
      reusedExisting: true,
      entitlementSource,
      frame: frameDto(frame),
    }
  }

  const config = getTryOnConfig('GLASSES')
  const prompt = `${config.aiPrompt}\n\nMerchant store frame:\n- Use the provided item image as "${frame.name}" (${frame.shape}${frame.color ? `, ${frame.color}` : ''}).\n- Keep the person's face, expression, head size, background, and photo composition unchanged.\n- Do not make medical, prescription, or guaranteed-fit claims in the visual.`

  try {
    await input.events.appendIdempotent({
      eventId: buildStoreEventIdempotencyKey({
        type: 'merchant_tryon_started',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: frame.id,
        clientActionId: input.clientSubmissionId,
      }),
      type: 'merchant_tryon_started',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: frame.id,
      source: 'SERVER',
      locale: input.locale ?? null,
      deviceType: input.deviceType ?? null,
      metadata: experiencePolicyMetadata(experiencePolicy, {
        batchId: input.batchId,
        generatedFrameCount: 1,
        entitlementSource,
      }),
    })

    const submitted = await input.generation.submit({
      actor: {
        kind: 'store',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: frame.id,
      },
      usagePolicy,
      userImage,
      itemImage,
      idempotencyKey,
      clientSubmissionId: input.clientSubmissionId,
      prompt,
      storeOrigin: entitlement.tryOnOrigin,
      userId: taskUserId,
      expiresAt: usagePolicy.kind === 'consumer_quota' ? consumerRetentionExpiresAt : undefined,
      onProviderAccepted: sponsoredReservationId && input.sponsoredUsage
        ? async () => {
            await input.sponsoredUsage!.consume(sponsoredReservationId!)
          }
        : undefined,
      preClaimedTaskId: claim.taskId,
      dispatchLease,
    })

    logger.info('store', 'Store try-on submitted', {
      taskId: submitted.taskId,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: frame.id,
      status: submitted.status,
      reusedExisting: submitted.reusedExisting || claim.reusedExisting,
      usagePolicyKind: usagePolicy.kind,
    })

    return {
      taskId: submitted.taskId,
      status: submitted.status,
      merchantFrameId: frame.id,
      reusedExisting: submitted.reusedExisting || claim.reusedExisting,
      entitlementSource,
      frame: frameDto(frame),
    }
  } catch (error) {
    if (
      sponsoredReservationId &&
      input.sponsoredUsage &&
      sponsoredUsageFailureAction(error) === 'RELEASE'
    ) {
      await input.sponsoredUsage.release(sponsoredReservationId).catch(() => undefined)
    }
    const markedFailed = await markStoreClaimFailed(claim.taskId, dispatchLease, error)
    if (!markedFailed) throw error

    await recordStoreTryOnAttempt({
      usage: input.usage,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      tryOnTaskId: claim.taskId,
      kind: 'RENDER_FAILURE',
    })
    const windowStart = dayWindowStart()
    const failure = await prisma.storeAbuseCounter.upsert({
      where: {
        merchantId_bucket_windowStart: {
          merchantId: merchant.id,
          bucket: 'failure:merchant',
          windowStart,
        },
      },
      create: {
        merchantId: merchant.id,
        bucket: 'failure:merchant',
        windowStart,
        count: 1,
      },
      update: { count: { increment: 1 } },
    })
    try {
      await input.events.appendIdempotent({
        eventId: buildStoreEventIdempotencyKey({
          type: 'merchant_tryon_failed',
          merchantId: merchant.id,
          merchantSessionId: session.id,
          merchantFrameId: frame.id,
          clientActionId: `${input.clientSubmissionId}:fail`,
        }),
        type: 'merchant_tryon_failed',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: frame.id,
        source: 'SERVER',
        locale: input.locale ?? null,
        deviceType: input.deviceType ?? null,
        metadata: experiencePolicyMetadata(experiencePolicy, { generatedFrameCount: 1 }),
      })
    } catch {
      // Event write is best-effort after failure marking.
    }
    if (failure.count >= DEFAULT_STORE_ABUSE_LIMITS.maxFailuresPerMerchantPerDay) {
      throw new StoreDomainError(
        'ALLOWANCE_EXCEEDED',
        'Merchant daily try-on failure limit reached.',
        429,
        `retry_after=${retryAfterSeconds(windowStart, 86400_000)}`,
      )
    }
    throw error
  }
}

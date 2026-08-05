import { getTryOnConfig } from '@/config/try-on-types'
import { Prisma, TaskStatus, TryOnType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_STORE_DEMO_LIMITS,
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  buildStoreGenerationIdempotencyKey,
  evaluateStoreDemoAllowance,
  merchantInactive,
  merchantNotFound,
  selectUsagePolicy,
} from '../domain'
import type { AssetStore } from './ports/asset-store'
import type { StoreGenerationPort } from './ports/generation'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
  StoreUsageRepository,
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

export type SubmitStoreTryOnInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  assets: AssetStore
  generation: StoreGenerationPort
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  merchantFrameId: string
  batchId: string
  clientSubmissionId: string
  locale?: string | null
  deviceType?: string | null
  clientIp?: string | null
}

export type SubmitStoreTryOnResult = {
  taskId: string
  status: string
  merchantFrameId: string
  reusedExisting: boolean
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
}): Promise<{ taskId: string; reusedExisting: boolean }> {
  const maxAttempts = 3
  const abuseWindow = dayWindowStart()
  const ip = input.clientIp || 'unknown'

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
            return { taskId: existing.id, reusedExisting: true }
          }

          const [merchantSuccessfulRenders, sessionSuccessfulRenders, sessionAttempts] =
            await Promise.all([
              tx.merchantUsageLedger.count({
                where: { merchantId: input.merchantId, kind: 'RENDER_SUCCESS' },
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

          const allowance = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
            merchantSuccessfulRenders,
            sessionSuccessfulRenders,
            sessionAttempts,
          })
          if (!allowance.allowed) {
            throw new StoreDomainError('ALLOWANCE_EXCEEDED', allowance.reason, 429)
          }

          // Merchant + IP attempt abuse — only counted when claiming a new generation.
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
              userId: null,
              type: TryOnType.GLASSES,
              userImageUrl: 'pending://user',
              itemImageUrl: 'pending://item',
              status: TaskStatus.PENDING,
              origin: 'STORE_DEMO',
              merchantId: input.merchantId,
              merchantSessionId: input.merchantSessionId,
              merchantFrameId: input.merchantFrameId,
              idempotencyKey: input.idempotencyKey,
              clientSubmissionId: input.clientSubmissionId,
              expiresAt: input.expiresAt ?? computeStoreAssetExpiresAt(),
              retentionStatus: 'ACTIVE',
              metadata: {
                source: 'store',
                claimFirst: true,
                atomicClaim: true,
              },
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

          return { taskId: task.id, reusedExisting: false }
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
        if (raced) return { taskId: raced.id, reusedExisting: true }
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

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })
  assertSameMerchantTenant(merchant.id, session.merchantId, 'session')

  const frame = await input.frames.findActiveByMerchantAndId(
    merchant.id,
    input.merchantFrameId,
  )
  if (!frame) {
    throw new StoreDomainError('FRAME_INACTIVE', 'This frame is no longer available.', 409)
  }
  assertSameMerchantTenant(merchant.id, frame.merchantId, 'frame')

  // Validate generation prerequisites BEFORE burning attempt / abuse budget.
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

  const idempotencyKey = buildStoreGenerationIdempotencyKey({
    merchantSessionId: session.id,
    merchantFrameId: frame.id,
    clientSubmissionId: input.clientSubmissionId,
  })

  const claim = await claimStoreTryOnSlot({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    merchantFrameId: frame.id,
    idempotencyKey,
    clientSubmissionId: input.clientSubmissionId,
    clientIp: input.clientIp,
  })

  if (claim.reusedExisting) {
    const reused = await input.generation.findExistingByIdempotencyKey(
      idempotencyKey,
      merchant.id,
    )
    return {
      taskId: claim.taskId,
      status: reused?.status ?? 'submitted',
      merchantFrameId: frame.id,
      reusedExisting: true,
      frame: frameDto(frame),
    }
  }

  const usagePolicy = selectUsagePolicy(
    {
      kind: 'store',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: frame.id,
    },
    'STORE_DEMO',
  )

  const userImage = new File([new Uint8Array(photoBytes.body)], `shopper-${session.id}.jpg`, {
    type: photoBytes.contentType || 'image/jpeg',
  })
  const itemImage = await fetchImageAsFile(frameImageUrl, `frame-${frame.id}.jpg`)

  const config = getTryOnConfig('GLASSES')
  const prompt = `${config.aiPrompt}

Merchant store frame:
- Use the provided item image as "${frame.name}" (${frame.shape}${frame.color ? `, ${frame.color}` : ''}).
- Keep the person's face, expression, head size, background, and photo composition unchanged.
- Do not make medical, prescription, or guaranteed-fit claims in the visual.`

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
    metadata: { batchId: input.batchId },
  })

  try {
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
      preClaimedTaskId: claim.taskId,
    })

    return {
      taskId: submitted.taskId,
      status: submitted.status,
      merchantFrameId: frame.id,
      reusedExisting: submitted.reusedExisting,
      frame: frameDto(frame),
    }
  } catch (error) {
    await recordStoreTryOnAttempt({
      usage: input.usage,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      tryOnTaskId: claim.taskId,
      kind: 'RENDER_FAILURE',
    })
    // Failure budget must block subsequent dispatch.
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
    })
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

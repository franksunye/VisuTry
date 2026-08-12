import {
  buildStoreEventIdempotencyKey,
  merchantInactive,
  merchantNotFound,
  experienceContainsFrame,
  selectUsagePolicy,
  sessionUnauthorized,
} from '../domain'
import type { StoreGenerationPort } from './ports/generation'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
  StoreUsageRepository,
  ExperienceRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'
import { settleStoreTryOnUsage } from './settle-store-usage'
import { settleTryOnTaskQuota } from '@/lib/quota'
import { buildStoreTryOnResultDeliveryUrl } from './store-result-delivery'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { experiencePolicyMetadata, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import { StoreDomainError } from '../domain/errors'

export type PollStoreTryOnInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  generation: StoreGenerationPort
  experiences?: ExperienceRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  taskId: string
  locale?: string | null
  deviceType?: string | null
}

export type PollStoreTryOnResult = {
  taskId: string
  status: string
  resultImageUrl: string | null
  errorMessage: string | null
  merchantFrameId: string | null
  frame: {
    id: string
    name: string
    imageUrl: string | null
    productUrl: string | null
    price: number | null
    currency: string | null
    shape: string
  } | null
}

export async function pollStoreFrameTryOn(
  input: PollStoreTryOnInput,
): Promise<PollStoreTryOnResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const owned = await prisma.tryOnTask.findFirst({
    where: {
      id: input.taskId,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
    },
    select: {
      id: true,
      merchantFrameId: true,
      origin: true,
      userId: true,
      metadata: true,
    },
  })
  if (!owned) {
    throw sessionUnauthorized()
  }
  if (session.experienceId && input.experiences) {
    const experience = await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    if (!experience || !owned.merchantFrameId || !experienceContainsFrame(experience, owned.merchantFrameId)) {
      throw sessionUnauthorized()
    }
  }

  const status = await input.generation.getStatus(input.taskId, merchant.id)
  const taskMetadata = (owned.metadata ?? {}) as Record<string, unknown>
  const usagePolicyKind = taskMetadata.usagePolicyKind

  if (status.status === 'COMPLETED' && owned.merchantFrameId) {
    const usagePolicy = usagePolicyKind === 'merchant_sponsored'
      ? { kind: 'merchant_sponsored' as const, merchantId: merchant.id }
      : usagePolicyKind === 'consumer_quota'
        ? { kind: 'consumer_quota' as const }
        : selectUsagePolicy(
            {
              kind: 'store',
              merchantId: merchant.id,
              merchantSessionId: session.id,
              merchantFrameId: owned.merchantFrameId,
            },
            owned.origin === 'STORE_PILOT' ? 'STORE_PILOT' : 'STORE_DEMO',
          )
    if (usagePolicy.kind === 'consumer_quota' && !owned.userId) {
      throw new StoreDomainError(
        'INTERNAL_ERROR',
        'Consumer entitlement task is missing its user.',
        500,
      )
    }
    const settlement = usagePolicy.kind === 'consumer_quota'
      ? await settleTryOnTaskQuota(input.taskId, owned.userId!, {
          merchantId: merchant.id,
          merchantSessionId: session.id,
        })
      : await settleStoreTryOnUsage({
          taskId: input.taskId,
          merchantId: merchant.id,
          merchantSessionId: session.id,
          usagePolicy,
          usage: input.usage,
        })
    const completedEvent = await input.events.appendIdempotent({
      eventId: buildStoreEventIdempotencyKey({
        type: 'merchant_tryon_completed',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: owned.merchantFrameId,
        tryOnTaskId: input.taskId,
      }),
      type: 'merchant_tryon_completed',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: owned.merchantFrameId,
      tryOnTaskId: input.taskId,
      source: 'SERVER',
      locale: input.locale ?? null,
      deviceType: input.deviceType ?? null,
      metadata: experiencePolicyMetadata(experiencePolicy, {
        generatedFrameCount: 1,
        entitlementSource:
          usagePolicy.kind === 'merchant_sponsored'
            ? 'MERCHANT_SPONSORED'
            : usagePolicy.kind === 'consumer_quota'
              ? 'CONSUMER_ENTITLEMENT'
              : 'LEGACY_STORE',
      }),
    })
    if (completedEvent.created || settlement.settled) {
      logger.info('store', 'Store try-on completed', {
        taskId: input.taskId,
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: owned.merchantFrameId,
        origin: owned.origin,
        usageSettled: settlement.settled,
        eventCreated: completedEvent.created,
      })
    }
  }

  if (status.status === 'FAILED' && owned.merchantFrameId) {
    const failedEvent = await input.events.appendIdempotent({
      eventId: buildStoreEventIdempotencyKey({
        type: 'merchant_tryon_failed',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: owned.merchantFrameId,
        tryOnTaskId: input.taskId,
      }),
      type: 'merchant_tryon_failed',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      merchantFrameId: owned.merchantFrameId,
      tryOnTaskId: input.taskId,
      source: 'SERVER',
      locale: input.locale ?? null,
      deviceType: input.deviceType ?? null,
      metadata: experiencePolicyMetadata(experiencePolicy, {
        generatedFrameCount: 1,
        entitlementSource:
          usagePolicyKind === 'merchant_sponsored'
            ? 'MERCHANT_SPONSORED'
            : usagePolicyKind === 'consumer_quota'
              ? 'CONSUMER_ENTITLEMENT'
              : 'LEGACY_STORE',
      }),
    })
    if (failedEvent.created) {
      logger.warn('store', 'Store try-on failed', {
        taskId: input.taskId,
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: owned.merchantFrameId,
        origin: owned.origin,
        errorMessage: status.errorMessage ?? null,
      })
    }
  } else if (status.status !== 'COMPLETED') {
    logger.debug('store', 'Store try-on poll status', {
      taskId: input.taskId,
      merchantId: merchant.id,
      status: status.status,
    })
  }

  let frameDto: PollStoreTryOnResult['frame'] = null
  if (owned.merchantFrameId) {
    const frame = await input.frames.findByMerchantAndId(merchant.id, owned.merchantFrameId)
    if (frame) {
      frameDto = {
        id: frame.id,
        name: frame.name,
        imageUrl: frame.imageUrl,
        productUrl: frame.productUrl,
        price: frame.price,
        currency: frame.currency,
        shape: frame.shape,
      }
    }
  }

  return {
    taskId: status.taskId,
    status: status.status,
    resultImageUrl:
      status.status === 'COMPLETED'
        ? buildStoreTryOnResultDeliveryUrl({
            taskId: status.taskId,
            merchantSlug: merchant.slug,
            merchantSessionId: session.id,
          })
        : null,
    errorMessage: status.errorMessage ?? null,
    merchantFrameId: owned.merchantFrameId,
    frame: frameDto,
  }
}

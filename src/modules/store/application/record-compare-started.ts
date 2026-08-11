import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  experienceContainsFrame,
  merchantInactive,
  merchantNotFound,
} from '../domain'
import { experiencePolicyMetadata, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
  ExperienceRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export async function recordCompareStarted(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  experiences?: ExperienceRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  clientActionId: string
  locale?: string | null
  deviceType?: string | null
  frameIds?: string[]
}): Promise<{ recorded: boolean }> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)
  if (!experiencePolicy.compareEnabled) {
    throw new StoreDomainError(
      'CAPABILITY_DISABLED',
      'Compare is not enabled for this store.',
      403,
    )
  }

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })
  const experience = session.experienceId && input.experiences
    ? await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    : null

  const completedTryOns = await prisma.tryOnTask.count({
    where: {
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: 'COMPLETED',
    },
  })

  const selectedFrameIds = Array.from(new Set((input.frameIds ?? []).filter(Boolean)))
  if (experience && selectedFrameIds.some((frameId) => !experienceContainsFrame(experience, frameId))) {
    throw new StoreDomainError('FRAME_INACTIVE', 'This frame is not part of the current experience.', 409)
  }
  const selectedFrameCount = selectedFrameIds.length || completedTryOns
  if (selectedFrameCount > experiencePolicy.maxCompareFrames) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      `Compare supports up to ${experiencePolicy.maxCompareFrames} frames for this store.`,
      400,
    )
  }
  if (selectedFrameIds.length > 0) {
    const completedSelected = await prisma.tryOnTask.count({
      where: {
        merchantId: merchant.id,
        merchantSessionId: input.merchantSessionId,
        merchantFrameId: { in: selectedFrameIds },
        origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
        status: 'COMPLETED',
      },
    })
    if (completedSelected !== selectedFrameIds.length) {
      throw new StoreDomainError(
        'VALIDATION_ERROR',
        'Compare requires completed results for the selected frames.',
        400,
      )
    }
  }
  if (selectedFrameCount < 2) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      'Compare requires at least two completed try-on results.',
      400,
    )
  }

  const result = await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_compare_started',
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      clientActionId: input.clientActionId,
    }),
    type: 'merchant_compare_started',
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: experiencePolicyMetadata(experiencePolicy, {
      completedTryOns,
      selectedFrameCount,
    }),
  })

  if (result.created) {
    logger.info('store', 'Store compare started', {
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      completedTryOns,
    })
  }

  return { recorded: result.created }
}

import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildIntentIdempotencyKey,
  buildStoreEventIdempotencyKey,
  experienceContainsFrame,
  isHttpOrHttpsUrl,
  merchantInactive,
  merchantNotFound,
  type MerchantIntentType,
} from '../domain'
import { experiencePolicyMetadata, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantIntentRepository,
  MerchantRepository,
  MerchantSessionRepository,
  ExperienceRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'
import { assertSameMerchantTenant } from './tenant-guards'

const EVENT_BY_INTENT: Record<
  MerchantIntentType,
  'merchant_favorite_saved' | 'merchant_product_clicked' | 'merchant_inquiry_submitted'
> = {
  FAVORITE: 'merchant_favorite_saved',
  PRODUCT_CLICK: 'merchant_product_clicked',
  INQUIRY: 'merchant_inquiry_submitted',
}

export type RecordStoreIntentInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  intents: MerchantIntentRepository
  events: MerchantEventRepository
  experiences?: ExperienceRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  type: MerchantIntentType
  merchantFrameId?: string | null
  clientActionId: string
  email?: string | null
  name?: string | null
  note?: string | null
  /** Ignored for PRODUCT_CLICK — server resolves canonical frame.productUrl. */
  productUrl?: string | null
  locale?: string | null
  deviceType?: string | null
}

export type RecordStoreIntentResult = {
  intentId: string
  type: MerchantIntentType
  created: boolean
  productUrl?: string | null
}

export async function recordStoreIntent(
  input: RecordStoreIntentInput,
): Promise<RecordStoreIntentResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)
  if (input.type === 'INQUIRY' && !experiencePolicy.inquiryEnabled) {
    throw new StoreDomainError(
      'CAPABILITY_DISABLED',
      'Inquiry is not enabled for this store.',
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

  let canonicalProductUrl: string | null = null
  let resolvedFrameId = input.merchantFrameId ?? null

  if (input.type === 'PRODUCT_CLICK') {
    if (!input.merchantFrameId) {
      throw new StoreDomainError(
        'VALIDATION_ERROR',
        'A frame is required for product clicks.',
        400,
      )
    }
    const frame = await input.frames.findByMerchantAndId(merchant.id, input.merchantFrameId)
    if (!frame) {
      throw new StoreDomainError('FRAME_NOT_FOUND', 'Frame not found.', 404)
    }
    assertSameMerchantTenant(merchant.id, frame.merchantId, 'frame')
    if (!frame.productUrl || !isHttpOrHttpsUrl(frame.productUrl)) {
      throw new StoreDomainError(
        'VALIDATION_ERROR',
        'This frame has no product URL.',
        400,
      )
    }
    canonicalProductUrl = frame.productUrl
    resolvedFrameId = frame.id
  } else if (input.merchantFrameId) {
    const frame = await input.frames.findByMerchantAndId(merchant.id, input.merchantFrameId)
    if (!frame) {
      throw new StoreDomainError('FRAME_NOT_FOUND', 'Frame not found.', 404)
    }
    assertSameMerchantTenant(merchant.id, frame.merchantId, 'frame')
  }

  if (input.type === 'INQUIRY') {
    const email = (input.email ?? '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new StoreDomainError('VALIDATION_ERROR', 'A valid email is required for inquiries.', 400)
    }
  }

  if (experience && resolvedFrameId && !experienceContainsFrame(experience, resolvedFrameId)) {
    throw new StoreDomainError('FRAME_INACTIVE', 'This frame is not part of the current experience.', 409)
  }

  const idempotencyKey = buildIntentIdempotencyKey({
    type: input.type,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: resolvedFrameId,
    clientActionId: input.clientActionId,
  })

  const { record, created } = await input.intents.createIdempotent({
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: resolvedFrameId,
    type: input.type,
    idempotencyKey,
    email: input.type === 'INQUIRY' ? input.email ?? null : null,
    name: input.type === 'INQUIRY' ? input.name ?? null : null,
    note: input.type === 'INQUIRY' ? input.note ?? null : null,
  })

  const eventType = EVENT_BY_INTENT[input.type]
  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: eventType,
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      merchantFrameId: resolvedFrameId,
      clientActionId: input.clientActionId,
    }),
    type: eventType,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: resolvedFrameId,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: {
      intentId: record.id,
      created,
      ...experiencePolicyMetadata(experiencePolicy),
      ...(input.type === 'PRODUCT_CLICK' ? { productUrl: canonicalProductUrl } : {}),
    },
  })

  await input.sessions.touch(merchant.id, input.merchantSessionId, new Date())

  if (created) {
    logger.info('store', 'Store intent recorded', {
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      intentId: record.id,
      type: record.type,
      merchantFrameId: resolvedFrameId,
    })
  } else {
    logger.debug('store', 'Store intent idempotent reuse', {
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      intentId: record.id,
      type: record.type,
    })
  }

  return {
    intentId: record.id,
    type: record.type,
    created,
    productUrl: input.type === 'PRODUCT_CLICK' ? canonicalProductUrl : null,
  }
}

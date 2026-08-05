import {
  StoreDomainError,
  buildIntentIdempotencyKey,
  buildStoreEventIdempotencyKey,
  isHttpOrHttpsUrl,
  merchantInactive,
  merchantNotFound,
  type MerchantIntentType,
} from '../domain'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantIntentRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

const EVENT_BY_INTENT: Record<MerchantIntentType, 'merchant_favorite_saved' | 'merchant_product_clicked' | 'merchant_inquiry_submitted'> = {
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
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  type: MerchantIntentType
  merchantFrameId?: string | null
  clientActionId: string
  email?: string | null
  name?: string | null
  note?: string | null
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

  await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  if (input.merchantFrameId) {
    const frame = await input.frames.findByMerchantAndId(merchant.id, input.merchantFrameId)
    if (!frame) {
      throw new StoreDomainError('FRAME_NOT_FOUND', 'Frame not found.', 404)
    }
  }

  if (input.type === 'INQUIRY') {
    const email = (input.email ?? '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new StoreDomainError('VALIDATION_ERROR', 'A valid email is required for inquiries.', 400)
    }
  }

  if (input.type === 'PRODUCT_CLICK' && input.productUrl && !isHttpOrHttpsUrl(input.productUrl)) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Product URL must be http or https.', 400)
  }

  const idempotencyKey = buildIntentIdempotencyKey({
    type: input.type,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: input.merchantFrameId,
    clientActionId: input.clientActionId,
  })

  const { record, created } = await input.intents.createIdempotent({
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: input.merchantFrameId ?? null,
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
      merchantFrameId: input.merchantFrameId,
      clientActionId: input.clientActionId,
    }),
    type: eventType,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    merchantFrameId: input.merchantFrameId ?? null,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: {
      intentId: record.id,
      created,
    },
  })

  await input.sessions.touch(merchant.id, input.merchantSessionId, new Date())

  return {
    intentId: record.id,
    type: record.type,
    created,
    productUrl: input.type === 'PRODUCT_CLICK' ? input.productUrl ?? null : null,
  }
}

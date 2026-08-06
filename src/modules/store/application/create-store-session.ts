import { logger } from '@/lib/logger'
import {
  buildStoreEventIdempotencyKey,
  createMerchantSessionCapability,
  computeSessionExpiresAt,
  merchantInactive,
  merchantNotFound,
} from '../domain'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
  StoreUsageRepository,
} from './ports/repositories'

export type CreateStoreSessionResult = {
  merchantId: string
  merchantSessionId: string
  expiresAt: string
  /** Opaque capability — set as HttpOnly cookie; never persist client-side beyond cookie. */
  capabilityToken: string
}

export async function createStoreSession(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  slug: string
  locale?: string | null
  anonymousVisitorId?: string | null
  deviceType?: string | null
}): Promise<CreateStoreSessionResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const capability = createMerchantSessionCapability()
  const expiresAt = computeSessionExpiresAt()

  const session = await input.sessions.create({
    merchantId: merchant.id,
    capabilityTokenHash: capability.tokenHash,
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    locale: input.locale ?? null,
    expiresAt,
  })

  await input.usage.record({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    kind: 'SESSION',
  })

  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_page_viewed',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      clientActionId: `session-create:${session.id}`,
    }),
    type: 'merchant_page_viewed',
    merchantId: merchant.id,
    merchantSessionId: session.id,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
  })

  logger.info('store', 'Store session created', {
    merchantId: merchant.id,
    merchantSlug: input.slug,
    merchantSessionId: session.id,
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
  })

  return {
    merchantId: merchant.id,
    merchantSessionId: session.id,
    expiresAt: expiresAt.toISOString(),
    capabilityToken: capability.token,
  }
}

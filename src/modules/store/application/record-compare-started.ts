import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  merchantInactive,
  merchantNotFound,
} from '../domain'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export async function recordCompareStarted(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  clientActionId: string
  locale?: string | null
  deviceType?: string | null
}): Promise<{ recorded: boolean }> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const completedTryOns = await prisma.tryOnTask.count({
    where: {
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: 'COMPLETED',
    },
  })

  if (completedTryOns < 2) {
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
    metadata: { completedTryOns },
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

import {
  buildStoreEventIdempotencyKey,
  merchantInactive,
  merchantNotFound,
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
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'
import { settleStoreTryOnUsage } from './settle-store-usage'
import { prisma } from '@/lib/prisma'

export type PollStoreTryOnInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  generation: StoreGenerationPort
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
    },
  })
  if (!owned) {
    throw sessionUnauthorized()
  }

  const status = await input.generation.getStatus(input.taskId, merchant.id)

  if (status.status === 'COMPLETED' && owned.merchantFrameId) {
    const usagePolicy = selectUsagePolicy(
      {
        kind: 'store',
        merchantId: merchant.id,
        merchantSessionId: session.id,
        merchantFrameId: owned.merchantFrameId,
      },
      owned.origin === 'STORE_PILOT' ? 'STORE_PILOT' : 'STORE_DEMO',
    )
    await settleStoreTryOnUsage({
      taskId: input.taskId,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      usagePolicy,
      usage: input.usage,
    })
    await input.events.appendIdempotent({
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
    })
  }

  if (status.status === 'FAILED' && owned.merchantFrameId) {
    await input.events.appendIdempotent({
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
    resultImageUrl: status.resultImageUrl ?? null,
    errorMessage: status.errorMessage ?? null,
    merchantFrameId: owned.merchantFrameId,
    frame: frameDto,
  }
}

import { getTryOnConfig } from '@/config/try-on-types'
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

  const idempotencyKey = buildStoreGenerationIdempotencyKey({
    merchantSessionId: session.id,
    merchantFrameId: frame.id,
    clientSubmissionId: input.clientSubmissionId,
  })

  // Resolve idempotency before downloads, events, or attempt ledger writes.
  const existing = await input.generation.findExistingByIdempotencyKey(
    idempotencyKey,
    merchant.id,
  )
  if (existing) {
    return {
      taskId: existing.taskId,
      status: existing.status,
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

  const limits = DEFAULT_STORE_DEMO_LIMITS
  const snapshot = {
    merchantSuccessfulRenders: await input.usage.countSuccessfulRenders(merchant.id),
    sessionSuccessfulRenders: await input.usage.countSessionSuccessfulRenders(
      merchant.id,
      session.id,
    ),
    sessionAttempts: await input.usage.countSessionAttempts(merchant.id, session.id),
  }
  const allowance = evaluateStoreDemoAllowance(limits, snapshot)
  if (!allowance.allowed) {
    throw new StoreDomainError('ALLOWANCE_EXCEEDED', allowance.reason, 429)
  }

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

  await recordStoreTryOnAttempt({
    usage: input.usage,
    merchantId: merchant.id,
    merchantSessionId: session.id,
    kind: 'RENDER_ATTEMPT',
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
      kind: 'RENDER_FAILURE',
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
    throw error
  }
}

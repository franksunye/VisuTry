import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  mapGeometryToShopperSignals,
  merchantInactive,
  merchantNotFound,
  rankMerchantFrames,
  type ShopperAnalysisSignals,
} from '../domain'
import type {
  MerchantEventRepository,
  MerchantFrameRecord,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export type RecommendFramesInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  signals: {
    measuredShape?: string | null
    faceAspectRatio?: number | null
    styleHints?: string[] | null
  }
  locale?: string | null
  deviceType?: string | null
  limit?: number
  clientActionId?: string | null
}

export type RecommendedFrameDto = {
  id: string
  name: string
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
  styleTags: string[]
  score: number
  reason: string
}

export type RecommendFramesResult = {
  rankingVersion: string
  signalsUsed: ShopperAnalysisSignals
  frames: RecommendedFrameDto[]
}

export async function recommendMerchantFrames(
  input: RecommendFramesInput,
): Promise<RecommendFramesResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const actionId = input.clientActionId ?? `recommend:${input.merchantSessionId}`

  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_recommendation_started',
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      clientActionId: `${actionId}:start`,
    }),
    type: 'merchant_recommendation_started',
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
  })

  const signals = mapGeometryToShopperSignals(input.signals)
  const activeFrames = await input.frames.findActiveByMerchant(merchant.id)

  if (activeFrames.length === 0) {
    throw new StoreDomainError(
      'FRAME_INACTIVE',
      'No frames are available in this store yet.',
      409,
    )
  }

  const ranking = rankMerchantFrames(
    activeFrames.map(toRankable),
    signals,
    { merchantId: merchant.id, limit: input.limit ?? 6 },
  )

  const byId = new Map(activeFrames.map((frame) => [frame.id, frame]))
  const frames: RecommendedFrameDto[] = ranking.frames.flatMap((ranked) => {
    const frame = byId.get(ranked.frameId)
    if (!frame) return []
    return [
      {
        id: frame.id,
        name: frame.name,
        imageUrl: frame.imageUrl,
        productUrl: frame.productUrl,
        price: frame.price,
        currency: frame.currency,
        shape: frame.shape,
        material: frame.material,
        color: frame.color,
        widthClass: frame.widthClass,
        styleTags: frame.styleTags,
        score: ranked.score,
        reason: ranked.reason,
      },
    ]
  })

  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_recommendation_completed',
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      clientActionId: `${actionId}:done`,
    }),
    type: 'merchant_recommendation_completed',
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: {
      rankingVersion: ranking.rankingVersion,
      resultCount: frames.length,
      topMatchScore: frames.length > 0 ? Math.min(99, Math.round(frames[0].score)) : null,
      averageMatchScore:
        frames.length > 0
          ? Math.min(
              99,
              Math.round(frames.reduce((sum, frame) => sum + frame.score, 0) / frames.length),
            )
          : null,
      faceShape: signals.faceShape ?? null,
      preferredWidthClass: signals.preferredWidthClass ?? null,
    },
  })

  await input.sessions.touch(merchant.id, input.merchantSessionId, new Date())

  return {
    rankingVersion: ranking.rankingVersion,
    signalsUsed: signals,
    frames,
  }
}

function toRankable(frame: MerchantFrameRecord) {
  return {
    id: frame.id,
    merchantId: frame.merchantId,
    name: frame.name,
    shape: frame.shape,
    material: frame.material,
    color: frame.color,
    widthClass: frame.widthClass,
    styleTags: frame.styleTags,
  }
}

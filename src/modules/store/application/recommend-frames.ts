import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  mapGeometryToShopperSignals,
  merchantInactive,
  merchantNotFound,
  rankMerchantFrames,
  geometryQualityBand,
  shopperSignalCount,
  type GeometrySignalInput,
  type ShopperAnalysisSignals,
} from '../domain'
import type {
  MerchantEventRepository,
  MerchantFrameRecord,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
  ExperienceRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'
import { productBrandForFrame } from './product-labels'
import { isMerchantFrameRecommendationReady } from '@/modules/merchant/domain/merchant-frame-readiness'
import {
  canUseCommercialFeature,
  resolveMerchantCommercialPeriod,
  resolveMerchantCommercialState,
} from '../domain/merchant-commercial-state'
import { getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import type { StoreUsageRepository } from './ports/repositories'

export type RecommendFramesInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  experiences?: ExperienceRepository
  events: MerchantEventRepository
  usage?: StoreUsageRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  signals: GeometrySignalInput
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
  productBrand: string | null
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

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  if (input.usage?.countAICommerceSessions && input.usage.consumeAICommerceSession) {
    const plan = getMerchantPlanDefinition(merchant.planCode)
    const period = resolveMerchantCommercialPeriod(merchant)
    const used = await input.usage.countAICommerceSessions({
      merchantId: merchant.id,
      periodStart: period.start,
      periodEnd: period.end,
    })
    const state = resolveMerchantCommercialState(merchant, { aiCommerceSessions: used })
    const decision = canUseCommercialFeature(state, 'RECOMMENDATION')
    if (!decision.allowed) {
      throw new StoreDomainError(decision.code ?? 'FEATURE_NOT_INCLUDED', decision.message, 409)
    }
    if (plan.aiCommerceSessions !== null) {
      await input.usage.consumeAICommerceSession({
        merchantId: merchant.id,
        merchantSessionId: session.id,
        periodStart: period.start,
        periodEnd: period.end,
        limit: plan.aiCommerceSessions,
      })
    }
  }

  const experience = session.experienceId && input.experiences
    ? await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    : null

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
    experienceId: session.experienceId,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
  })

  const signals = mapGeometryToShopperSignals(input.signals)
  const activeFrames = experience && input.frames.findActiveByMerchantAndExperience
    ? await input.frames.findActiveByMerchantAndExperience(merchant.id, experience)
    : await input.frames.findActiveByMerchant(merchant.id)

  const recommendationFrames = activeFrames.filter(isMerchantFrameRecommendationReady)

  if (recommendationFrames.length === 0) {
    throw new StoreDomainError(
      'FRAME_INACTIVE',
      'No recommendation-ready frames are available in this store yet.',
      409,
    )
  }

  const ranking = rankMerchantFrames(
    recommendationFrames.map(toRankable),
    signals,
    { merchantId: merchant.id, limit: input.limit ?? 6 },
  )

  const byId = new Map(recommendationFrames.map((frame) => [frame.id, frame]))
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
        productBrand: productBrandForFrame(frame),
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
      primaryFaceShape: signals.faceShape ?? null,
      preferredWidthClass: signals.preferredWidthClass ?? null,
      geometryQualityBand: geometryQualityBand(signals),
      signalCount: shopperSignalCount(signals),
      usedAlternativeShape: ranking.frames[0]?.usedAlternativeShape ?? false,
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

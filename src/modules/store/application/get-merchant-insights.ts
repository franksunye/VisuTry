import { prisma } from '@/lib/prisma'
import {
  assertNoShopperImageInInsightPayload,
  buildStoreEventIdempotencyKey,
  merchantNotFound,
} from '../domain'
import type { MerchantEventRepository, MerchantRepository } from './ports/repositories'

export type MerchantInsightsDto = {
  merchant: {
    id: string
    slug: string
    name: string
    status: string
  }
  metrics: {
    sessions: number
    photosUploaded: number
    recommendations: number
    tryOns: number
    tryOnFailures: number
    compareStarts: number
    favorites: number
    productClicks: number
    inquiries: number
  }
  topFrames: Array<{
    frameId: string
    name: string
    shape: string
    imageUrl: string | null
    recommendations: number
    tryOns: number
    favorites: number
    productClicks: number
  }>
  recentSessions: Array<{
    sessionId: string
    shortLabel: string
    createdAt: string
    status: string
    recommendedCount: number
    triedCount: number
    compared: boolean
    favorited: boolean
    productClicked: boolean
    inquired: boolean
  }>
}

export async function getMerchantInsights(input: {
  merchants: MerchantRepository
  events: MerchantEventRepository
  merchantId: string
  recordInsightsViewed?: boolean
}): Promise<MerchantInsightsDto> {
  const merchant = await input.merchants.findById(input.merchantId)
  if (!merchant) throw merchantNotFound()

  const [
    sessions,
    photosUploaded,
    recommendations,
    tryOns,
    tryOnFailures,
    compareStarts,
    favorites,
    productClicks,
    inquiries,
    frames,
    recentSessionRows,
    eventRows,
    intentRows,
  ] = await Promise.all([
    prisma.merchantSession.count({ where: { merchantId: input.merchantId } }),
    prisma.merchantEvent.count({
      where: { merchantId: input.merchantId, type: 'merchant_photo_uploaded' },
    }),
    prisma.merchantEvent.count({
      where: { merchantId: input.merchantId, type: 'merchant_recommendation_completed' },
    }),
    prisma.merchantEvent.count({
      where: { merchantId: input.merchantId, type: 'merchant_tryon_completed' },
    }),
    prisma.merchantEvent.count({
      where: { merchantId: input.merchantId, type: 'merchant_tryon_failed' },
    }),
    prisma.merchantEvent.count({
      where: { merchantId: input.merchantId, type: 'merchant_compare_started' },
    }),
    prisma.merchantIntent.count({
      where: { merchantId: input.merchantId, type: 'FAVORITE' },
    }),
    prisma.merchantIntent.count({
      where: { merchantId: input.merchantId, type: 'PRODUCT_CLICK' },
    }),
    prisma.merchantIntent.count({
      where: { merchantId: input.merchantId, type: 'INQUIRY' },
    }),
    prisma.merchantFrame.findMany({
      where: { merchantId: input.merchantId },
      select: { id: true, name: true, shape: true, imageUrl: true },
    }),
    prisma.merchantSession.findMany({
      where: { merchantId: input.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    }),
    prisma.merchantEvent.findMany({
      where: { merchantId: input.merchantId },
      select: {
        type: true,
        merchantSessionId: true,
        merchantFrameId: true,
      },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.merchantIntent.findMany({
      where: { merchantId: input.merchantId },
      select: {
        type: true,
        merchantSessionId: true,
        merchantFrameId: true,
      },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const frameStats = new Map<
    string,
    { recommendations: number; tryOns: number; favorites: number; productClicks: number }
  >()

  const bump = (
    frameId: string | null | undefined,
    key: 'recommendations' | 'tryOns' | 'favorites' | 'productClicks',
  ) => {
    if (!frameId) return
    const current = frameStats.get(frameId) ?? {
      recommendations: 0,
      tryOns: 0,
      favorites: 0,
      productClicks: 0,
    }
    current[key] += 1
    frameStats.set(frameId, current)
  }

  for (const event of eventRows) {
    if (event.type === 'merchant_frame_selected') bump(event.merchantFrameId, 'recommendations')
    if (event.type === 'merchant_tryon_completed') bump(event.merchantFrameId, 'tryOns')
  }
  for (const intent of intentRows) {
    if (intent.type === 'FAVORITE') bump(intent.merchantFrameId, 'favorites')
    if (intent.type === 'PRODUCT_CLICK') bump(intent.merchantFrameId, 'productClicks')
  }

  const frameById = new Map(frames.map((frame) => [frame.id, frame]))
  const topFrames = Array.from(frameStats.entries())
    .map(([frameId, stats]) => {
      const frame = frameById.get(frameId)
      return {
        frameId,
        name: frame?.name ?? 'Unknown frame',
        shape: frame?.shape ?? '',
        // Product catalog image is merchant-owned, not a shopper photo.
        imageUrl: frame?.imageUrl ?? null,
        ...stats,
      }
    })
    .sort((a, b) => {
      const scoreA = a.tryOns * 4 + a.favorites * 3 + a.productClicks * 3 + a.recommendations
      const scoreB = b.tryOns * 4 + b.favorites * 3 + b.productClicks * 3 + b.recommendations
      return scoreB - scoreA
    })
    .slice(0, 10)

  const recentSessions = recentSessionRows.map((session) => {
    const sessionEvents = eventRows.filter((e) => e.merchantSessionId === session.id)
    const sessionIntents = intentRows.filter((i) => i.merchantSessionId === session.id)
    return {
      sessionId: session.id,
      shortLabel: `Session ${session.id.slice(-6)}`,
      createdAt: session.createdAt.toISOString(),
      status: session.status,
      recommendedCount: sessionEvents.filter((e) => e.type === 'merchant_frame_selected').length,
      triedCount: sessionEvents.filter((e) => e.type === 'merchant_tryon_completed').length,
      compared: sessionEvents.some((e) => e.type === 'merchant_compare_started'),
      favorited: sessionIntents.some((i) => i.type === 'FAVORITE'),
      productClicked: sessionIntents.some((i) => i.type === 'PRODUCT_CLICK'),
      inquired: sessionIntents.some((i) => i.type === 'INQUIRY'),
    }
  })

  const payload: MerchantInsightsDto = {
    merchant: {
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      status: merchant.status,
    },
    metrics: {
      sessions,
      photosUploaded,
      recommendations,
      tryOns,
      tryOnFailures,
      compareStarts,
      favorites,
      productClicks,
      inquiries,
    },
    topFrames,
    recentSessions,
  }

  // Defense in depth — insights must never leak shopper image markers.
  assertNoShopperImageInInsightPayload(payload as unknown as Record<string, unknown>)

  if (input.recordInsightsViewed) {
    await input.events.appendIdempotent({
      eventId: buildStoreEventIdempotencyKey({
        type: 'merchant_insights_viewed',
        merchantId: merchant.id,
        clientActionId: `insights:${Date.now()}`,
      }),
      type: 'merchant_insights_viewed',
      merchantId: merchant.id,
      source: 'SERVER',
    })
  }

  return payload
}

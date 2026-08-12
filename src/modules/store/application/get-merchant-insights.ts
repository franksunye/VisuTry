import { prisma } from '@/lib/prisma'
import {
  assertNoShopperImageInInsightPayload,
  buildStoreEventIdempotencyKey,
  merchantNotFound,
  experienceNotFound,
} from '../domain'
import type { MerchantEventRepository, MerchantRepository } from './ports/repositories'
import { resolveStoreExperiencePolicy, type StoreExperiencePolicy } from '../domain/experience-policy'

export type MerchantInsightsDto = {
  experienceId: string | null
  dataProvenance: {
    includesSyntheticActivity: boolean
    referenceData: boolean
  }
  merchant: {
    id: string
    slug: string
    name: string
    logoUrl: string | null
    websiteUrl: string | null
    accentColor: string | null
    status: string
    pilotType: string | null
    referenceData: boolean
    experiencePolicy: StoreExperiencePolicy
  }
  metrics: {
    sessions: number
    tryOnSessions: number
    photosUploaded: number
    recommendations: number
    tryOns: number
    tryOnFailures: number
    compareStarts: number
    favorites: number
    productClicks: number
    inquiries: number
  }
  trends: {
    windowDays: 7
    deltas: {
      sessions: number | null
      tryOnSessions: number | null
      favorites: number | null
      inquiries: number | null
    }
    series: Array<{
      date: string
      label: string
      sessions: number
      tryOns: number
      interest: number
    }>
  }
  topFrames: Array<{
    frameId: string
    name: string
    brand: string | null
    shape: string
    imageUrl: string | null
    recommendations: number
    tryOns: number
    favorites: number
    productClicks: number
  }>
  catalog: {
    total: number
    active: number
    approved: number
    averagePrice: number | null
    currency: string | null
    frames: Array<{
      frameId: string
      sku: string | null
      name: string
      imageUrl: string | null
      productUrl: string | null
      price: number | null
      currency: string | null
      shape: string
      brand: string | null
      material: string | null
      color: string | null
      widthClass: string | null
      styleTags: string[]
      source: string
      enrichmentStatus: string
      status: string
      recommendations: number
      tryOns: number
      favorites: number
      productClicks: number
    }>
  }
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
    fitScore: number | null
    shopperName: string | null
    shortlist: Array<{
      frameId: string
      name: string
      imageUrl: string | null
    }>
  }>
  recentInquiries: Array<{
    intentId: string
    name: string
    initials: string
    email: string
    note: string | null
    createdAt: string
    frameId: string | null
    frameName: string
    frameImageUrl: string | null
  }>
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function calculateTrendDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

function numericMetadataValue(metadata: unknown, key: string): number | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'S'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S'
}

export async function getMerchantInsights(input: {
  merchants: MerchantRepository
  events: MerchantEventRepository
  merchantId: string
  experienceId?: string | null
  recordInsightsViewed?: boolean
}): Promise<MerchantInsightsDto> {
  const merchant = await input.merchants.findById(input.merchantId)
  if (!merchant) throw merchantNotFound()

  const experienceId = input.experienceId?.trim() || null
  let experienceReferenceData = false
  if (experienceId) {
    const experience = await prisma.experience.findFirst({
      where: { id: experienceId, merchantId: input.merchantId },
      select: { id: true, referenceData: true },
    })
    if (!experience) throw experienceNotFound()
    experienceReferenceData = experience.referenceData
  }
  const sessionScope = { merchantId: input.merchantId, ...(experienceId ? { experienceId } : {}) }
  const eventScope = { merchantId: input.merchantId, ...(experienceId ? { experienceId } : {}) }
  const intentScope = { merchantId: input.merchantId, ...(experienceId ? { experienceId } : {}) }

  const today = startOfUtcDay(new Date())
  const currentWindowStart = new Date(today.getTime() - 6 * DAY_MS)
  const previousWindowStart = new Date(currentWindowStart.getTime() - 7 * DAY_MS)

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
    trendSessionRows,
  ] = await Promise.all([
    prisma.merchantSession.count({ where: sessionScope }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_photo_uploaded' },
    }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_recommendation_completed' },
    }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_tryon_completed' },
    }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_tryon_failed' },
    }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_compare_started' },
    }),
    prisma.merchantIntent.count({
      where: { ...intentScope, type: 'FAVORITE' },
    }),
    prisma.merchantIntent.count({
      where: { ...intentScope, type: 'PRODUCT_CLICK' },
    }),
    prisma.merchantIntent.count({
      where: { ...intentScope, type: 'INQUIRY' },
    }),
    prisma.merchantFrame.findMany({
      where: {
        merchantId: input.merchantId,
        ...(experienceId ? { experienceFrames: { some: { experienceId, active: true } } } : {}),
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        imageUrl: true,
        productUrl: true,
        price: true,
        currency: true,
        shape: true,
        material: true,
        color: true,
        widthClass: true,
        styleTags: true,
        source: true,
        enrichmentStatus: true,
        status: true,
      },
    }),
    prisma.merchantSession.findMany({
      where: sessionScope,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        status: true,
        referenceData: true,
      },
    }),
    prisma.merchantEvent.findMany({
      where: eventScope,
      select: {
        type: true,
        merchantSessionId: true,
        merchantFrameId: true,
        metadata: true,
        referenceData: true,
        createdAt: true,
      },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.merchantIntent.findMany({
      where: intentScope,
      select: {
        id: true,
        type: true,
        merchantSessionId: true,
        merchantFrameId: true,
        email: true,
        name: true,
        note: true,
        createdAt: true,
      },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.merchantSession.findMany({
      where: {
        merchantId: input.merchantId,
        ...(experienceId ? { experienceId } : {}),
        createdAt: { gte: previousWindowStart },
      },
      select: { id: true, createdAt: true },
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
        brand: frame?.brand ?? null,
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

  const pricedFrames = frames.filter(
    (frame): frame is typeof frame & { price: number } => frame.price !== null,
  )
  const currencies = Array.from(
    new Set(pricedFrames.map((frame) => frame.currency).filter(Boolean)),
  )
  const catalogFrames = frames.map((frame) => {
    const stats = frameStats.get(frame.id) ?? {
      recommendations: 0,
      tryOns: 0,
      favorites: 0,
      productClicks: 0,
    }
    return {
      frameId: frame.id,
      sku: frame.sku,
      name: frame.name,
      brand: frame.brand,
      imageUrl: frame.imageUrl,
      productUrl: frame.productUrl,
      price: frame.price,
      currency: frame.currency,
      shape: frame.shape,
      material: frame.material,
      color: frame.color,
      widthClass: frame.widthClass,
      styleTags: frame.styleTags,
      source: frame.source,
      enrichmentStatus: frame.enrichmentStatus,
      status: frame.status,
      ...stats,
    }
  })

  const tryOnSessionIds = new Set(
    eventRows
      .filter((event) => event.type === 'merchant_tryon_completed' && event.merchantSessionId)
      .map((event) => event.merchantSessionId as string),
  )

  const inWindow = (date: Date, start: Date, end?: Date) =>
    date >= start && (!end || date < end)

  const countDistinctTryOnSessions = (start: Date, end?: Date) =>
    new Set(
      eventRows
        .filter(
          (event) =>
            event.type === 'merchant_tryon_completed' &&
            event.merchantSessionId &&
            inWindow(event.createdAt, start, end),
        )
        .map((event) => event.merchantSessionId as string),
    ).size

  const currentSessions = trendSessionRows.filter((session) =>
    inWindow(session.createdAt, currentWindowStart),
  ).length
  const previousSessions = trendSessionRows.filter((session) =>
    inWindow(session.createdAt, previousWindowStart, currentWindowStart),
  ).length
  const currentTryOnSessions = countDistinctTryOnSessions(currentWindowStart)
  const previousTryOnSessions = countDistinctTryOnSessions(previousWindowStart, currentWindowStart)
  const currentFavorites = intentRows.filter(
    (intent) => intent.type === 'FAVORITE' && inWindow(intent.createdAt, currentWindowStart),
  ).length
  const previousFavorites = intentRows.filter(
    (intent) =>
      intent.type === 'FAVORITE' &&
      inWindow(intent.createdAt, previousWindowStart, currentWindowStart),
  ).length
  const currentInquiries = intentRows.filter(
    (intent) => intent.type === 'INQUIRY' && inWindow(intent.createdAt, currentWindowStart),
  ).length
  const previousInquiries = intentRows.filter(
    (intent) =>
      intent.type === 'INQUIRY' &&
      inWindow(intent.createdAt, previousWindowStart, currentWindowStart),
  ).length

  const trendSeries = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(currentWindowStart.getTime() + index * DAY_MS)
    const end = new Date(start.getTime() + DAY_MS)
    const dayEvents = eventRows.filter((event) => inWindow(event.createdAt, start, end))
    const dayIntents = intentRows.filter((intent) => inWindow(intent.createdAt, start, end))
    return {
      date: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      sessions: trendSessionRows.filter((session) => inWindow(session.createdAt, start, end)).length,
      tryOns: dayEvents.filter((event) => event.type === 'merchant_tryon_completed').length,
      interest:
        dayEvents.filter((event) => event.type === 'merchant_frame_selected').length +
        dayIntents.filter((intent) =>
          intent.type === 'FAVORITE' || intent.type === 'PRODUCT_CLICK' || intent.type === 'INQUIRY',
        ).length,
    }
  })

  const recentSessions = recentSessionRows.map((session) => {
    const sessionEvents = eventRows.filter((e) => e.merchantSessionId === session.id)
    const sessionIntents = intentRows.filter((i) => i.merchantSessionId === session.id)
    const recommendationEvent = sessionEvents.find(
      (event) => event.type === 'merchant_recommendation_completed',
    )
    const inquiry = sessionIntents.find((intent) => intent.type === 'INQUIRY')
    const selectedFrameIds = Array.from(
      new Set(
        sessionEvents
          .filter((event) => event.type === 'merchant_frame_selected' && event.merchantFrameId)
          .map((event) => event.merchantFrameId as string),
      ),
    )
    return {
      sessionId: session.id,
      shortLabel: `Session ${session.id.slice(-6)}`,
      createdAt: session.createdAt.toISOString(),
      status: session.status,
      recommendedCount: selectedFrameIds.length,
      triedCount: sessionEvents.filter((e) => e.type === 'merchant_tryon_completed').length,
      compared: sessionEvents.some((e) => e.type === 'merchant_compare_started'),
      favorited: sessionIntents.some((i) => i.type === 'FAVORITE'),
      productClicked: sessionIntents.some((i) => i.type === 'PRODUCT_CLICK'),
      inquired: sessionIntents.some((i) => i.type === 'INQUIRY'),
      fitScore: numericMetadataValue(recommendationEvent?.metadata, 'topMatchScore'),
      shopperName: inquiry?.name?.trim() || inquiry?.email?.split('@')[0] || null,
      shortlist: selectedFrameIds.slice(0, 4).flatMap((frameId) => {
        const frame = frameById.get(frameId)
        return frame
          ? [{ frameId, name: frame.name, imageUrl: frame.imageUrl }]
          : []
      }),
    }
  })

  const recentInquiries = intentRows
    .filter((intent) => intent.type === 'INQUIRY' && intent.email)
    .slice(0, 6)
    .map((intent) => {
      const frame = intent.merchantFrameId ? frameById.get(intent.merchantFrameId) : null
      const name = intent.name?.trim() || intent.email?.split('@')[0] || 'Shopper'
      return {
        intentId: intent.id,
        name,
        initials: initialsFor(name),
        email: intent.email as string,
        note: intent.note,
        createdAt: intent.createdAt.toISOString(),
        frameId: intent.merchantFrameId,
        frameName: frame?.name ?? 'General catalog inquiry',
        frameImageUrl: frame?.imageUrl ?? null,
      }
    })

  const payload: MerchantInsightsDto = {
    experienceId,
    dataProvenance: {
      includesSyntheticActivity: eventRows.some(
        (event) => event.metadata && typeof event.metadata === 'object' &&
          !Array.isArray(event.metadata) && event.metadata.demoSeed === true,
      ),
      referenceData: merchant.referenceData === true || experienceReferenceData || eventRows.some((event) => event.referenceData === true),
    },
    merchant: {
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      logoUrl: merchant.logoUrl,
      websiteUrl: merchant.websiteUrl,
      accentColor: merchant.accentColor,
      status: merchant.status,
      pilotType: merchant.pilotType ?? null,
      referenceData: merchant.referenceData === true || experienceReferenceData,
      experiencePolicy: resolveStoreExperiencePolicy(merchant),
    },
    metrics: {
      sessions,
      tryOnSessions: tryOnSessionIds.size,
      photosUploaded,
      recommendations,
      tryOns,
      tryOnFailures,
      compareStarts,
      favorites,
      productClicks,
      inquiries,
    },
    trends: {
      windowDays: 7,
      deltas: {
        sessions: calculateTrendDelta(currentSessions, previousSessions),
        tryOnSessions: calculateTrendDelta(currentTryOnSessions, previousTryOnSessions),
        favorites: calculateTrendDelta(currentFavorites, previousFavorites),
        inquiries: calculateTrendDelta(currentInquiries, previousInquiries),
      },
      series: trendSeries,
    },
    topFrames,
    catalog: {
      total: frames.length,
      active: frames.filter((frame) => frame.status === 'ACTIVE').length,
      approved: frames.filter((frame) => frame.enrichmentStatus === 'APPROVED').length,
      averagePrice:
        pricedFrames.length > 0
          ? Math.round(
              pricedFrames.reduce((sum, frame) => sum + frame.price, 0) /
                pricedFrames.length,
            )
          : null,
      currency: currencies.length === 1 ? currencies[0] ?? null : null,
      frames: catalogFrames,
    },
    recentSessions,
    recentInquiries,
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
      experienceId,
      source: 'SERVER',
    })
  }

  return payload
}

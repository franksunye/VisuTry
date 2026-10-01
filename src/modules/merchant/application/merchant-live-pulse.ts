import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  buildMerchantLivePulse,
  countDistinctMerchantSessionIds,
  MERCHANT_LIVE_PRESENCE_EVENT_TYPES,
  MERCHANT_LIVE_PRESENCE_INTENT_TYPES,
  merchantLivePulseWindows,
  type MerchantLivePulseActivityRow,
} from '../domain/merchant-live-pulse'
import {
  LOCAL_DASHBOARD_SIMULATION_MARKER,
  LOCAL_DASHBOARD_SIMULATION_MERCHANT_SLUG,
} from '../domain/local-dashboard-simulation'

const LIVE_EVENT_TYPES = [
  'merchant_tryon_completed',
  'merchant_compare_started',
  'merchant_recommendation_completed',
] as const

type RelatedActivityRow = {
  id: string
  type: string
  createdAt: Date
  experience: { id: string; type: string; name: string } | null
  frame: { id: string; name: string } | null
}

function activityRows(rows: RelatedActivityRow[]): MerchantLivePulseActivityRow[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    createdAt: row.createdAt,
    experienceId: row.experience?.id ?? null,
    experienceType: row.experience?.type ?? null,
    experienceName: row.experience?.name ?? null,
    frameId: row.frame?.id ?? null,
    frameName: row.frame?.name ?? null,
  }))
}

/** A narrow live read. It intentionally does not call period Analytics. */
export async function getMerchantLivePulse(input: { merchantId: string; now?: Date }) {
  const now = input.now ?? new Date()
  const { activeSince, activitySince } = merchantLivePulseWindows(now)
  const localReferenceMerchant = process.env.APP_ENV?.trim().toLowerCase() === 'local'
    && !process.env.VERCEL
    && !process.env.VERCEL_ENV
    ? await prisma.merchant.findFirst({
      where: {
        id: input.merchantId,
        slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT_SLUG,
        classification: 'TEST',
        classificationSource: LOCAL_DASHBOARD_SIMULATION_MARKER,
        pilotType: 'REFERENCE',
        referenceData: true,
      },
      select: { id: true },
    })
    : null
  const includeLocalReference = Boolean(localReferenceMerchant)
  const referenceData = includeLocalReference
  const merchantWhere: Prisma.MerchantWhereInput = includeLocalReference
    ? {
        id: input.merchantId,
        slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT_SLUG,
        classification: 'TEST',
        classificationSource: LOCAL_DASHBOARD_SIMULATION_MARKER,
        pilotType: 'REFERENCE',
        referenceData: true,
      }
    : { referenceData: false }
  const merchantScope = {
    is: merchantWhere,
  }
  const fixtureSessionScope = includeLocalReference
    ? { campaign: LOCAL_DASHBOARD_SIMULATION_MARKER, acquisitionSurface: LOCAL_DASHBOARD_SIMULATION_MARKER }
    : {}
  const fixtureEventScope = includeLocalReference
    ? { metadata: { path: ['fixture'], equals: LOCAL_DASHBOARD_SIMULATION_MARKER } }
    : {}
  const fixtureIntentScope = includeLocalReference
    ? { idempotencyKey: { startsWith: `${LOCAL_DASHBOARD_SIMULATION_MARKER}:` } }
    : {}
  const fixtureSessionRelation = { is: { referenceData, ...fixtureSessionScope, merchant: merchantScope } }
  const sessionScope = {
    merchantId: input.merchantId,
    referenceData,
    merchant: merchantScope,
    ...fixtureSessionScope,
  }
  const activityScope = {
    merchantId: input.merchantId,
    createdAt: { gte: activitySince, lt: now },
    merchant: merchantScope,
  }
  const eventScope = {
    ...activityScope,
    referenceData,
    ...fixtureEventScope,
    ...(includeLocalReference ? { session: fixtureSessionRelation } : {}),
  }
  const intentScope = {
    ...activityScope,
    ...fixtureIntentScope,
    ...(includeLocalReference ? { session: fixtureSessionRelation } : {}),
  }
  const activeSessionScope = {
    referenceData,
    status: 'ACTIVE' as const,
    expiresAt: { gt: now },
    ...fixtureSessionScope,
    merchant: merchantScope,
  }

  const [activeSessionRows, activeEventSessionRows, activeIntentSessionRows, visitors, tryOnCompletions, productClicks, events, intents] = await Promise.all([
    prisma.merchantSession.findMany({
      where: {
        ...sessionScope,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        lastActiveAt: { gte: activeSince, lt: now },
      },
      select: { id: true },
    }),
    prisma.merchantEvent.findMany({
      where: {
        ...eventScope,
        createdAt: { gte: activeSince, lt: now },
        merchantSessionId: { not: null },
        type: { in: [...MERCHANT_LIVE_PRESENCE_EVENT_TYPES] },
        session: { is: activeSessionScope },
      },
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }),
    prisma.merchantIntent.findMany({
      where: {
        ...intentScope,
        createdAt: { gte: activeSince, lt: now },
        type: { in: [...MERCHANT_LIVE_PRESENCE_INTENT_TYPES] },
        session: { is: activeSessionScope },
      },
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }),
    prisma.merchantSession.count({ where: { ...sessionScope, createdAt: { gte: activitySince, lt: now } } }),
    prisma.merchantEvent.count({
      where: { ...eventScope, type: 'merchant_tryon_completed' },
    }),
    prisma.merchantIntent.count({
      where: {
        ...intentScope,
        type: 'PRODUCT_CLICK',
        session: fixtureSessionRelation,
      },
    }),
    prisma.merchantEvent.findMany({
      where: { ...eventScope, type: { in: [...LIVE_EVENT_TYPES] } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10,
      select: {
        id: true,
        type: true,
        createdAt: true,
        experience: { select: { id: true, type: true, name: true } },
        frame: { select: { id: true, name: true } },
      },
    }),
    prisma.merchantIntent.findMany({
      where: {
        ...intentScope,
        type: 'PRODUCT_CLICK',
        session: fixtureSessionRelation,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10,
      select: {
        id: true,
        type: true,
        createdAt: true,
        experience: { select: { id: true, type: true, name: true } },
        frame: { select: { id: true, name: true } },
      },
    }),
  ])

  return buildMerchantLivePulse({
    now,
    activeShoppers: countDistinctMerchantSessionIds(
      activeSessionRows.map((row) => row.id),
      activeEventSessionRows.map((row) => row.merchantSessionId),
      activeIntentSessionRows.map((row) => row.merchantSessionId),
    ),
    visitors,
    tryOnCompletions,
    productClicks,
    events: activityRows(events as unknown as RelatedActivityRow[]),
    intents: activityRows(intents as unknown as RelatedActivityRow[]),
  })
}

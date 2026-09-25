import { prisma } from '@/lib/prisma'
import {
  buildMerchantLivePulse,
  countDistinctMerchantSessionIds,
  MERCHANT_LIVE_PRESENCE_EVENT_TYPES,
  MERCHANT_LIVE_PRESENCE_INTENT_TYPES,
  merchantLivePulseWindows,
  type MerchantLivePulseActivityRow,
} from '../domain/merchant-live-pulse'

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
  const merchantScope = { is: { referenceData: false } }
  const sessionScope = {
    merchantId: input.merchantId,
    referenceData: false,
    merchant: merchantScope,
  }
  const activityScope = {
    merchantId: input.merchantId,
    createdAt: { gte: activitySince, lt: now },
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
        ...activityScope,
        createdAt: { gte: activeSince, lt: now },
        referenceData: false,
        merchantSessionId: { not: null },
        type: { in: [...MERCHANT_LIVE_PRESENCE_EVENT_TYPES] },
        session: {
          is: {
            referenceData: false,
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
        },
      },
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }),
    prisma.merchantIntent.findMany({
      where: {
        ...activityScope,
        createdAt: { gte: activeSince, lt: now },
        type: { in: [...MERCHANT_LIVE_PRESENCE_INTENT_TYPES] },
        session: {
          is: {
            referenceData: false,
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
        },
      },
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }),
    prisma.merchantSession.count({ where: { ...sessionScope, createdAt: { gte: activitySince, lt: now } } }),
    prisma.merchantEvent.count({
      where: { ...activityScope, referenceData: false, type: 'merchant_tryon_completed' },
    }),
    prisma.merchantIntent.count({
      where: {
        ...activityScope,
        type: 'PRODUCT_CLICK',
        session: { is: { referenceData: false } },
      },
    }),
    prisma.merchantEvent.findMany({
      where: { ...activityScope, referenceData: false, type: { in: [...LIVE_EVENT_TYPES] } },
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
        ...activityScope,
        type: 'PRODUCT_CLICK',
        session: { is: { referenceData: false } },
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
    events: activityRows(events as RelatedActivityRow[]),
    intents: activityRows(intents as RelatedActivityRow[]),
  })
}

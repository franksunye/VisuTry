import { prisma } from '@/lib/prisma'
import {
  buildMerchantLivePulse,
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

  const [activeShoppers, visitors, tryOnCompletions, productClicks, events, intents] = await Promise.all([
    prisma.merchantSession.count({
      where: {
        ...sessionScope,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        lastActiveAt: { gte: activeSince, lt: now },
      },
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
    activeShoppers,
    visitors,
    tryOnCompletions,
    productClicks,
    events: activityRows(events as RelatedActivityRow[]),
    intents: activityRows(intents as RelatedActivityRow[]),
  })
}

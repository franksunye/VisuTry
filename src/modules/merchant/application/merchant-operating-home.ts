import { prisma } from '@/lib/prisma'
import { getMerchantCommerceIntelligence } from './merchant-commerce-intelligence'
import { getMerchantCommercialState } from './merchant-commercial-entitlements'
import { campaignReadinessForControlCenter, evaluateCampaignReadiness } from '@/modules/store/domain/campaign-readiness'
import { commercialStateForPresentation } from '@/modules/store/domain/merchant-commercial-state'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import { validateMerchantFrameStoreReadiness } from '../domain/merchant-frame-store-readiness'
import type { MerchantOperatingHomeReadModel } from '../domain/merchant-operating-home'

type HomeFrame = {
  id: string
  sku: string | null
  externalId: string | null
  productUrl: string | null
  name: string
  imageUrl: string | null
  shape: string
  source: string
  status: string
  enrichmentStatus: string
}

const homeFrameSelect = {
  id: true,
  sku: true,
  externalId: true,
  productUrl: true,
  name: true,
  imageUrl: true,
  shape: true,
  source: true,
  status: true,
  enrichmentStatus: true,
} as const

function commercialAttention(status: string): boolean {
  return ['PAYMENT_ACTION_REQUIRED', 'PAST_DUE', 'USAGE_WARNING', 'USAGE_EXHAUSTED', 'EXPIRED', 'PILOT_EXPIRED'].includes(status)
}

function periodLabel(from: string, to: string): string {
  const start = new Date(from)
  const end = new Date(to)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  return `Last ${days} days`
}

export async function getMerchantOperatingHome(input: { merchantId: string }): Promise<MerchantOperatingHomeReadModel | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  })
  if (!merchant) return null

  const [catalogFrames, experiences, intelligence, commercialState] = await Promise.all([
    prisma.merchantFrame.findMany({ where: { merchantId: input.merchantId }, select: homeFrameSelect }),
    prisma.experience.findMany({
      where: { merchantId: input.merchantId, type: { in: ['STORE', 'CAMPAIGN'] } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        headline: true,
        primaryCtaUrl: true,
        secondaryCtaUrl: true,
        startAt: true,
        endAt: true,
        frames: {
          where: { active: true },
          select: { merchantFrame: { select: homeFrameSelect } },
        },
      },
    }),
    getMerchantCommerceIntelligence({ merchantId: input.merchantId }),
    getMerchantCommercialState({ merchantId: input.merchantId }),
  ])

  const catalogReadiness = (catalogFrames as HomeFrame[]).map((frame) => validateMerchantFrameReadiness(frame))
  const store = experiences.find((experience) => experience.type === 'STORE')
  const storeFrames = store?.frames.map(({ merchantFrame }) => merchantFrame as HomeFrame) ?? []
  const storeChecks = storeFrames.map((frame) => validateMerchantFrameStoreReadiness(frame))
  const storeReadiness = !store
    ? null
    : storeFrames.length === 0
      ? 'INCOMPLETE' as const
      : storeChecks.every((check) => check.storeEligible)
        ? 'READY' as const
        : 'NEEDS_ATTENTION' as const

  const campaigns = experiences.filter((experience) => experience.type === 'CAMPAIGN').map((experience) => {
    const frames = experience.frames.map(({ merchantFrame }) => merchantFrame as HomeFrame)
    const validations = frames.map((frame) => validateMerchantFrameReadiness(frame))
    const readiness = campaignReadinessForControlCenter(evaluateCampaignReadiness({
      name: experience.name,
      headline: experience.headline,
      status: experience.status,
      startAt: experience.startAt,
      endAt: experience.endAt,
      primaryCtaUrl: experience.primaryCtaUrl,
      secondaryCtaUrl: experience.secondaryCtaUrl,
      frames: frames.map((frame, index) => ({ status: frame.status, valid: validations[index].valid })),
    }), validations.map((validation) => ({ validation })))
    return { status: experience.status, readiness }
  })

  const commercial = commercialStateForPresentation(commercialState)
  return {
    merchant,
    store: {
      exists: Boolean(store),
      status: store?.status ?? null,
      selectedProductCount: storeFrames.length,
      eligibleProductCount: storeChecks.filter((check) => check.storeEligible).length,
      readiness: storeReadiness,
    },
    catalog: {
      total: catalogFrames.length,
      ready: catalogReadiness.filter((readiness) => readiness.recommendationReady).length,
      issueCount: catalogReadiness.filter((readiness) => !readiness.recommendationReady).length,
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter((campaign) => campaign.status === 'ACTIVE').length,
      draft: campaigns.filter((campaign) => campaign.status === 'DRAFT').length,
      archived: campaigns.filter((campaign) => campaign.status === 'ARCHIVED').length,
      needsAttention: campaigns.filter((campaign) => campaign.status !== 'ARCHIVED' && campaign.readiness.status === 'NEEDS_ATTENTION').length,
    },
    shopper: {
      hasActivity: intelligence.hasActivity,
      periodLabel: periodLabel(intelligence.period.from, intelligence.period.to),
      metrics: [
        { label: 'Visitors', value: intelligence.totals.visitors },
        { label: 'Engaged shoppers', value: intelligence.totals.engagedShoppers },
        { label: 'High-intent shoppers', value: intelligence.totals.highIntentShoppers },
        { label: 'Product clicks', value: intelligence.totals.productClicks },
      ],
    },
    commercial: {
      status: commercial.status,
      planName: commercial.planName,
      attention: commercialAttention(commercial.status),
    },
  }
}

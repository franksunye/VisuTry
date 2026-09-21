import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantOperatingAnalytics, getMerchantOperatingPlan } from './merchant-operating-reads'
import { campaignReadinessForControlCenter, evaluateCampaignReadiness } from '@/modules/store/domain/campaign-readiness'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import { validateMerchantFrameStoreReadiness } from '../domain/merchant-frame-store-readiness'
import type { MerchantOperatingHomeReadModel } from '../domain/merchant-operating-home'

function text(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value)
}

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

function mapFrame(row: Record<string, unknown>): HomeFrame {
  return {
    id: text(row.id),
    sku: row.sku == null ? null : text(row.sku),
    externalId: row.externalId == null ? null : text(row.externalId),
    productUrl: row.productUrl == null ? null : text(row.productUrl),
    name: text(row.name),
    imageUrl: row.imageUrl == null ? null : text(row.imageUrl),
    shape: text(row.shape),
    source: text(row.source, 'UNKNOWN'),
    status: text(row.status, 'UNKNOWN'),
    enrichmentStatus: text(row.enrichmentStatus, 'UNKNOWN'),
  }
}

function commercialAttention(status: string, threshold: string | null): boolean {
  return ['PAYMENT_ACTION_REQUIRED', 'PAST_DUE', 'USAGE_EXHAUSTED', 'EXPIRED', 'PILOT_EXPIRED'].includes(status)
    || (status === 'USAGE_WARNING' && threshold === 'WARNING')
}

function periodLabel(from: string, to: string): string {
  const days = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000))
  return `Last ${days} days`
}

export async function getMerchantOperatingHome(input: { merchantId: string }): Promise<MerchantOperatingHomeReadModel | null> {
  const sql = getCloudflareSql()
  const merchantRows = await sql`SELECT "id", "slug", "name" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const merchantRow = merchantRows[0] as Record<string, unknown> | undefined
  if (!merchantRow) return null

  const [catalogRows, experienceRows, frameRows, intelligence, commercial] = await Promise.all([
    sql`SELECT "id", "sku", "externalId", "productUrl", "name", "imageUrl", "shape", "source", "status", "enrichmentStatus" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId}`,
    sql`SELECT "id", "type", "name", "status", "headline", "primaryCtaUrl", "secondaryCtaUrl", "startAt", "endAt" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" IN ('STORE', 'CAMPAIGN') ORDER BY "updatedAt" DESC`,
    sql`SELECT ef."experienceId", mf."id", mf."sku", mf."externalId", mf."productUrl", mf."name", mf."imageUrl", mf."shape", mf."source", mf."status", mf."enrichmentStatus" FROM "ExperienceFrame" ef JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE ef."merchantId" = ${input.merchantId} AND ef."active" = true ORDER BY ef."experienceId", ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`,
    getMerchantOperatingAnalytics({ merchantId: input.merchantId }),
    getMerchantOperatingPlan({ merchantId: input.merchantId }),
  ])

  const framesByExperience = new Map<string, HomeFrame[]>()
  for (const row of frameRows as Array<Record<string, unknown>>) {
    const experienceId = text(row.experienceId)
    const frames = framesByExperience.get(experienceId) ?? []
    frames.push(mapFrame(row))
    framesByExperience.set(experienceId, frames)
  }
  const experiences = (experienceRows as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    id: text(row.id),
    type: text(row.type),
    name: text(row.name),
    status: text(row.status),
    headline: row.headline == null ? null : text(row.headline),
    primaryCtaUrl: row.primaryCtaUrl == null ? null : text(row.primaryCtaUrl),
    secondaryCtaUrl: row.secondaryCtaUrl == null ? null : text(row.secondaryCtaUrl),
    startAt: row.startAt == null ? null : new Date(String(row.startAt)),
    endAt: row.endAt == null ? null : new Date(String(row.endAt)),
  }))

  const catalogFrames = (catalogRows as Array<Record<string, unknown>>).map(mapFrame)
  const catalogReadiness = catalogFrames.map((frame) => validateMerchantFrameReadiness(frame))
  const store = experiences.find((experience) => experience.type === 'STORE')
  const storeFrames = store ? (framesByExperience.get(store.id) ?? []) : []
  const storeChecks = storeFrames.map((frame) => validateMerchantFrameStoreReadiness(frame))
  const storeReadiness = !store
    ? null
    : storeFrames.length === 0
      ? 'INCOMPLETE' as const
      : storeChecks.every((check) => check.storeEligible)
        ? 'READY' as const
        : 'NEEDS_ATTENTION' as const

  const campaigns = experiences.filter((experience) => experience.type === 'CAMPAIGN').map((experience) => {
    const selectedFrames = framesByExperience.get(experience.id) ?? []
    const validations = selectedFrames.map((frame) => validateMerchantFrameReadiness(frame))
    const readiness = campaignReadinessForControlCenter(evaluateCampaignReadiness({
      name: experience.name,
      headline: experience.headline,
      status: experience.status,
      startAt: experience.startAt,
      endAt: experience.endAt,
      primaryCtaUrl: experience.primaryCtaUrl,
      secondaryCtaUrl: experience.secondaryCtaUrl,
      frames: selectedFrames.map((frame, index) => ({ status: frame.status, valid: validations[index].valid })),
    }), validations.map((validation) => ({ validation })))
    return { status: experience.status, readiness }
  })

  return {
    merchant: { id: text(merchantRow.id), slug: text(merchantRow.slug), name: text(merchantRow.name) },
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
      threshold: commercial.threshold,
      attention: commercialAttention(commercial.status, commercial.threshold),
    },
  }
}

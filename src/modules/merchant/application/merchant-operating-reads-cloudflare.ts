import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveAnalyticsPeriod } from '@/modules/store/application/merchant-analytics-compute'
import { buildMerchantCommerceIntelligence, type MerchantCommerceActivity, type MerchantCommerceIntelligence } from './merchant-commerce-intelligence'
import { commercialStateForPresentation } from '@/modules/store/domain/merchant-commercial-state'
import { resolveMerchantCommercialCapability } from '@/modules/store/domain/merchant-commercial-capability'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { campaignReadinessForControlCenter, evaluateCampaignReadiness } from '@/modules/store/domain/campaign-readiness'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import type { MerchantCommercialPresentation, MerchantControlExperience, MerchantCatalogFrameSummary } from './merchant-control-center'
import { resolveMerchantWorkspaceMode } from '../domain/merchant-workspace-mode'

export type MerchantWorkspaceDetailsRead = { id: string; name: string; websiteUrl: string | null }

function text(value: unknown, fallback = '') { return value == null ? fallback : String(value) }

function date(value: unknown) { return value == null ? null : new Date(String(value)) }

function mapFrame(row: Record<string, unknown>): MerchantCatalogFrameSummary {
  const frame = {
    id: text(row.id), sku: row.sku == null ? null : text(row.sku), externalId: row.externalId == null ? null : text(row.externalId),
    productUrl: row.productUrl == null ? null : text(row.productUrl), name: text(row.name), brand: row.brand == null ? null : text(row.brand),
    imageUrl: row.imageUrl == null ? null : text(row.imageUrl), shape: text(row.shape), source: text(row.source, 'UNKNOWN'),
    status: text(row.status, 'UNKNOWN'), enrichmentStatus: text(row.enrichmentStatus, 'UNKNOWN'),
  }
  return { ...frame, validation: validateMerchantFrameReadiness(frame) }
}

export async function getMerchantWorkspaceMode(input: { merchantId: string }) {
  const sql = getCloudflareSql()
  const [events, activeStores] = await Promise.all([
    sql`SELECT "eventType" FROM "MerchantActivationEvent" WHERE "merchantId" = ${input.merchantId} AND "eventType" IN ('merchant_store_previewed', 'merchant_store_published') ORDER BY "occurredAt" ASC, "createdAt" ASC`,
    sql`SELECT "id" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'STORE' AND "status" = 'ACTIVE' LIMIT 1`,
  ])

  return resolveMerchantWorkspaceMode({
    hasStorePreviewedEvent: events.some((event) => text(event.eventType) === 'merchant_store_previewed'),
    hasStorePublishedEvent: events.some((event) => text(event.eventType) === 'merchant_store_published'),
    storeStatus: activeStores.length > 0 ? 'ACTIVE' : null,
  })
}

export async function getMerchantCatalogCount(input: { merchantId: string }) {
  const sql = getCloudflareSql()
  const rows = await sql`SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId}`
  return Number(rows[0]?.count ?? 0)
}

export async function getMerchantCampaignExperiences(input: { merchantId: string }): Promise<MerchantControlExperience[]> {
  const sql = getCloudflareSql()
  const merchantRows = await sql`SELECT "id", "slug", "referenceData" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const merchant = merchantRows[0]
  if (!merchant) return []
  const [experiences, frameRows] = await Promise.all([
    sql`SELECT "id", "type", "name", "slug", "status", "headline", "description", "primaryCtaLabel", "primaryCtaUrl", "secondaryCtaUrl", "startAt", "endAt", "campaignObjective", "campaignGate", "presentationMode", "referenceData", "updatedAt" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' ORDER BY "updatedAt" DESC`,
    sql`SELECT ef."experienceId", mf."id", mf."sku", mf."externalId", mf."productUrl", mf."name", mf."brand", mf."imageUrl", mf."shape", mf."source", mf."status", mf."enrichmentStatus" FROM "ExperienceFrame" ef JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE ef."merchantId" = ${input.merchantId} AND ef."active" = true ORDER BY ef."experienceId", ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`,
  ])
  const framesByExperience = new Map<string, MerchantCatalogFrameSummary[]>()
  for (const row of frameRows as Array<Record<string, unknown>>) {
    const key = text(row.experienceId)
    const frames = framesByExperience.get(key) ?? []
    frames.push(mapFrame(row))
    framesByExperience.set(key, frames)
  }
  return (experiences as Array<Record<string, unknown>>).map((experience) => {
    const type = 'CAMPAIGN' as const
    const selectedFrames = framesByExperience.get(text(experience.id)) ?? []
    const startAt = date(experience.startAt)
    const endAt = date(experience.endAt)
    const readiness = campaignReadinessForControlCenter(evaluateCampaignReadiness({
      name: text(experience.name), headline: experience.headline == null ? null : text(experience.headline), status: text(experience.status),
      startAt, endAt,
      primaryCtaUrl: experience.primaryCtaUrl == null ? null : text(experience.primaryCtaUrl),
      secondaryCtaUrl: experience.secondaryCtaUrl == null ? null : text(experience.secondaryCtaUrl),
      frames: selectedFrames.map((frame) => ({ status: frame.status, valid: frame.validation.valid })),
    }), selectedFrames)
    const policy = resolveCampaignConversionPolicy(experience as never)
    return {
      id: text(experience.id), type, name: text(experience.name), slug: text(experience.slug), status: text(experience.status),
      frameCount: selectedFrames.length, referenceData: Boolean(merchant.referenceData) || Boolean(experience.referenceData),
      publicPath: `/en/c/${text(merchant.slug)}/${text(experience.slug)}`, headline: experience.headline == null ? null : text(experience.headline),
      description: experience.description == null ? null : text(experience.description), primaryCtaLabel: experience.primaryCtaLabel == null ? null : text(experience.primaryCtaLabel),
      startAt: startAt?.toISOString() ?? null, endAt: endAt?.toISOString() ?? null, selectedFrames, readiness, lastOperation: null,
      policy: { objective: policy?.objective ?? null, gate: policy?.gate ?? null, presentation: resolvePresentationMode({ experienceType: type, persistedPresentationMode: experience.presentationMode == null ? null : text(experience.presentationMode) as PresentationMode }) },
      updatedAt: (date(experience.updatedAt) ?? new Date(0)).toISOString(),
    }
  })
}

function toActivity(experiences: MerchantCommerceActivity['experiences'], sessions: unknown[], events: unknown[], intents: unknown[]): MerchantCommerceActivity {
  return {
    experiences,
    sessions: (sessions as Array<Record<string, unknown>>).map((row) => ({ id: text(row.id), experienceId: row.experienceId == null ? null : text(row.experienceId), source: row.source == null ? null : text(row.source), medium: row.medium == null ? null : text(row.medium), referrer: row.referrer == null ? null : text(row.referrer), aiAgentSource: row.aiAgentSource == null ? null : text(row.aiAgentSource) })),
    events: (events as Array<Record<string, unknown>>).map((row) => ({ merchantSessionId: row.merchantSessionId == null ? null : text(row.merchantSessionId), experienceId: row.experienceId == null ? null : text(row.experienceId), merchantFrameId: row.merchantFrameId == null ? null : text(row.merchantFrameId), type: text(row.type), count: Number(row.count ?? 0) })),
    intents: (intents as Array<Record<string, unknown>>).map((row) => ({ merchantSessionId: text(row.merchantSessionId), experienceId: row.experienceId == null ? null : text(row.experienceId), merchantFrameId: row.merchantFrameId == null ? null : text(row.merchantFrameId), type: text(row.type), count: Number(row.count ?? 0) })),
  }
}

export async function getMerchantOperatingAnalytics(input: { merchantId: string }): Promise<MerchantCommerceIntelligence> {
  const sql = getCloudflareSql()
  const currentPeriod = resolveAnalyticsPeriod({})
  const windowMs = currentPeriod.to.getTime() - currentPeriod.from.getTime()
  const previousPeriod = { from: new Date(currentPeriod.from.getTime() - windowMs), to: currentPeriod.from }
  const experienceRows = await sql`SELECT "id", "type", "name", "status", "referenceData" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" IN ('STORE', 'CAMPAIGN')`
  const experiences = (experienceRows as Array<Record<string, unknown>>).map((row) => ({ id: text(row.id), type: text(row.type) as 'STORE' | 'CAMPAIGN', name: text(row.name), status: text(row.status), referenceData: Boolean(row.referenceData) }))
  const loadWindow = async (from: Date, until: Date) => Promise.all([
    sql`SELECT "id", "experienceId", "source", "medium", "referrer", "aiAgentSource" FROM "MerchantSession" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} ORDER BY "createdAt" DESC`,
    sql`SELECT "merchantSessionId", "experienceId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "experienceId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "merchantFrameId", "type"`,
  ])
  const [current, previous] = await Promise.all([loadWindow(currentPeriod.from, currentPeriod.to), loadWindow(previousPeriod.from, previousPeriod.to)])
  return buildMerchantCommerceIntelligence({ current: toActivity(experiences, current[0], current[1], current[2]), previous: toActivity(experiences, previous[0], previous[1], previous[2]), currentPeriod, previousPeriod })
}

export async function getMerchantOperatingPlan(input: { merchantId: string }): Promise<MerchantCommercialPresentation> {
  const sql = getCloudflareSql()
  const [merchantRows, activeCampaignRows, catalogRows, aiUsageRows, renderUsageRows] = await Promise.all([
    sql`SELECT "planCode", "commercialStatus", "commercialStage", "pricingVersion", "entitlementVersion", "commerceSessionAllowance", "standardRenderAllowance", "premiumRenderAllowance", "campaignAllowance", "entitlementEffectiveFrom", "billingPeriodEnd", "commercialExceptionCode", "createdAt" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`,
    sql`SELECT count(*)::int AS "count" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' AND "status" = 'ACTIVE'`,
    sql`SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId}`,
    sql`SELECT "createdAt" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = 'AI_COMMERCE_SESSION' ORDER BY "createdAt" ASC`,
    sql`SELECT "createdAt" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = 'RENDER_SUCCESS' ORDER BY "createdAt" ASC`,
  ])
  const merchant = merchantRows[0]
  if (!merchant) throw new Error('Merchant not found')
  const fields = {
    planCode: merchant.planCode == null ? null : text(merchant.planCode), commercialStatus: merchant.commercialStatus == null ? null : text(merchant.commercialStatus), commercialStage: merchant.commercialStage == null ? null : text(merchant.commercialStage), pricingVersion: merchant.pricingVersion == null ? null : text(merchant.pricingVersion), entitlementVersion: merchant.entitlementVersion == null ? null : text(merchant.entitlementVersion), commerceSessionAllowance: merchant.commerceSessionAllowance == null ? null : Number(merchant.commerceSessionAllowance), standardRenderAllowance: merchant.standardRenderAllowance == null ? null : Number(merchant.standardRenderAllowance), premiumRenderAllowance: merchant.premiumRenderAllowance == null ? null : Number(merchant.premiumRenderAllowance), campaignAllowance: merchant.campaignAllowance == null ? null : Number(merchant.campaignAllowance), entitlementEffectiveFrom: date(merchant.entitlementEffectiveFrom), billingPeriodEnd: date(merchant.billingPeriodEnd), commercialExceptionCode: merchant.commercialExceptionCode == null ? null : text(merchant.commercialExceptionCode), createdAt: date(merchant.createdAt),
  }
  const period = resolveMerchantCommercialCapability(fields).state.period
  const inPeriod = (row: { createdAt: unknown }) => { const value = date(row.createdAt)?.getTime() ?? 0; return (!period.start || value >= period.start.getTime()) && (!period.end || value < period.end.getTime()) }
  return commercialStateForPresentation(resolveMerchantCommercialCapability(fields, { aiCommerceSessions: (aiUsageRows as Array<{ createdAt: unknown }>).filter(inPeriod).length, standardTryOnGenerations: (renderUsageRows as Array<{ createdAt: unknown }>).filter(inPeriod).length, activeCampaigns: Number(activeCampaignRows[0]?.count ?? 0), catalogItems: Number(catalogRows[0]?.count ?? 0) }).state)
}

export async function getMerchantStoreStatus(input: { merchantId: string }): Promise<string | null> {
  const sql = getCloudflareSql()
  const rows = await sql`SELECT "status" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'STORE' ORDER BY "updatedAt" DESC LIMIT 1`
  return rows[0]?.status == null ? null : text(rows[0].status)
}

export async function getMerchantWorkspaceDetails(input: { merchantId: string }): Promise<MerchantWorkspaceDetailsRead | null> {
  const sql = getCloudflareSql()
  const rows = await sql`SELECT "id", "name", "websiteUrl" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const row = rows[0]
  return row ? { id: text(row.id), name: text(row.name), websiteUrl: row.websiteUrl == null ? null : text(row.websiteUrl) } : null
}

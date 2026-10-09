import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveMerchantCommercialCapability } from '@/modules/store/domain/merchant-commercial-capability'
import type { CommercialUsage, MerchantCommercialFields } from '@/modules/store/domain/merchant-commercial-state'

function asText(value: unknown): string | null {
  return value == null ? null : String(value)
}

function asDate(value: unknown): Date | null {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function mapMerchant(row: Record<string, unknown>): MerchantCommercialFields {
  return {
    classification: asText(row.classification),
    pilotType: asText(row.pilotType),
    planCode: asText(row.planCode),
    commercialStatus: asText(row.commercialStatus),
    commercialStage: asText(row.commercialStage),
    pricingVersion: asText(row.pricingVersion),
    entitlementVersion: asText(row.entitlementVersion),
    commerceSessionAllowance: row.commerceSessionAllowance == null ? null : Number(row.commerceSessionAllowance),
    standardRenderAllowance: row.standardRenderAllowance == null ? null : Number(row.standardRenderAllowance),
    premiumRenderAllowance: row.premiumRenderAllowance == null ? null : Number(row.premiumRenderAllowance),
    campaignAllowance: row.campaignAllowance == null ? null : Number(row.campaignAllowance),
    entitlementEffectiveFrom: asDate(row.entitlementEffectiveFrom),
    billingPeriodEnd: asDate(row.billingPeriodEnd),
    commercialExceptionCode: asText(row.commercialExceptionCode),
    commercialAddOns: Array.isArray(row.commercialAddOns) ? row.commercialAddOns.map(String) : null,
    createdAt: asDate(row.createdAt),
  }
}

function inPeriod(value: unknown, period: { start: Date | null; end: Date | null }): boolean {
  const createdAt = asDate(value)?.getTime() ?? 0
  return (!period.start || createdAt >= period.start.getTime()) && (!period.end || createdAt < period.end.getTime())
}

/** Canonical, usage-aware Commercial capability read for Cloudflare-backed application paths. */
export async function getMerchantCommercialCapabilityCloudflare(input: { merchantId: string; now?: Date; includeResourceUsage?: boolean }) {
  const sql = getCloudflareSql()
  const includeResourceUsage = input.includeResourceUsage !== false
  const [merchantRows, activeCampaignRows, catalogRows, sessionUsageRows, renderUsageRows] = await Promise.all([
    sql`SELECT "classification", "pilotType", "planCode", "commercialStatus", "commercialStage", "pricingVersion", "entitlementVersion", "commerceSessionAllowance", "standardRenderAllowance", "premiumRenderAllowance", "campaignAllowance", "entitlementEffectiveFrom", "billingPeriodEnd", "commercialExceptionCode", "commercialAddOns", "createdAt" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`,
    includeResourceUsage ? sql`SELECT count(*)::int AS "count" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' AND "status" = 'ACTIVE'` : Promise.resolve([]),
    includeResourceUsage ? sql`SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId}` : Promise.resolve([]),
    sql`SELECT "createdAt" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = 'AI_COMMERCE_SESSION' ORDER BY "createdAt" ASC`,
    sql`SELECT "createdAt" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = 'RENDER_SUCCESS' ORDER BY "createdAt" ASC`,
  ])
  const row = merchantRows[0] as Record<string, unknown> | undefined
  if (!row) throw new Error('Merchant not found')
  const merchant = mapMerchant(row)
  const period = resolveMerchantCommercialCapability(merchant, {}, input.now).state.period
  const usage: CommercialUsage = {
    aiCommerceSessions: (sessionUsageRows as Array<Record<string, unknown>>).filter((item) => inPeriod(item.createdAt, period)).length,
    standardTryOnGenerations: (renderUsageRows as Array<Record<string, unknown>>).filter((item) => inPeriod(item.createdAt, period)).length,
    activeCampaigns: includeResourceUsage ? Number((activeCampaignRows[0] as Record<string, unknown> | undefined)?.count ?? 0) : 0,
    catalogItems: includeResourceUsage ? Number((catalogRows[0] as Record<string, unknown> | undefined)?.count ?? 0) : 0,
  }
  return resolveMerchantCommercialCapability(merchant, usage, input.now)
}

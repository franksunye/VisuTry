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


/** Canonical, usage-aware Commercial capability read for Cloudflare-backed application paths. */
export async function getMerchantCommercialCapabilityCloudflare(input: { merchantId: string; now?: Date; includeResourceUsage?: boolean }) {
  const sql = getCloudflareSql()
  // Read identity/entitlement once, then count ledger rows in PostgreSQL. Do
  // not transfer every historical usage record to a Cloudflare Worker.
  const merchantRows = await sql`SELECT "classification", "pilotType", "planCode", "commercialStatus", "commercialStage", "pricingVersion", "entitlementVersion", "commerceSessionAllowance", "standardRenderAllowance", "premiumRenderAllowance", "campaignAllowance", "entitlementEffectiveFrom", "billingPeriodEnd", "commercialExceptionCode", "commercialAddOns", "createdAt" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const row = merchantRows[0] as Record<string, unknown> | undefined
  if (!row) throw new Error('Merchant not found')
  const merchant = mapMerchant(row)
  const period = resolveMerchantCommercialCapability(merchant, {}, input.now).state.period

  // Explicit range branches preserve sargable predicates for the existing
  // MerchantUsageLedger(merchantId, kind) index and its createdAt filtering.
  const countUsage = (kind: 'AI_COMMERCE_SESSION' | 'RENDER_SUCCESS') => {
    if (period.start && period.end) return sql`SELECT count(*)::int AS "count" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = ${kind} AND "createdAt" >= ${period.start} AND "createdAt" < ${period.end}`
    if (period.start) return sql`SELECT count(*)::int AS "count" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = ${kind} AND "createdAt" >= ${period.start}`
    if (period.end) return sql`SELECT count(*)::int AS "count" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = ${kind} AND "createdAt" < ${period.end}`
    return sql`SELECT count(*)::int AS "count" FROM "MerchantUsageLedger" WHERE "merchantId" = ${input.merchantId} AND "kind" = ${kind}`
  }
  const includeResourceUsage = input.includeResourceUsage !== false
  const [sessionRows, renderRows, activeCampaignRows, catalogRows] = await Promise.all([
    countUsage('AI_COMMERCE_SESSION'),
    countUsage('RENDER_SUCCESS'),
    includeResourceUsage ? sql`SELECT count(*)::int AS "count" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' AND "status" = 'ACTIVE'` : Promise.resolve([]),
    includeResourceUsage ? sql`SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId}` : Promise.resolve([]),
  ])
  const usage: CommercialUsage = {
    aiCommerceSessions: Number((sessionRows[0] as Record<string, unknown> | undefined)?.count ?? 0),
    standardTryOnGenerations: Number((renderRows[0] as Record<string, unknown> | undefined)?.count ?? 0),
    activeCampaigns: includeResourceUsage ? Number((activeCampaignRows[0] as Record<string, unknown> | undefined)?.count ?? 0) : 0,
    catalogItems: includeResourceUsage ? Number((catalogRows[0] as Record<string, unknown> | undefined)?.count ?? 0) : 0,
  }
  return resolveMerchantCommercialCapability(merchant, usage, input.now)
}

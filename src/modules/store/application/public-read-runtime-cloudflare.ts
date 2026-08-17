import { getCloudflareSql } from '@/data/neon-cloudflare'
import type {
  ExperienceRecord,
  ExperienceRepository,
  MerchantFrameRecord,
  MerchantFrameRepository,
  MerchantRecord,
  MerchantRepository,
} from './ports/repositories'
import type { ExperienceStatus, ExperienceType } from '../domain/experience'
import type {
  EnrichmentStatus,
  MerchantFrameSource,
  MerchantFrameStatus,
  MerchantStatus,
} from '../domain/enums'

type Row = Record<string, unknown>

function stringValue(value: unknown): string {
  return String(value)
}

function nullableString(value: unknown): string | null {
  return value == null ? null : String(value)
}

function dateValue(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function mapMerchant(row: Row): MerchantRecord {
  return {
    id: stringValue(row.id),
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    logoUrl: nullableString(row.logoUrl),
    websiteUrl: nullableString(row.websiteUrl),
    contactEmail: nullableString(row.contactEmail),
    accentColor: nullableString(row.accentColor),
    status: stringValue(row.status) as MerchantStatus,
    pilotType: nullableString(row.pilotType),
    sponsoredUsagePolicyKey: nullableString(row.sponsoredUsagePolicyKey),
    referenceData: Boolean(row.referenceData),
    defaultSource: nullableString(row.defaultSource),
    defaultCampaign: nullableString(row.defaultCampaign),
    tryOnEnabled: row.tryOnEnabled == null ? true : Boolean(row.tryOnEnabled),
    compareEnabled: row.compareEnabled == null ? true : Boolean(row.compareEnabled),
    maxCompareFrames: row.maxCompareFrames == null ? 2 : Number(row.maxCompareFrames),
    inquiryEnabled: row.inquiryEnabled == null ? false : Boolean(row.inquiryEnabled),
    planCode: nullableString(row.planCode),
    commercialStage: nullableString(row.commercialStage),
    pricingVersion: nullableString(row.pricingVersion),
    entitlementVersion: nullableString(row.entitlementVersion),
    commerceSessionAllowance: row.commerceSessionAllowance == null ? null : Number(row.commerceSessionAllowance),
    standardRenderAllowance: row.standardRenderAllowance == null ? null : Number(row.standardRenderAllowance),
    premiumRenderAllowance: row.premiumRenderAllowance == null ? null : Number(row.premiumRenderAllowance),
    campaignAllowance: row.campaignAllowance == null ? null : Number(row.campaignAllowance),
    entitlementEffectiveFrom: row.entitlementEffectiveFrom == null ? null : dateValue(row.entitlementEffectiveFrom),
    billingPeriodEnd: row.billingPeriodEnd == null ? null : dateValue(row.billingPeriodEnd),
    commercialExceptionCode: nullableString(row.commercialExceptionCode),
    createdAt: dateValue(row.createdAt),
    updatedAt: dateValue(row.updatedAt),
  }
}

function mapFrame(row: Row): MerchantFrameRecord {
  return {
    id: stringValue(row.id),
    merchantId: stringValue(row.merchantId),
    sku: nullableString(row.sku),
    name: stringValue(row.name),
    brand: nullableString(row.brand),
    variant: nullableString(row.variant),
    imageUrl: nullableString(row.imageUrl),
    imageAssetId: nullableString(row.imageAssetId),
    productUrl: nullableString(row.productUrl),
    price: row.price == null ? null : Number(row.price),
    currency: nullableString(row.currency),
    shape: stringValue(row.shape),
    material: nullableString(row.material),
    color: nullableString(row.color),
    widthClass: nullableString(row.widthClass),
    lensWidthMm: row.lensWidthMm == null ? null : Number(row.lensWidthMm),
    bridgeWidthMm: row.bridgeWidthMm == null ? null : Number(row.bridgeWidthMm),
    templeLengthMm: row.templeLengthMm == null ? null : Number(row.templeLengthMm),
    frameWidthMm: row.frameWidthMm == null ? null : Number(row.frameWidthMm),
    styleTags: stringArray(row.styleTags),
    collectionTags: stringArray(row.collectionTags),
    sourceNotes: nullableString(row.sourceNotes),
    source: stringValue(row.source) as MerchantFrameSource,
    externalId: nullableString(row.externalId),
    enrichmentStatus: stringValue(row.enrichmentStatus) as EnrichmentStatus,
    status: stringValue(row.status) as MerchantFrameStatus,
    createdAt: dateValue(row.createdAt),
    updatedAt: dateValue(row.updatedAt),
  }
}

function mapExperience(row: Row, frameIds: string[]): ExperienceRecord {
  return {
    id: stringValue(row.id),
    merchantId: stringValue(row.merchantId),
    type: stringValue(row.type) as ExperienceType,
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    status: stringValue(row.status) as ExperienceStatus,
    headline: nullableString(row.headline),
    description: nullableString(row.description),
    heroAssetUrl: nullableString(row.heroAssetUrl),
    primaryCtaType: nullableString(row.primaryCtaType),
    primaryCtaLabel: nullableString(row.primaryCtaLabel),
    primaryCtaUrl: nullableString(row.primaryCtaUrl),
    secondaryCtaType: nullableString(row.secondaryCtaType),
    secondaryCtaLabel: nullableString(row.secondaryCtaLabel),
    secondaryCtaUrl: nullableString(row.secondaryCtaUrl),
    offerLabel: nullableString(row.offerLabel),
    offerCode: nullableString(row.offerCode),
    offerTerms: nullableString(row.offerTerms),
    startAt: row.startAt == null ? null : dateValue(row.startAt),
    endAt: row.endAt == null ? null : dateValue(row.endAt),
    campaignObjective: nullableString(row.campaignObjective) as ExperienceRecord['campaignObjective'],
    campaignGate: nullableString(row.campaignGate) as ExperienceRecord['campaignGate'],
    presentationMode: nullableString(row.presentationMode) as ExperienceRecord['presentationMode'],
    referenceData: Boolean(row.referenceData),
    defaultSource: nullableString(row.defaultSource),
    defaultCampaign: nullableString(row.defaultCampaign),
    referenceMetadata: (row.referenceMetadata as Record<string, unknown> | null) ?? null,
    frameIds,
    createdAt: dateValue(row.createdAt),
    updatedAt: dateValue(row.updatedAt),
  }
}

const merchantColumns = `
  "id", "slug", "name", "logoUrl", "websiteUrl", "contactEmail", "accentColor",
  "status", "pilotType", "sponsoredUsagePolicyKey", "referenceData", "defaultSource",
  "defaultCampaign", "tryOnEnabled", "compareEnabled", "maxCompareFrames", "inquiryEnabled",
  "planCode", "commercialStage", "pricingVersion", "entitlementVersion", "commerceSessionAllowance",
  "standardRenderAllowance", "premiumRenderAllowance", "campaignAllowance", "entitlementEffectiveFrom",
  "billingPeriodEnd", "commercialExceptionCode", "createdAt", "updatedAt"
`

const experienceColumns = `
  "id", "merchantId", "type", "slug", "name", "status", "headline", "description", "heroAssetUrl",
  "primaryCtaType", "primaryCtaLabel", "primaryCtaUrl", "secondaryCtaType", "secondaryCtaLabel",
  "secondaryCtaUrl", "offerLabel", "offerCode", "offerTerms", "startAt", "endAt", "campaignObjective",
  "campaignGate", "presentationMode", "referenceData", "defaultSource", "defaultCampaign",
  "referenceMetadata", "createdAt", "updatedAt"
`

const frameColumns = `
  "id", "merchantId", "sku", "name", "brand", "variant", "imageUrl", "imageAssetId", "productUrl",
  "price", "currency", "shape", "material", "color", "widthClass", "lensWidthMm", "bridgeWidthMm",
  "templeLengthMm", "frameWidthMm", "styleTags", "collectionTags", "sourceNotes", "source",
  "externalId", "enrichmentStatus", "status", "createdAt", "updatedAt"
`

async function frameIdsForExperience(experienceId: string, merchantId: string): Promise<string[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "merchantFrameId"
    FROM "ExperienceFrame"
    WHERE "experienceId" = ${experienceId}
      AND "merchantId" = ${merchantId}
      AND "active" = true
    ORDER BY "sortOrder" ASC NULLS LAST, "createdAt" ASC
  `
  return rows.map((row) => stringValue(row.merchantFrameId))
}

async function experienceForRow(row: Row): Promise<ExperienceRecord> {
  return mapExperience(row, await frameIdsForExperience(stringValue(row.id), stringValue(row.merchantId)))
}

async function experienceByQuery(query: (sql: ReturnType<typeof getCloudflareSql>) => Promise<Row[]>): Promise<ExperienceRecord | null> {
  const rows = await query(getCloudflareSql())
  return rows[0] ? experienceForRow(rows[0]) : null
}

async function merchantBySlug(slug: string): Promise<MerchantRecord | null> {
  const sql = getCloudflareSql()
  const rows = await sql`SELECT ${sql.unsafe(merchantColumns)} FROM "Merchant" WHERE "slug" = ${slug} LIMIT 1`
  return rows[0] ? mapMerchant(rows[0]) : null
}

async function findFrames(merchantId: string, frameIds?: string[], publicFields = false): Promise<MerchantFrameRecord[]> {
  if (frameIds && frameIds.length === 0) return []
  const sql = getCloudflareSql()
  const rows = frameIds
    ? await sql`
        SELECT ${sql.unsafe(publicFields ? '"id", "merchantId", "name", "brand", "imageUrl", "productUrl", "price", "currency", "shape", "material", "color", "widthClass", "updatedAt"' : frameColumns)}
        FROM "MerchantFrame"
        WHERE "merchantId" = ${merchantId} AND "status" = 'ACTIVE' AND "id" = ANY(${frameIds})
        ORDER BY "updatedAt" DESC
      `
    : await sql`
        SELECT ${sql.unsafe(frameColumns)}
        FROM "MerchantFrame"
        WHERE "merchantId" = ${merchantId} AND "status" = 'ACTIVE'
        ORDER BY "updatedAt" DESC
      `
  if (publicFields) {
    return rows.map((row) => mapFrame({
      ...row,
      sku: null,
      variant: null,
      imageAssetId: null,
      lensWidthMm: null,
      bridgeWidthMm: null,
      templeLengthMm: null,
      frameWidthMm: null,
      styleTags: [],
      collectionTags: [],
      sourceNotes: null,
      source: 'SEED',
      externalId: null,
      enrichmentStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: row.updatedAt,
    }))
  }
  return rows.map(mapFrame)
}

function orderFrames(frameIds: string[], frames: MerchantFrameRecord[]): MerchantFrameRecord[] {
  const order = new Map(frameIds.map((id, index) => [id, index]))
  return frames.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export function createPublicStoreReadRuntime() {
  const merchants: MerchantRepository = {
    async findBySlug(slug) { return merchantBySlug(slug) },
    async findPublicBySlug(slug) { return merchantBySlug(slug) },
    async findById() { throw new Error('Cloudflare public Store runtime does not support this read') },
    async listAllAdmin() { throw new Error('Cloudflare public Store runtime does not support admin reads') },
  }

  const experiences: ExperienceRepository = {
    async findDefaultStore(merchantId) {
      return experienceByQuery((sql) => sql`
        SELECT ${sql.unsafe(experienceColumns)}
        FROM "Experience"
        WHERE "merchantId" = ${merchantId} AND "type" = 'STORE' AND "status" = 'ACTIVE'
        ORDER BY "slug" ASC, "createdAt" ASC
        LIMIT 1
      `)
    },
    async findPublicStoreByMerchant(merchantId) {
      const sql = getCloudflareSql()
      const rows = await sql`
        SELECT ${sql.unsafe(experienceColumns)}
        FROM "Experience"
        WHERE "merchantId" = ${merchantId} AND "type" = 'STORE'
        ORDER BY "updatedAt" DESC
      `
      const row = rows.find((item) => item.status === 'ACTIVE') ?? rows[0]
      return row ? experienceForRow(row) : null
    },
    async hasAnyByMerchant(merchantId) {
      const sql = getCloudflareSql()
      const rows = await sql`SELECT 1 FROM "Experience" WHERE "merchantId" = ${merchantId} LIMIT 1`
      return rows.length > 0
    },
    async findByMerchantAndId(merchantId, experienceId) {
      return experienceByQuery((sql) => sql`
        SELECT ${sql.unsafe(experienceColumns)} FROM "Experience"
        WHERE "merchantId" = ${merchantId} AND "id" = ${experienceId} LIMIT 1
      `)
    },
    async findActiveCampaignByMerchantAndSlug(merchantId, slug) {
      return experienceByQuery((sql) => sql`
        SELECT ${sql.unsafe(experienceColumns)} FROM "Experience"
        WHERE "merchantId" = ${merchantId} AND "slug" = ${slug}
          AND "type" = 'CAMPAIGN' AND "status" = 'ACTIVE' LIMIT 1
      `)
    },
    async findPublicCampaignByMerchantAndSlug(merchantId, slug) {
      return experienceByQuery((sql) => sql`
        SELECT ${sql.unsafe(experienceColumns)} FROM "Experience"
        WHERE "merchantId" = ${merchantId} AND "slug" = ${slug}
          AND "type" = 'CAMPAIGN' LIMIT 1
      `)
    },
  }

  const frames: MerchantFrameRepository = {
    async findPublicActiveByMerchantAndExperience(merchantId, experience) {
      return orderFrames(experience.frameIds, await findFrames(merchantId, experience.frameIds, true))
    },
    async findActiveByMerchantAndExperience(merchantId, experience) {
      return orderFrames(experience.frameIds, await findFrames(merchantId, experience.frameIds))
    },
    async findActiveByMerchant(merchantId) { return findFrames(merchantId) },
    async findByMerchantAndId() { throw new Error('Cloudflare public Store runtime does not support this read') },
    async findActiveByMerchantAndId() { throw new Error('Cloudflare public Store runtime does not support this read') },
  }

  return { merchants, frames, experiences }
}

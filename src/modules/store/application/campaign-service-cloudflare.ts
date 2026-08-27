import { getCloudflareSql } from '@/data/neon-cloudflare'
import { validateCatalogFrame } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access-cloudflare'
import { resolveCampaignConversionPolicy, isCampaignGate, isCampaignObjective, isPresentationMode, type CampaignGate, type CampaignObjective } from '../domain/campaign-policy'
import {
  assertCampaignPublishable,
  CampaignServiceError,
  evaluateCampaignReadiness,
  isSafeCampaignCtaUrl,
} from '../domain/campaign-readiness'
import { resolvePresentationMode, type PresentationMode } from '../domain/presentation-mode'
import { withPublicDiscoveryInvalidation } from './public-discovery-invalidation'

export { CampaignServiceError }

const MAX_CAMPAIGN_FRAMES = 100

export type CampaignReadModel = {
  id: string
  merchantId: string
  slug: string
  name: string
  status: string
  objective: CampaignObjective
  gate: CampaignGate
  presentationMode: PresentationMode
  headline: string | null
  description: string | null
  primaryCtaType: string | null
  primaryCtaLabel: string | null
  primaryCtaUrl: string | null
  secondaryCtaType: string | null
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
  startAt: Date | null
  endAt: Date | null
  frameIds: string[]
  frameCount: number
  referenceData: boolean
  publicPath: string
  readiness: { ready: boolean; blockingIssues: string[]; warnings: string[] }
}

type Row = Record<string, unknown>
type CampaignFrame = { merchantFrameId: string; merchantFrame: { id: string; sku: string | null; externalId: string | null; productUrl: string | null; name: string; imageUrl: string | null; shape: string; widthClass: string | null; source: string | null; enrichmentStatus: string | null; status: string } | null }
type CampaignRow = Row & { frames: CampaignFrame[] }

function dateValue(value: unknown): Date | null {
  return value == null ? null : value instanceof Date ? value : new Date(String(value))
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'campaign'
}

const safeCtaUrl = isSafeCampaignCtaUrl

function parseDate(value: string | Date | null | undefined, field: string): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new CampaignServiceError('INVALID_REQUEST', `Invalid ${field}.`)
  return date
}

function validateDateRange(startAt: Date | null | undefined, endAt: Date | null | undefined) {
  if (startAt && endAt && startAt >= endAt) throw new CampaignServiceError('INVALID_DATE_RANGE', 'startAt must be earlier than endAt.')
}

function validatePolicy(input: { objective: unknown; gate: unknown; presentationMode: unknown }) {
  if (!isCampaignObjective(input.objective) || !isCampaignGate(input.gate) || !isPresentationMode(input.presentationMode)) throw new CampaignServiceError('INVALID_CAMPAIGN_POLICY', 'Campaign objective, gate, and presentation mode must use supported values.')
}

function mapCampaign(row: CampaignRow, merchantSlug: string, merchantReferenceData: boolean): CampaignReadModel {
  const policy = resolveCampaignConversionPolicy({ type: 'CAMPAIGN', campaignObjective: row.campaignObjective == null ? null : String(row.campaignObjective) as CampaignObjective, campaignGate: row.campaignGate == null ? null : String(row.campaignGate) as CampaignGate })
  if (!policy) throw new CampaignServiceError('INVALID_REQUEST', 'Experience is not a Campaign.')
  const presentationMode = resolvePresentationMode({ experienceType: 'CAMPAIGN', persistedPresentationMode: row.presentationMode == null ? null : String(row.presentationMode) as PresentationMode })
  const frames = row.frames
  const frameChecks = frames.map((frame) => frame.merchantFrame ? validateCatalogFrame(frame.merchantFrame) : { valid: false, issues: ['FRAME_NOT_FOUND'], warnings: [] })
  const { ready, blockingIssues, warnings } = evaluateCampaignReadiness({
    name: String(row.name),
    headline: row.headline == null ? null : String(row.headline),
    status: String(row.status),
    startAt: dateValue(row.startAt),
    endAt: dateValue(row.endAt),
    primaryCtaUrl: row.primaryCtaUrl == null ? null : String(row.primaryCtaUrl),
    secondaryCtaUrl: row.secondaryCtaUrl == null ? null : String(row.secondaryCtaUrl),
    frames: frames.map((frame, index) => ({
      status: frame.merchantFrame?.status ?? null,
      valid: frameChecks[index].valid,
    })),
  })
  return {
    id: String(row.id), merchantId: String(row.merchantId), slug: String(row.slug), name: String(row.name), status: String(row.status), objective: policy.objective, gate: policy.gate, presentationMode,
    headline: row.headline == null ? null : String(row.headline), description: row.description == null ? null : String(row.description),
    primaryCtaType: row.primaryCtaType == null ? null : String(row.primaryCtaType), primaryCtaLabel: row.primaryCtaLabel == null ? null : String(row.primaryCtaLabel), primaryCtaUrl: row.primaryCtaUrl == null ? null : String(row.primaryCtaUrl),
    secondaryCtaType: row.secondaryCtaType == null ? null : String(row.secondaryCtaType), secondaryCtaLabel: row.secondaryCtaLabel == null ? null : String(row.secondaryCtaLabel), secondaryCtaUrl: row.secondaryCtaUrl == null ? null : String(row.secondaryCtaUrl),
    startAt: dateValue(row.startAt), endAt: dateValue(row.endAt), frameIds: frames.map((frame) => frame.merchantFrameId), frameCount: frames.length, referenceData: merchantReferenceData || Boolean(row.referenceData), publicPath: `/en/c/${merchantSlug}/${String(row.slug)}`, readiness: { ready, blockingIssues, warnings },
  }
}

async function fetchCampaign(merchantId: string, campaignId: string): Promise<{ row: CampaignRow; merchant: Row }> {
  const sql = getCloudflareSql()
  const [merchantRows, rows] = await Promise.all([
    sql`SELECT "id", "slug", "referenceData" FROM "Merchant" WHERE "id" = ${merchantId} LIMIT 1`,
    sql`SELECT e."id", e."merchantId", e."type", e."slug", e."name", e."status", e."headline", e."description", e."primaryCtaType", e."primaryCtaLabel", e."primaryCtaUrl", e."secondaryCtaType", e."secondaryCtaLabel", e."secondaryCtaUrl", e."startAt", e."endAt", e."campaignObjective", e."campaignGate", e."presentationMode", e."referenceData", ef."merchantFrameId", mf."sku", mf."externalId" AS "frameExternalId", mf."productUrl" AS "frameProductUrl", mf."imageUrl" AS "frameImageUrl", mf."shape" AS "frameShape", mf."widthClass" AS "frameWidthClass", mf."source" AS "frameSource", mf."enrichmentStatus" AS "frameEnrichmentStatus", mf."status" AS "frameStatus", mf."id" AS "frameId", mf."name" AS "frameName", ef."sortOrder", ef."createdAt" AS "frameCreatedAt" FROM "Experience" e LEFT JOIN "ExperienceFrame" ef ON ef."experienceId" = e."id" AND ef."merchantId" = e."merchantId" AND ef."active" = true LEFT JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE e."id" = ${campaignId} AND e."merchantId" = ${merchantId} AND e."type" = 'CAMPAIGN' ORDER BY ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`,
  ])
  const merchant = merchantRows[0]
  if (!merchant || !rows[0]) throw new MerchantAccessError()
  const first = rows[0]
  const row: CampaignRow = { ...first, frames: rows.filter((item) => item.merchantFrameId != null).map((item) => ({ merchantFrameId: String(item.merchantFrameId), merchantFrame: item.frameId == null ? null : { id: String(item.frameId), sku: item.sku == null ? null : String(item.sku), externalId: item.frameExternalId == null ? null : String(item.frameExternalId), productUrl: item.frameProductUrl == null ? null : String(item.frameProductUrl), name: String(item.frameName), imageUrl: item.frameImageUrl == null ? null : String(item.frameImageUrl), shape: String(item.frameShape), widthClass: item.frameWidthClass == null ? null : String(item.frameWidthClass), source: item.frameSource == null ? null : String(item.frameSource), enrichmentStatus: item.frameEnrichmentStatus == null ? null : String(item.frameEnrichmentStatus), status: String(item.frameStatus) } })) }
  return { row, merchant }
}

function compatibleDraft(row: CampaignRow, input: { name: string; objective: CampaignObjective; gate: CampaignGate; presentationMode: PresentationMode; headline: string | null; description: string | null; startAt: Date | null; endAt: Date | null; primaryCtaType: string | null; primaryCtaLabel: string | null; primaryCtaUrl: string | null; secondaryCtaType: string | null; secondaryCtaLabel: string | null; secondaryCtaUrl: string | null }) {
  return String(row.type) === 'CAMPAIGN' && String(row.status) === 'DRAFT' && String(row.name) === input.name && (row.campaignObjective == null ? 'INTENT' : String(row.campaignObjective)) === input.objective && (row.campaignGate == null ? 'NONE' : String(row.campaignGate)) === input.gate && (row.presentationMode == null ? 'EDITORIAL_FIRST' : String(row.presentationMode)) === input.presentationMode && (row.headline ?? null) === input.headline && (row.description ?? null) === input.description && dateValue(row.startAt)?.getTime() === input.startAt?.getTime() && dateValue(row.endAt)?.getTime() === input.endAt?.getTime() && (row.primaryCtaType ?? null) === input.primaryCtaType && (row.primaryCtaLabel ?? null) === input.primaryCtaLabel && (row.primaryCtaUrl ?? null) === input.primaryCtaUrl && (row.secondaryCtaType ?? null) === input.secondaryCtaType && (row.secondaryCtaLabel ?? null) === input.secondaryCtaLabel && (row.secondaryCtaUrl ?? null) === input.secondaryCtaUrl
}

export async function listCampaigns(input: { merchantId: string; cursor?: string; limit?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const sql = getCloudflareSql()
  const merchantRows = await sql`SELECT "slug", "referenceData" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const merchant = merchantRows[0]
  if (!merchant) throw new MerchantAccessError()
  const rows = input.cursor
    ? await sql`SELECT "id" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' AND "id" > ${input.cursor} ORDER BY "id" ASC LIMIT ${limit + 1}`
    : await sql`SELECT "id" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN' ORDER BY "id" ASC LIMIT ${limit + 1}`
  const page = await Promise.all(rows.slice(0, limit).map((row) => fetchCampaign(input.merchantId, String(row.id)).then(({ row: campaign }) => mapCampaign(campaign, String(merchant.slug), Boolean(merchant.referenceData)))))
  return { items: page, nextCursor: rows.length > limit ? page.at(-1)?.id ?? null : null }
}

export async function getCampaign(input: { merchantId: string; campaignId: string }) {
  const { row, merchant } = await fetchCampaign(input.merchantId, input.campaignId)
  return mapCampaign(row, String(merchant.slug), Boolean(merchant.referenceData))
}

export async function createCampaignDraft(input: {
  merchantId: string; name: string; slug?: string | null; headline?: string | null; description?: string | null; objective?: CampaignObjective; gate?: CampaignGate; presentationMode?: PresentationMode; startAt?: string | null; endAt?: string | null; primaryCtaType?: string | null; primaryCtaLabel?: string | null; primaryCtaUrl?: string | null; secondaryCtaType?: string | null; secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null
}) {
  const name = input.name.trim()
  if (!name) throw new CampaignServiceError('INVALID_REQUEST', 'Campaign name is required.')
  const objective = input.objective ?? 'INTENT'; const gate = input.gate ?? 'NONE'; const presentationMode = input.presentationMode ?? 'EDITORIAL_FIRST'
  validatePolicy({ objective, gate, presentationMode })
  const startAt = parseDate(input.startAt, 'startAt') ?? null; const endAt = parseDate(input.endAt, 'endAt') ?? null
  validateDateRange(startAt, endAt)
  for (const [field, url] of [['primaryCtaUrl', input.primaryCtaUrl], ['secondaryCtaUrl', input.secondaryCtaUrl] as const]) if (!safeCtaUrl(url)) throw new CampaignServiceError('INVALID_REQUEST', `${field} must be an https URL or internal path.`)
  const sql = getCloudflareSql()
  const merchantRows = await sql`SELECT "slug", "referenceData" FROM "Merchant" WHERE "id" = ${input.merchantId} LIMIT 1`
  const merchant = merchantRows[0]
  if (!merchant) throw new MerchantAccessError()
  const requestedSlug = slugify(input.slug || name)
  const id = globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const values = { name, objective, gate, presentationMode, headline: input.headline?.trim() || null, description: input.description?.trim() || null, startAt, endAt, primaryCtaType: input.primaryCtaType?.trim() || null, primaryCtaLabel: input.primaryCtaLabel?.trim() || null, primaryCtaUrl: input.primaryCtaUrl?.trim() || null, secondaryCtaType: input.secondaryCtaType?.trim() || null, secondaryCtaLabel: input.secondaryCtaLabel?.trim() || null, secondaryCtaUrl: input.secondaryCtaUrl?.trim() || null }
  const inserted = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: String(merchant.slug), experienceSlug: requestedSlug },
    mutation: () => sql`INSERT INTO "Experience" ("id", "merchantId", "type", "slug", "name", "status", "headline", "description", "campaignObjective", "campaignGate", "presentationMode", "startAt", "endAt", "primaryCtaType", "primaryCtaLabel", "primaryCtaUrl", "secondaryCtaType", "secondaryCtaLabel", "secondaryCtaUrl", "createdAt", "updatedAt") VALUES (${id}, ${input.merchantId}, 'CAMPAIGN', ${requestedSlug}, ${values.name}, 'DRAFT', ${values.headline}, ${values.description}, ${values.objective}, ${values.gate}, ${values.presentationMode}, ${values.startAt}, ${values.endAt}, ${values.primaryCtaType}, ${values.primaryCtaLabel}, ${values.primaryCtaUrl}, ${values.secondaryCtaType}, ${values.secondaryCtaLabel}, ${values.secondaryCtaUrl}, NOW(), NOW()) ON CONFLICT ("merchantId", "slug") DO NOTHING RETURNING "id"`,
    invalidate: (rows) => Boolean(rows[0]?.id),
  })
  const campaignId = String(inserted[0]?.id ?? '')
  if (!campaignId) {
    const existingRows = await sql`SELECT "id" FROM "Experience" WHERE "merchantId" = ${input.merchantId} AND "slug" = ${requestedSlug} LIMIT 1`
    if (!existingRows[0]) throw new CampaignServiceError('CAMPAIGN_CREATE_FAILED', 'The Campaign could not be created.')
    const existing = await fetchCampaign(input.merchantId, String(existingRows[0].id))
    if (compatibleDraft(existing.row, values)) return mapCampaign(existing.row, String(merchant.slug), Boolean(merchant.referenceData))
    throw new CampaignServiceError('CAMPAIGN_SLUG_CONFLICT', 'A Campaign already uses this slug.', 409)
  }
  return getCampaign({ merchantId: input.merchantId, campaignId })
}

export async function updateCampaign(input: {
  merchantId: string; campaignId: string; name?: string; headline?: string | null; description?: string | null; objective?: CampaignObjective; gate?: CampaignGate; presentationMode?: PresentationMode; startAt?: string | null; endAt?: string | null; primaryCtaType?: string | null; primaryCtaLabel?: string | null; primaryCtaUrl?: string | null; secondaryCtaType?: string | null; secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null
}) {
  const current = await fetchCampaign(input.merchantId, input.campaignId)
  const objective = input.objective ?? (current.row.campaignObjective == null ? 'INTENT' : String(current.row.campaignObjective) as CampaignObjective)
  const gate = input.gate ?? (current.row.campaignGate == null ? 'NONE' : String(current.row.campaignGate) as CampaignGate)
  const presentationMode = input.presentationMode ?? (current.row.presentationMode == null ? 'EDITORIAL_FIRST' : String(current.row.presentationMode) as PresentationMode)
  validatePolicy({ objective, gate, presentationMode })
  const startAt = parseDate(input.startAt, 'startAt'); const endAt = parseDate(input.endAt, 'endAt')
  validateDateRange(startAt === undefined ? dateValue(current.row.startAt) : startAt, endAt === undefined ? dateValue(current.row.endAt) : endAt)
  for (const url of [input.primaryCtaUrl, input.secondaryCtaUrl]) if (!safeCtaUrl(url)) throw new CampaignServiceError('INVALID_REQUEST', 'CTA URL must be an https URL or internal path.')
  if (input.name !== undefined && !input.name.trim()) throw new CampaignServiceError('INVALID_REQUEST', 'Campaign name is required.')
  const has = (field: string) => Object.prototype.hasOwnProperty.call(input, field)
  const sql = getCloudflareSql()
  const rows = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: String(current.merchant.slug), experienceSlug: String(current.row.slug) },
    mutation: () => sql`
    UPDATE "Experience"
    SET "name" = CASE WHEN ${has('name')} THEN ${input.name?.trim() ?? null} ELSE "name" END,
      "headline" = CASE WHEN ${has('headline')} THEN ${input.headline == null ? null : input.headline.trim()} ELSE "headline" END,
      "description" = CASE WHEN ${has('description')} THEN ${input.description == null ? null : input.description.trim()} ELSE "description" END,
      "campaignObjective" = ${objective}, "campaignGate" = ${gate}, "presentationMode" = ${presentationMode},
      "startAt" = CASE WHEN ${startAt !== undefined} THEN ${startAt ?? null} ELSE "startAt" END,
      "endAt" = CASE WHEN ${endAt !== undefined} THEN ${endAt ?? null} ELSE "endAt" END,
      "primaryCtaType" = CASE WHEN ${has('primaryCtaType')} THEN ${input.primaryCtaType == null ? null : input.primaryCtaType.trim()} ELSE "primaryCtaType" END,
      "primaryCtaLabel" = CASE WHEN ${has('primaryCtaLabel')} THEN ${input.primaryCtaLabel == null ? null : input.primaryCtaLabel.trim()} ELSE "primaryCtaLabel" END,
      "primaryCtaUrl" = CASE WHEN ${has('primaryCtaUrl')} THEN ${input.primaryCtaUrl == null ? null : input.primaryCtaUrl.trim()} ELSE "primaryCtaUrl" END,
      "secondaryCtaType" = CASE WHEN ${has('secondaryCtaType')} THEN ${input.secondaryCtaType == null ? null : input.secondaryCtaType.trim()} ELSE "secondaryCtaType" END,
      "secondaryCtaLabel" = CASE WHEN ${has('secondaryCtaLabel')} THEN ${input.secondaryCtaLabel == null ? null : input.secondaryCtaLabel.trim()} ELSE "secondaryCtaLabel" END,
      "secondaryCtaUrl" = CASE WHEN ${has('secondaryCtaUrl')} THEN ${input.secondaryCtaUrl == null ? null : input.secondaryCtaUrl.trim()} ELSE "secondaryCtaUrl" END,
      "updatedAt" = NOW()
    WHERE "id" = ${input.campaignId} AND "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN'
    RETURNING "id"
  `,
  })
  if (!rows[0]) throw new MerchantAccessError()
  return getCampaign({ merchantId: input.merchantId, campaignId: input.campaignId })
}

export async function setCampaignFrames(input: { merchantId: string; campaignId: string; frameIds: string[] }) {
  if (input.frameIds.length > MAX_CAMPAIGN_FRAMES) throw new CampaignServiceError('INVALID_REQUEST', `frameIds cannot exceed ${MAX_CAMPAIGN_FRAMES}.`)
  const frameIds = [...new Set(input.frameIds)]
  const current = await fetchCampaign(input.merchantId, input.campaignId)
  const sql = getCloudflareSql()
  const frames = await sql`SELECT "id", "sku", "externalId", "productUrl", "name", "imageUrl", "shape", "widthClass", "source", "enrichmentStatus", "status" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId} AND "id" = ANY(${frameIds}) AND "status" = 'ACTIVE'`
  if (frames.length !== frameIds.length || frames.some((frame) => !validateCatalogFrame(frame as never).valid)) throw new MerchantAccessError()
  const statements = [sql`DELETE FROM "ExperienceFrame" WHERE "experienceId" = ${input.campaignId} AND "merchantId" = ${input.merchantId}`, ...frameIds.map((frameId, sortOrder) => sql`INSERT INTO "ExperienceFrame" ("experienceId", "merchantId", "merchantFrameId", "sortOrder", "active", "createdAt", "updatedAt") VALUES (${input.campaignId}, ${input.merchantId}, ${frameId}, ${sortOrder}, true, NOW(), NOW()) ON CONFLICT ("experienceId", "merchantFrameId") DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder", "active" = true, "updatedAt" = NOW()`)]
  await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: String(current.merchant.slug), experienceSlug: String(current.row.slug) },
    mutation: () => sql.transaction(statements, { isolationLevel: 'Serializable' }),
  })
  return { frameIds }
}

export async function previewCampaign(input: { merchantId: string; campaignId: string }) { return getCampaign(input) }

export async function publishCampaign(input: { merchantId: string; campaignId: string; approved: boolean }) {
  if (!input.approved) throw new CampaignServiceError('PUBLISH_APPROVAL_REQUIRED', 'Publishing requires explicit approval.')
  const current = await fetchCampaign(input.merchantId, input.campaignId)
  const model = mapCampaign(current.row, String(current.merchant.slug), Boolean(current.merchant.referenceData))
  assertCampaignPublishable(model.readiness, true)
  if (String(current.row.status) === 'ACTIVE') return model
  await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: String(current.merchant.slug), experienceSlug: String(current.row.slug) },
    mutation: async () => {
      const sql = getCloudflareSql()
      const rows = await sql`
        UPDATE "Experience"
        SET "status" = 'ACTIVE', "updatedAt" = NOW()
        WHERE "id" = ${input.campaignId} AND "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN'
        RETURNING "id"
      `
      if (!rows[0]) throw new MerchantAccessError()
    },
  })
  return getCampaign({ merchantId: input.merchantId, campaignId: input.campaignId })
}

export async function archiveCampaign(input: { merchantId: string; campaignId: string }) {
  const current = await fetchCampaign(input.merchantId, input.campaignId)
  await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: String(current.merchant.slug), experienceSlug: String(current.row.slug) },
    mutation: async () => {
      const sql = getCloudflareSql()
      const rows = await sql`
        UPDATE "Experience"
        SET "status" = 'ARCHIVED', "updatedAt" = NOW()
        WHERE "id" = ${input.campaignId} AND "merchantId" = ${input.merchantId} AND "type" = 'CAMPAIGN'
        RETURNING "id"
      `
      if (!rows[0]) throw new MerchantAccessError()
    },
  })
  return getCampaign({ merchantId: input.merchantId, campaignId: input.campaignId })
}

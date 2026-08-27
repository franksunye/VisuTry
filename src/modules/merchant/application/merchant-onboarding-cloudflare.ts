import { getCloudflareSql } from '@/data/neon-cloudflare'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { getMerchantProfile } from './get-merchant-profile-cloudflare'
import { MerchantAccessError } from './merchant-access-cloudflare'
import { recordMerchantAgentOperation } from './merchant-agent-credentials-cloudflare'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'

// Batch safety guard, not a product-count/UI ceiling. Human Web paginates the
// catalog and the import review can contain up to 1,000 rows per approval.
export const MAX_CATALOG_IMPORT = 1000
export const MAX_STORE_FRAMES = 100

export type CatalogFrameInput = {
  sku: string
  name: string
  brand?: string | null
  variant?: string | null
  imageUrl?: string | null
  productUrl?: string | null
  price?: number | null
  currency?: string | null
  shape: string
  material?: string | null
  color?: string | null
  widthClass?: string | null
  styleTags?: string[]
  collectionTags?: string[]
  source?: 'MANUAL' | 'CSV' | 'EXTERNAL'
  externalId?: string | null
  sourceNotes?: string | null
}

export class MerchantOnboardingError extends Error {
  readonly code: string
  readonly httpStatus: number
  constructor(code: string, message: string, httpStatus = 400) {
    super(message)
    this.name = 'MerchantOnboardingError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

type Row = Record<string, unknown>
type FrameForValidation = { id: string; sku: string | null; name: string; imageUrl: string | null; shape: string; widthClass: string | null; status: string }

function newRecordId(prefix = 'cf'): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function cleanText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized || null
}

function validUrl(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return value.startsWith('/')
  }
}

export function validateCatalogFrame(frame: FrameForValidation) {
  const issues: string[] = []
  if (!frame.sku?.trim()) issues.push('MISSING_SKU')
  if (!frame.name?.trim()) issues.push('MISSING_NAME')
  if (!frame.imageUrl || !validUrl(frame.imageUrl)) issues.push('MISSING_IMAGE_URL')
  if (!frame.shape?.trim()) issues.push('MISSING_SHAPE')
  const warnings = frame.status !== 'ACTIVE' ? ['FRAME_NOT_ACTIVE'] : []
  return { valid: issues.length === 0 && frame.status === 'ACTIVE', issues, warnings }
}

function normalizeFrameInput(frame: CatalogFrameInput): CatalogFrameInput {
  const sku = frame.sku.trim()
  const name = frame.name.trim()
  const shape = frame.shape.trim()
  if (!sku || !name || !shape) throw new MerchantOnboardingError('INVALID_CATALOG', 'sku, name, and shape are required.')
  if (frame.price != null && (!Number.isInteger(frame.price) || frame.price < 0)) throw new MerchantOnboardingError('INVALID_CATALOG', 'price must be a non-negative integer in minor currency units.')
  return {
    ...frame,
    sku,
    name,
    shape,
    brand: cleanText(frame.brand),
    variant: cleanText(frame.variant),
    imageUrl: cleanText(frame.imageUrl),
    productUrl: cleanText(frame.productUrl),
    currency: cleanText(frame.currency)?.toLowerCase() ?? null,
    material: cleanText(frame.material),
    color: cleanText(frame.color),
    widthClass: cleanText(frame.widthClass),
    styleTags: frame.styleTags ?? [],
    collectionTags: frame.collectionTags ?? [],
    source: frame.source ?? 'MANUAL',
    externalId: cleanText(frame.externalId),
    sourceNotes: cleanText(frame.sourceNotes),
  }
}

function mapFrame(row: Row) {
  const frame = {
    id: String(row.id), sku: row.sku == null ? null : String(row.sku), name: String(row.name), brand: row.brand == null ? null : String(row.brand), variant: row.variant == null ? null : String(row.variant), imageUrl: row.imageUrl == null ? null : String(row.imageUrl), productUrl: row.productUrl == null ? null : String(row.productUrl), price: row.price == null ? null : Number(row.price), currency: row.currency == null ? null : String(row.currency), shape: String(row.shape), material: row.material == null ? null : String(row.material), color: row.color == null ? null : String(row.color), widthClass: row.widthClass == null ? null : String(row.widthClass), styleTags: Array.isArray(row.styleTags) ? row.styleTags.map(String) : [], collectionTags: Array.isArray(row.collectionTags) ? row.collectionTags.map(String) : [], status: String(row.status),
  }
  return { ...frame, validation: validateCatalogFrame(frame) }
}

function storeReadiness(frames: FrameForValidation[], expectedCount = frames.length) {
  const checks = frames.map((frame) => ({ frameId: frame.id, ...validateCatalogFrame(frame) }))
  const blockingIssues = checks.filter((check) => !check.valid).map((check) => ({ frameId: check.frameId, issues: check.issues }))
  if (frames.length !== expectedCount) blockingIssues.push({ frameId: 'unknown', issues: ['FRAME_NOT_FOUND_OR_INACTIVE'] })
  return { ready: expectedCount > 0 && frames.length === expectedCount && blockingIssues.length === 0, frameCount: expectedCount, readyFrameCount: checks.filter((check) => check.valid).length, blockingIssues, checks }
}

async function merchantRow(merchantId: string) {
  const sql = getCloudflareSql()
  const rows = await sql`SELECT "id", "slug", "name", "status", "websiteUrl", "contactEmail" FROM "Merchant" WHERE "id" = ${merchantId} LIMIT 1`
  return rows[0]
}

async function activeFrames(merchantId: string, frameIds?: string[]) {
  const sql = getCloudflareSql()
  const rows = frameIds
    ? await sql`SELECT "id", "sku", "name", "brand", "variant", "imageUrl", "productUrl", "price", "currency", "shape", "material", "color", "widthClass", "styleTags", "collectionTags", "status" FROM "MerchantFrame" WHERE "merchantId" = ${merchantId} AND "status" = 'ACTIVE' AND "id" = ANY(${frameIds}) ORDER BY "id" ASC`
    : await sql`SELECT "id", "sku", "name", "brand", "variant", "imageUrl", "productUrl", "price", "currency", "shape", "material", "color", "widthClass", "styleTags", "collectionTags", "status" FROM "MerchantFrame" WHERE "merchantId" = ${merchantId} AND "status" = 'ACTIVE' ORDER BY "id" ASC`
  return rows
}

async function findStore(merchantId: string, storeId?: string) {
  const sql = getCloudflareSql()
  const rows = storeId
    ? await sql`SELECT "id", "merchantId", "slug", "name", "status", "headline", "description" FROM "Experience" WHERE "id" = ${storeId} AND "merchantId" = ${merchantId} AND "type" = 'STORE' LIMIT 1`
    : await sql`SELECT "id", "merchantId", "slug", "name", "status", "headline", "description" FROM "Experience" WHERE "merchantId" = ${merchantId} AND "type" = 'STORE' ORDER BY "createdAt" ASC LIMIT 1`
  const store = rows[0]
  if (!store) return null
  const frameRows = await sql`SELECT ef."merchantFrameId", ef."sortOrder", mf."id", mf."sku", mf."name", mf."imageUrl", mf."shape", mf."widthClass", mf."status" FROM "ExperienceFrame" ef JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE ef."experienceId" = ${String(store.id)} AND ef."merchantId" = ${merchantId} AND ef."active" = true ORDER BY ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`
  return { store, frames: frameRows }
}

async function audit(actor: MerchantActorContext, action: string, resourceId?: string) {
  await recordMerchantAgentOperation({ actor, action, resourceType: 'Experience', resourceId })
}

export async function getMerchant(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'merchant:read')
  return getMerchantProfile({ actor: input.actor })
}

export async function listMerchantFrames(input: { actor: MerchantActorContext; cursor?: string; limit?: number }) {
  requireAgentScope(input.actor, 'catalog:read')
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const sql = getCloudflareSql()
  const rows = input.cursor
    ? await sql`SELECT * FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId} AND "id" > ${input.cursor} ORDER BY "id" ASC LIMIT ${limit + 1}`
    : await sql`SELECT * FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId} ORDER BY "id" ASC LIMIT ${limit + 1}`
  const items = rows.slice(0, limit).map(mapFrame)
  return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null }
}

export async function validateMerchantCatalog(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'catalog:read')
  const rows = await activeFrames(input.actor.merchantId)
  const items = rows.map((row) => ({ ...mapFrame(row), validation: validateCatalogFrame(row as unknown as FrameForValidation) }))
  const valid = items.filter((frame) => frame.validation.valid)
  return { total: items.length, valid: valid.length, invalid: items.length - valid.length, items: items.map((frame) => ({ id: frame.id, sku: frame.sku, validation: frame.validation })) }
}

export async function importMerchantFrames(input: { actor: MerchantActorContext; frames: CatalogFrameInput[] }) {
  requireAgentScope(input.actor, 'catalog:write')
  if (input.frames.length === 0 || input.frames.length > MAX_CATALOG_IMPORT) throw new MerchantOnboardingError('INVALID_CATALOG', `frames must contain between 1 and ${MAX_CATALOG_IMPORT} items.`)
  const normalized = input.frames.map(normalizeFrameInput)
  const skus = new Set<string>()
  for (const frame of normalized) {
    if (skus.has(frame.sku)) throw new MerchantOnboardingError('INVALID_CATALOG', 'sku values must be unique within an import.')
    skus.add(frame.sku)
  }
  const sql = getCloudflareSql()
  const statements = normalized.map((frame) => sql`
    INSERT INTO "MerchantFrame" ("id", "merchantId", "sku", "name", "brand", "variant", "imageUrl", "productUrl", "price", "currency", "shape", "material", "color", "widthClass", "styleTags", "collectionTags", "source", "externalId", "sourceNotes", "status", "enrichmentStatus", "createdAt", "updatedAt")
    VALUES (${newRecordId()}, ${input.actor.merchantId}, ${frame.sku}, ${frame.name}, ${frame.brand}, ${frame.variant}, ${frame.imageUrl}, ${frame.productUrl}, ${frame.price}, ${frame.currency}, ${frame.shape}, ${frame.material}, ${frame.color}, ${frame.widthClass}, ${frame.styleTags}, ${frame.collectionTags}, ${frame.source}, ${frame.externalId}, ${frame.sourceNotes}, 'ACTIVE', 'APPROVED', NOW(), NOW())
    ON CONFLICT ("merchantId", "sku") DO UPDATE SET "name" = EXCLUDED."name", "brand" = EXCLUDED."brand", "variant" = EXCLUDED."variant", "imageUrl" = EXCLUDED."imageUrl", "productUrl" = EXCLUDED."productUrl", "price" = EXCLUDED."price", "currency" = EXCLUDED."currency", "shape" = EXCLUDED."shape", "material" = EXCLUDED."material", "color" = EXCLUDED."color", "widthClass" = EXCLUDED."widthClass", "styleTags" = EXCLUDED."styleTags", "collectionTags" = EXCLUDED."collectionTags", "source" = EXCLUDED."source", "externalId" = EXCLUDED."externalId", "sourceNotes" = EXCLUDED."sourceNotes", "status" = 'ACTIVE', "enrichmentStatus" = 'APPROVED', "updatedAt" = NOW()
    RETURNING "id", (xmax = 0) AS "created"
  `)
  const results = await sql.transaction(statements, { isolationLevel: 'Serializable' })
  const ids = results.flatMap((result) => result.map((row) => String(row.id)))
  const created = results.flatMap((result) => result).filter((row) => Boolean(row.created)).length
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.imported', resourceType: 'MerchantFrame', result: 'SUCCESS' })
  return { ids, created, updated: normalized.length - created, imported: normalized.length }
}

export async function getOnboardingStatus(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'merchant:read')
  const merchant = await getMerchant({ actor: input.actor })
  const [allFrames, active, store] = await Promise.all([
    (async () => { const sql = getCloudflareSql(); const rows = await sql`SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId}`; return Number(rows[0]?.count ?? 0) })(),
    activeFrames(input.actor.merchantId),
    findStore(input.actor.merchantId),
  ])
  const readyFrames = active.filter((frame) => validateCatalogFrame(frame as unknown as FrameForValidation).valid)
  const selected = store ? store.frames : []
  const readiness = storeReadiness(selected as unknown as FrameForValidation[], selected.length)
  return {
    merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name, status: merchant.status },
    catalog: { totalFrames: allFrames, activeFrames: active.length, readyFrames: readyFrames.length },
    store: store ? { id: String(store.store.id), slug: String(store.store.slug), status: String(store.store.status), frameCount: selected.length, readyFrameCount: readiness.readyFrameCount, publicPath: `/en/store/${merchant.slug}` } : null,
    readyToPublish: Boolean(store && readiness.ready && selected.length > 0),
    blockers: [
      ...(allFrames === 0 ? ['CATALOG_EMPTY'] : []),
      ...(active.length === 0 ? ['NO_ACTIVE_FRAMES'] : []),
      ...(readyFrames.length === 0 ? ['NO_VALID_FRAMES'] : []),
      ...(!store ? ['STORE_NOT_CREATED'] : []),
      ...(store && selected.length === 0 ? ['STORE_HAS_NO_FRAMES'] : []),
    ],
  }
}

export async function createMerchantStore(input: { actor: MerchantActorContext; name?: string; headline?: string; description?: string }) {
  requireAgentScope(input.actor, 'experience:write')
  const merchant = await getMerchant({ actor: input.actor })
  const name = cleanText(input.name) ?? `${merchant.name} Store`
  const sql = getCloudflareSql()
  const id = newRecordId()
  const results = await sql.transaction([
    sql`SELECT "id", "merchantId", "slug", "name", "status" FROM "Experience" WHERE "merchantId" = ${input.actor.merchantId} AND "type" = 'STORE' ORDER BY "createdAt" ASC LIMIT 1`,
    sql`INSERT INTO "Experience" ("id", "merchantId", "type", "slug", "name", "headline", "description", "status", "createdAt", "updatedAt") SELECT ${id}, ${input.actor.merchantId}, 'STORE', 'store', ${name}, ${cleanText(input.headline)}, ${cleanText(input.description)}, 'DRAFT', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "Experience" WHERE "merchantId" = ${input.actor.merchantId} AND "type" = 'STORE') ON CONFLICT ("merchantId", "slug") DO NOTHING RETURNING "id", "merchantId", "slug", "name", "status"`,
    sql`SELECT "id", "merchantId", "slug", "name", "status" FROM "Experience" WHERE "merchantId" = ${input.actor.merchantId} AND "type" = 'STORE' ORDER BY "createdAt" ASC LIMIT 1`,
  ], { isolationLevel: 'Serializable' })
  const store = results[2]?.[0] ?? results[0]?.[0]
  if (!store) throw new MerchantOnboardingError('STORE_CREATE_FAILED', 'The merchant Store could not be created.')
  const created = Boolean(results[1]?.[0])
  await audit(input.actor, 'store.created', String(store.id))
  return { id: String(store.id), slug: String(store.slug), status: String(store.status), name: String(store.name), created, publicPath: `/en/store/${merchant.slug}` }
}

export async function setMerchantStoreFrames(input: { actor: MerchantActorContext; storeId: string; frameIds: string[] }) {
  requireAgentScope(input.actor, 'experience:write')
  if (input.frameIds.length > MAX_STORE_FRAMES) throw new MerchantOnboardingError('INVALID_STORE_FRAMES', `frameIds cannot exceed ${MAX_STORE_FRAMES} items.`)
  const frameIds = [...new Set(input.frameIds)]
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const frames = await activeFrames(input.actor.merchantId, frameIds)
  if (frames.length !== frameIds.length) throw new MerchantAccessError()
  const sql = getCloudflareSql()
  const statements = [sql`DELETE FROM "ExperienceFrame" WHERE "experienceId" = ${input.storeId} AND "merchantId" = ${input.actor.merchantId}`, ...frameIds.map((frameId, sortOrder) => sql`INSERT INTO "ExperienceFrame" ("experienceId", "merchantId", "merchantFrameId", "sortOrder", "active", "createdAt", "updatedAt") VALUES (${input.storeId}, ${input.actor.merchantId}, ${frameId}, ${sortOrder}, true, NOW(), NOW()) ON CONFLICT ("experienceId", "merchantFrameId") DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder", "active" = true, "updatedAt" = NOW()`)]
  await sql.transaction(statements, { isolationLevel: 'Serializable' })
  await audit(input.actor, 'store.frames_updated', input.storeId)
  return { storeId: input.storeId, frameIds, frameCount: frameIds.length }
}

export async function previewMerchantStore(input: { actor: MerchantActorContext; storeId: string }) {
  requireAgentScope(input.actor, 'experience:read')
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const merchant = await getMerchant({ actor: input.actor })
  const readiness = storeReadiness(store.frames as unknown as FrameForValidation[], store.frames.length)
  return { store: { id: String(store.store.id), name: String(store.store.name), status: String(store.store.status), publicPath: `/en/store/${merchant.slug}` }, frameCount: store.frames.length, readiness, preview: { sideEffectFree: true, publicPath: `/en/store/${merchant.slug}` } }
}

export async function publishMerchantStore(input: { actor: MerchantActorContext; storeId: string; approved: boolean }) {
  requireAgentScope(input.actor, 'experience:write')
  if (!input.approved) throw new MerchantOnboardingError('PUBLISH_APPROVAL_REQUIRED', 'Publishing requires explicit approval.', 400)
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const merchant = await getMerchant({ actor: input.actor })
  const frames = await activeFrames(input.actor.merchantId, store.frames.map((frame) => String(frame.merchantFrameId)))
  const readiness = storeReadiness(frames as unknown as FrameForValidation[], store.frames.length)
  if (!readiness.ready || store.frames.length === 0) throw new MerchantOnboardingError('STORE_NOT_READY', 'Store is not ready to publish.', 409)
  const sql = getCloudflareSql()
  const published = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: null },
    mutation: async () => {
      if (String(store.store.status) === 'ACTIVE') return store.store
      const rows = await sql`
        UPDATE "Experience"
        SET "status" = 'ACTIVE', "updatedAt" = NOW()
        WHERE "id" = ${input.storeId} AND "merchantId" = ${input.actor.merchantId} AND "type" = 'STORE' AND "status" = 'DRAFT'
        RETURNING "id", "status"
      `
      if (!rows[0]) throw new MerchantOnboardingError('STORE_PUBLISH_FAILED', 'The Store could not be published.', 409)
      return rows[0]
    },
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'store.published', resourceType: 'Experience', resourceId: String(store.store.id) })
  return { id: String((published as Row).id), status: String((published as Row).status), publicPath: `/en/store/${merchant.slug}`, approvalRecorded: true }
}

export const merchantOnboarding = { getMerchant, getOnboardingStatus, listMerchantFrames, validateMerchantCatalog, importMerchantFrames, createMerchantStore, setMerchantStoreFrames, previewMerchantStore, publishMerchantStore }

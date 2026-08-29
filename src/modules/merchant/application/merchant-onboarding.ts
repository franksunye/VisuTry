import { Prisma, type MerchantFrame } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getMerchantProfile } from './get-merchant-profile'
import { MerchantAccessError } from './merchant-access'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'
import {
  withPublicDiscoveryInvalidation,
} from '@/modules/store/application/public-discovery-invalidation'
import {
  resolveMerchantFrameEnrichmentStatus,
  validateMerchantFrameReadiness,
  type MerchantFrameEnrichmentStatus,
} from '../domain/merchant-frame-readiness'
import { validateMerchantFrameStoreReadiness } from '../domain/merchant-frame-store-readiness'
import { getMerchantPlanDefinition, resolveMerchantPlanCode } from '@/modules/merchant/domain/merchant-commercial-plans'
import { isCanonicalMerchantCommercialFields } from '@/modules/store/domain/merchant-commercial-state'
import type { MerchantStorePreviewFrame, MerchantStoreWorkspace, MerchantStoreWorkspaceFrame } from './merchant-store-workspace'

// Request-size safety guard, not a product-count/UI ceiling. Human Web can
// select the full catalog; the bounded API payload is aligned with catalog
// import capacity.
export const MAX_CATALOG_IMPORT = 1000
export const MAX_STORE_FRAMES = MAX_CATALOG_IMPORT

export type CatalogFrameInput = {
  sku?: string | null
  name: string
  brand?: string | null
  variant?: string | null
  imageUrl?: string | null
  productUrl?: string | null
  price?: number | null
  currency?: string | null
  shape?: string | null
  material?: string | null
  color?: string | null
  widthClass?: string | null
  styleTags?: string[]
  collectionTags?: string[]
  source?: 'MANUAL' | 'CSV' | 'EXTERNAL'
  externalId?: string | null
  sourceNotes?: string | null
  enrichmentStatus?: MerchantFrameEnrichmentStatus
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

type FrameForValidation = Pick<MerchantFrame, 'id' | 'sku' | 'name' | 'imageUrl' | 'shape' | 'widthClass' | 'status'> & Partial<Pick<MerchantFrame, 'productUrl' | 'externalId' | 'source' | 'enrichmentStatus'>>

function cleanText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized || null
}

function defaultStoreName(merchantName: string): string {
  const suffix = ' Store'
  const prefix = merchantName.trim()
  return prefix.length + suffix.length <= 120
    ? `${prefix}${suffix}`
    : `${prefix.slice(0, 120 - suffix.length).trimEnd()}${suffix}`
}

export function validateCatalogFrame(frame: FrameForValidation) {
  return validateMerchantFrameReadiness(frame)
}

export function validateMerchantCatalogImportFrame(frame: Pick<FrameForValidation, 'sku' | 'name' | 'imageUrl' | 'productUrl' | 'externalId' | 'source'>) {
  const readiness = validateMerchantFrameReadiness(frame)
  return { valid: readiness.importReady, issues: readiness.importIssues }
}

function normalizeFrameInput(frame: CatalogFrameInput): Required<Pick<CatalogFrameInput, 'sku' | 'name' | 'shape'>> & CatalogFrameInput {
  const sku = frame.sku?.trim() || null
  const name = frame.name.trim()
  const shape = frame.shape?.trim() || null
  const source = frame.source ?? 'MANUAL'
  const productUrl = cleanText(frame.productUrl)
  const externalId = cleanText(frame.externalId) ?? (source === 'EXTERNAL' ? productUrl : null)
  const enrichmentStatus = resolveMerchantFrameEnrichmentStatus({ shape, enrichmentStatus: frame.enrichmentStatus })
  const validation = validateMerchantCatalogImportFrame({ sku, name, imageUrl: cleanText(frame.imageUrl), productUrl, externalId, source })
  if (!validation.valid) throw new MerchantOnboardingError('INVALID_CATALOG', `Catalog item is not importable: ${validation.issues.join(', ')}.`)
  if (frame.price != null && (!Number.isInteger(frame.price) || frame.price < 0)) {
    throw new MerchantOnboardingError('INVALID_CATALOG', 'price must be a non-negative integer in minor currency units.')
  }
  return {
    ...frame,
    sku,
    name,
    shape,
    brand: cleanText(frame.brand),
    variant: cleanText(frame.variant),
    imageUrl: cleanText(frame.imageUrl),
    productUrl,
    currency: cleanText(frame.currency)?.toLowerCase() ?? null,
    material: cleanText(frame.material),
    color: cleanText(frame.color),
    widthClass: cleanText(frame.widthClass),
    styleTags: frame.styleTags ?? [],
    collectionTags: frame.collectionTags ?? [],
    source,
    externalId,
    sourceNotes: cleanText(frame.sourceNotes),
    enrichmentStatus,
  }
}

function publicFrame(frame: MerchantFrame) {
  const validation = validateCatalogFrame(frame)
  return {
    id: frame.id,
    sku: frame.sku,
    name: frame.name,
    brand: frame.brand,
    variant: frame.variant,
    imageUrl: frame.imageUrl,
    productUrl: frame.productUrl,
    externalId: frame.externalId,
    price: frame.price,
    currency: frame.currency,
    shape: frame.shape,
    material: frame.material,
    color: frame.color,
    widthClass: frame.widthClass,
    styleTags: frame.styleTags,
    collectionTags: frame.collectionTags,
    source: frame.source,
    status: frame.status,
    enrichmentStatus: frame.enrichmentStatus,
    validation,
  }
}

export async function listMerchantFrames(input: { actor: MerchantActorContext; cursor?: string; limit?: number }) {
  requireAgentScope(input.actor, 'catalog:read')
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const rows = await prisma.merchantFrame.findMany({
    where: { merchantId: input.actor.merchantId },
    orderBy: { id: 'asc' },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: limit + 1,
  })
  const hasNext = rows.length > limit
  const items = rows.slice(0, limit).map(publicFrame)
  return { items, nextCursor: hasNext ? items.at(-1)?.id ?? null : null }
}

export async function validateMerchantCatalog(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'catalog:read')
  const rows = await prisma.merchantFrame.findMany({ where: { merchantId: input.actor.merchantId }, orderBy: { id: 'asc' } })
  const items = rows.map(publicFrame)
  const valid = items.filter((frame) => frame.validation.valid)
  return { total: items.length, valid: valid.length, invalid: items.length - valid.length, items: items.map((frame) => ({ id: frame.id, sku: frame.sku, validation: frame.validation })) }
}

export async function importMerchantFrames(input: { actor: MerchantActorContext; frames: CatalogFrameInput[] }) {
  requireAgentScope(input.actor, 'catalog:write')
  if (input.frames.length === 0 || input.frames.length > MAX_CATALOG_IMPORT) {
    throw new MerchantOnboardingError('INVALID_CATALOG', `frames must contain between 1 and ${MAX_CATALOG_IMPORT} items.`)
  }
  const normalized = input.frames.map(normalizeFrameInput)
  const identities = new Set<string>()
  for (const frame of normalized) {
    const identity = frame.sku
      ? `sku:${frame.sku}`
      : frame.externalId
        ? `external:${frame.source}:${frame.externalId}`
        : `url:${frame.productUrl}`
    if (identities.has(identity)) throw new MerchantOnboardingError('INVALID_CATALOG', 'Catalog identity values must be unique within an import.')
    identities.add(identity)
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: input.actor.merchantId }, select: { slug: true, planCode: true, commercialStatus: true } })
  if (!merchant) throw new MerchantAccessError()
  const result = await withPublicDiscoveryInvalidation({
    target: { kind: 'catalog', merchantSlug: merchant.slug },
    mutation: () => prisma.$transaction(async (tx) => {
      const ids: string[] = []
      let created = 0
      let updated = 0
      const canonicalPlan = isCanonicalMerchantCommercialFields(merchant)
      const catalogLimit = canonicalPlan ? getMerchantPlanDefinition(resolveMerchantPlanCode(merchant.planCode)).catalogItems : null
      const currentCatalogCount = catalogLimit === null
        ? 0
        : await tx.merchantFrame.count({ where: { merchantId: input.actor.merchantId } })
      for (const frame of normalized) {
        const identityFilters = [
          ...(frame.sku ? [{ sku: frame.sku }] : []),
          ...(frame.externalId ? [{ source: frame.source, externalId: frame.externalId }] : []),
          ...(frame.productUrl ? [{ productUrl: frame.productUrl }] : []),
        ]
        const existing = await tx.merchantFrame.findFirst({ where: { merchantId: input.actor.merchantId, OR: identityFilters } })
        if (!existing && catalogLimit !== null && currentCatalogCount + created >= catalogLimit) {
          throw new MerchantOnboardingError(
            'CATALOG_LIMIT_REACHED',
            `Your current plan includes up to ${catalogLimit} catalog items.`,
            409,
          )
        }
        const data = {
          name: frame.name,
          brand: frame.brand,
          variant: frame.variant,
          imageUrl: frame.imageUrl,
          productUrl: frame.productUrl,
          price: frame.price,
          currency: frame.currency,
          shape: frame.shape ?? '',
          material: frame.material,
          color: frame.color,
          widthClass: frame.widthClass,
          styleTags: frame.styleTags,
          collectionTags: frame.collectionTags,
          source: frame.source ?? 'MANUAL',
          externalId: frame.externalId,
          sourceNotes: frame.sourceNotes,
          status: 'ACTIVE' as const,
          enrichmentStatus: frame.enrichmentStatus,
        }
        const row = existing
          ? await tx.merchantFrame.update({ where: { id: existing.id }, data })
          : await tx.merchantFrame.create({ data: { ...data, merchantId: input.actor.merchantId, sku: frame.sku } })
        ids.push(row.id)
        if (existing) updated += 1
        else created += 1
      }
      return { ids, created, updated }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.imported', resourceType: 'MerchantFrame', result: 'SUCCESS' })
  logger.info('store', 'Merchant catalog import completed', {
    merchantId: input.actor.merchantId,
    actorId: input.actor.actorId,
    candidateCount: normalized.length,
    importApprovedCount: normalized.length,
    created: result.created,
    updated: result.updated,
    result: 'SUCCESS',
  })
  return { ...result, imported: result.created + result.updated }
}

async function getMerchant(input: { actor: MerchantActorContext }) {
  return getMerchantProfile({ actor: input.actor })
}

async function findStore(merchantId: string, storeId?: string) {
  return prisma.experience.findFirst({ where: { merchantId, type: 'STORE', ...(storeId ? { id: storeId } : {}) }, include: { frames: { where: { active: true }, orderBy: { sortOrder: 'asc' } } } })
}

async function getActiveFrames(merchantId: string, frameIds?: string[]) {
  return prisma.merchantFrame.findMany({
    where: { merchantId, status: 'ACTIVE', ...(frameIds ? { id: { in: frameIds } } : {}) },
    orderBy: { id: 'asc' },
  })
}

function storeReadiness(frames: FrameForValidation[], expectedCount = frames.length) {
  const checks = frames.map((frame) => {
    const recommendation = validateCatalogFrame(frame)
    const display = validateMerchantFrameStoreReadiness(frame)
    return {
      frameId: frame.id,
      storeEligible: display.storeEligible,
      recommendationReady: recommendation.recommendationReady,
      issues: display.issues,
      recommendationIssues: recommendation.recommendationIssues,
    }
  })
  const blockingIssues = checks.filter((check) => !check.storeEligible).map((check) => ({ frameId: check.frameId, issues: check.issues }))
  if (frames.length !== expectedCount) blockingIssues.push({ frameId: 'unknown', issues: ['FRAME_NOT_FOUND_OR_INACTIVE'] })
  const readyFrameCount = checks.filter((check) => check.storeEligible).length
  return { ready: expectedCount > 0 && frames.length === expectedCount && blockingIssues.length === 0, frameCount: expectedCount, readyFrameCount, blockingIssues, checks }
}

function storeWorkspaceFrame(frame: MerchantFrame): MerchantStoreWorkspaceFrame {
  return {
    id: frame.id,
    sku: frame.sku,
    externalId: frame.externalId,
    productUrl: frame.productUrl,
    name: frame.name,
    brand: frame.brand,
    imageUrl: frame.imageUrl,
    price: frame.price,
    currency: frame.currency,
    shape: frame.shape,
    source: frame.source,
    status: frame.status,
    enrichmentStatus: frame.enrichmentStatus,
    validation: validateMerchantFrameReadiness(frame),
    storeReadiness: validateMerchantFrameStoreReadiness(frame),
  }
}

export async function getMerchantStoreWorkspace(input: { actor: MerchantActorContext }): Promise<MerchantStoreWorkspace> {
  requireAgentScope(input.actor, 'experience:read')
  const merchant = await getMerchant(input)
  const [store, catalog] = await Promise.all([
    findStore(input.actor.merchantId),
    prisma.merchantFrame.findMany({ where: { merchantId: input.actor.merchantId }, orderBy: { name: 'asc' } }),
  ])
  return {
    store: store ? {
      id: store.id,
      slug: store.slug,
      name: store.name,
      status: store.status,
      headline: store.headline,
      description: store.description,
      publicPath: `/en/store/${merchant.slug}`,
      selectedFrameIds: store.frames.map((frame) => frame.merchantFrameId),
    } : null,
    catalog: catalog.map(storeWorkspaceFrame),
  }
}

export async function getOnboardingStatus(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'merchant:read')
  const merchant = await getMerchant(input)
  const [totalFrames, activeFrames, store] = await Promise.all([
    prisma.merchantFrame.count({ where: { merchantId: input.actor.merchantId } }),
    getActiveFrames(input.actor.merchantId),
    findStore(input.actor.merchantId),
  ])
  const readyFrames = activeFrames.filter((frame) => validateCatalogFrame(frame).valid)
  const storeEligibleFrames = activeFrames.filter((frame) => validateMerchantFrameStoreReadiness(frame).storeEligible)
  const selectedFrames = store ? await getActiveFrames(input.actor.merchantId, store.frames.map((frame) => frame.merchantFrameId)) : []
  const selectionReadiness = storeReadiness(selectedFrames, store?.frames.length ?? 0)
  return {
    merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name, status: merchant.status },
    catalog: { totalFrames, activeFrames: activeFrames.length, readyFrames: readyFrames.length },
    store: store ? { id: store.id, slug: store.slug, status: store.status, frameCount: store.frames.length, readyFrameCount: selectionReadiness.readyFrameCount, publicPath: `/en/store/${merchant.slug}` } : null,
    readyToPublish: Boolean(store && selectionReadiness.ready && store.frames.length > 0),
    blockers: [
      ...(totalFrames === 0 ? ['CATALOG_EMPTY'] : []),
      ...(activeFrames.length === 0 ? ['NO_ACTIVE_FRAMES'] : []),
      ...(storeEligibleFrames.length === 0 ? ['NO_VALID_FRAMES'] : []),
      ...(!store ? ['STORE_NOT_CREATED'] : []),
      ...(store && store.frames.length === 0 ? ['STORE_HAS_NO_FRAMES'] : []),
      ...(store && store.frames.length > 0 && !selectionReadiness.ready ? ['STORE_HAS_INVALID_FRAMES'] : []),
    ],
  }
}

export async function createMerchantStore(input: { actor: MerchantActorContext; name?: string; headline?: string; description?: string }) {
  requireAgentScope(input.actor, 'experience:write')
  const merchant = await getMerchant(input)
  const name = cleanText(input.name) ?? defaultStoreName(merchant.name)
  const headline = cleanText(input.headline)
  const description = cleanText(input.description)
  if (name.length > 120) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store name cannot exceed 120 characters.')
  if (headline && headline.length > 240) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store headline cannot exceed 240 characters.')
  if (description && description.length > 5000) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store description cannot exceed 5,000 characters.')
  const transactionResult = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: null },
    invalidate: (result) => result.created,
    mutation: () => prisma.$transaction(async (tx) => {
      const existing = await tx.experience.findFirst({ where: { merchantId: input.actor.merchantId, type: 'STORE' }, include: { frames: { where: { active: true } } } })
      if (existing) return { store: existing, created: false }
      const created = await tx.experience.create({
        data: {
          merchantId: input.actor.merchantId,
          type: 'STORE',
          slug: 'store',
          name,
          headline,
          description,
          status: 'DRAFT',
        },
        include: { frames: { where: { active: true } } },
      })
      return { store: created, created: true }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'store.created', resourceType: 'Experience', resourceId: transactionResult.store.id })
  return { id: transactionResult.store.id, slug: transactionResult.store.slug, status: transactionResult.store.status, name: transactionResult.store.name, created: transactionResult.created, publicPath: `/en/store/${merchant.slug}` }
}

export async function updateMerchantStore(input: { actor: MerchantActorContext; storeId: string; name?: string; headline?: string | null; description?: string | null }) {
  requireAgentScope(input.actor, 'experience:write')
  const store = await prisma.experience.findFirst({
    where: { id: input.storeId, merchantId: input.actor.merchantId, type: 'STORE' },
    select: { id: true, slug: true, name: true, status: true, headline: true, description: true },
  })
  if (!store) throw new MerchantAccessError()
  const name = input.name === undefined ? store.name : cleanText(input.name)
  if (!name || name.length > 120) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store name must be between 1 and 120 characters.')
  const headline = input.headline === undefined ? store.headline : cleanText(input.headline)
  const description = input.description === undefined ? store.description : cleanText(input.description)
  if (headline && headline.length > 240) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store headline cannot exceed 240 characters.')
  if (description && description.length > 5000) throw new MerchantOnboardingError('INVALID_STORE_DETAILS', 'Store description cannot exceed 5,000 characters.')
  const merchant = await prisma.merchant.findUnique({ where: { id: input.actor.merchantId }, select: { slug: true } })
  if (!merchant) throw new MerchantAccessError()
  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: null },
    mutation: () => prisma.experience.update({ where: { id: store.id }, data: { name, headline, description }, select: { id: true, slug: true, name: true, status: true, headline: true, description: true } }),
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'store.updated', resourceType: 'Experience', resourceId: store.id })
  return { id: updated.id, slug: updated.slug, name: updated.name, status: updated.status, headline: updated.headline, description: updated.description, publicPath: `/en/store/${merchant.slug}` }
}

export async function setMerchantStoreFrames(input: { actor: MerchantActorContext; storeId: string; frameIds: string[] }) {
  requireAgentScope(input.actor, 'experience:write')
  if (input.frameIds.length > MAX_STORE_FRAMES) throw new MerchantOnboardingError('INVALID_STORE_FRAMES', `frameIds cannot exceed ${MAX_STORE_FRAMES} items.`)
  const frameIds = [...new Set(input.frameIds)]
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({ where: { id: input.actor.merchantId }, select: { slug: true } })
  if (!merchant) throw new MerchantAccessError()
  const frames = await getActiveFrames(input.actor.merchantId, frameIds)
  if (frames.length !== frameIds.length) throw new MerchantAccessError()
  await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: null },
    mutation: () => prisma.$transaction(async (tx) => {
      await tx.experienceFrame.deleteMany({ where: { experienceId: store.id, merchantId: input.actor.merchantId } })
      if (frameIds.length) await tx.experienceFrame.createMany({ data: frameIds.map((merchantFrameId, sortOrder) => ({ experienceId: store.id, merchantId: input.actor.merchantId, merchantFrameId, sortOrder, active: true })) })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'store.frames_updated', resourceType: 'Experience', resourceId: store.id })
  return { storeId: store.id, frameIds, frameCount: frameIds.length }
}

export async function previewMerchantStore(input: { actor: MerchantActorContext; storeId: string }) {
  requireAgentScope(input.actor, 'experience:read')
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const activeFrames = await getActiveFrames(input.actor.merchantId, store.frames.map((frame) => frame.merchantFrameId))
  const activeFramesById = new Map(activeFrames.map((frame) => [frame.id, frame]))
  const frames = store.frames.map((frame) => activeFramesById.get(frame.merchantFrameId)).filter((frame): frame is (typeof activeFrames)[number] => Boolean(frame))
  const readiness = storeReadiness(frames, store.frames.length)
  const merchant = await getMerchant(input)
  const previewFrames: MerchantStorePreviewFrame[] = frames.map((frame) => ({
    id: frame.id,
    name: frame.name,
    imageUrl: frame.imageUrl,
    shape: frame.shape,
    color: frame.color,
    productBrand: frame.brand || merchant.name,
  }))
  return {
    store: {
      id: store.id,
      name: store.name,
      status: store.status,
      headline: store.headline,
      description: store.description,
      publicPath: `/en/store/${merchant.slug}`,
    },
    frameCount: store.frames.length,
    frames: previewFrames,
    readiness,
    preview: { sideEffectFree: true, publicPath: `/en/store/${merchant.slug}` },
  }
}

export async function publishMerchantStore(input: { actor: MerchantActorContext; storeId: string; approved: boolean }) {
  requireAgentScope(input.actor, 'experience:write')
  if (!input.approved) throw new MerchantOnboardingError('PUBLISH_APPROVAL_REQUIRED', 'Publishing requires explicit approval.', 400)
  const store = await findStore(input.actor.merchantId, input.storeId)
  if (!store) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({ where: { id: input.actor.merchantId }, select: { slug: true } })
  if (!merchant) throw new MerchantAccessError()
  const frames = await getActiveFrames(input.actor.merchantId, store.frames.map((frame) => frame.merchantFrameId))
  const readiness = storeReadiness(frames, store.frames.length)
  if (!readiness.ready || store.frames.length === 0) throw new MerchantOnboardingError('STORE_NOT_READY', 'Store is not ready to publish.', 409)
  const published = store.status === 'ACTIVE'
    ? store
    : await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: null },
      mutation: () => prisma.experience.update({ where: { id: store.id }, data: { status: 'ACTIVE' }, include: { frames: { where: { active: true } } } }),
    })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'store.published', resourceType: 'Experience', resourceId: store.id })
  return { id: published.id, status: published.status, publicPath: `/en/store/${merchant.slug}`, approvalRecorded: true }
}

export const merchantOnboarding = { getMerchant, getOnboardingStatus, listMerchantFrames, validateMerchantCatalog, importMerchantFrames, getMerchantStoreWorkspace, createMerchantStore, updateMerchantStore, setMerchantStoreFrames, previewMerchantStore, publishMerchantStore }

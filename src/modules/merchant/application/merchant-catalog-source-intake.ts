import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import {
  type CatalogFrameInput,
} from './merchant-onboarding'
import {
  fetchMerchantSourceDocument,
  MERCHANT_SOURCE_MAX_REDIRECTS,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
} from './merchant-source-network'

export const MAX_SOURCE_URLS = 5
export const MAX_SOURCE_PRODUCTS = 20

export type CatalogCandidateStatus = 'READY' | 'NEEDS_REVIEW' | 'INVALID'
export type CatalogCandidateDedupeStatus = 'NEW' | 'ALREADY_EXISTS' | 'POSSIBLE_DUPLICATE'

export type CatalogImportCandidate = {
  sku: string | null
  name: string | null
  brand: string | null
  variant: string | null
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string | null
  material: string | null
  color: string | null
  widthClass: string | null
  styleTags: string[]
  collectionTags: string[]
  source: 'MANUAL' | 'CSV' | 'EXTERNAL'
  externalId: string | null
  status: CatalogCandidateStatus
  dedupeStatus: CatalogCandidateDedupeStatus
  issues: string[]
}

type ExtractedProduct = {
  sku?: string | null
  name?: string | null
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
  sourceUrl: string
}

export class MerchantSourceIntakeError extends Error {
  readonly code: string
  readonly httpStatus: number

  constructor(code: string, message: string, httpStatus = 400) {
    super(message)
    this.name = 'MerchantSourceIntakeError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return clean(value)
  if (value && typeof value === 'object' && 'name' in value) return clean((value as { name?: unknown }).name)
  return null
}

function asStringArray(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.map(asString).filter((value): value is string => Boolean(value)).slice(0, 20)
}

function firstImage(value: unknown): string | null {
  const values = Array.isArray(value) ? value : [value]
  for (const item of values) {
    const candidate = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && 'url' in item
        ? (item as { url?: unknown }).url
        : null
    const normalized = asString(candidate)
    if (normalized) return normalized
  }
  return null
}

function priceInMinorUnits(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value.replace(/[^0-9.-]/gu, '')) : Number.NaN
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null
}

function isHttpUrl(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function canonicalUrl(value: string | null): string | null {
  if (!isHttpUrl(value)) return null
  const url = new URL(value as string)
  url.hash = ''
  return url.toString()
}

function productTypes(value: unknown): string[] {
  return asStringArray(value).map((item) => item.toLowerCase())
}

function isProduct(value: Record<string, unknown>): boolean {
  return productTypes(value['@type']).includes('product')
}

function additionalPropertyValue(product: Record<string, unknown>, names: string[]): string | null {
  const properties = Array.isArray(product.additionalProperty) ? product.additionalProperty : []
  for (const property of properties) {
    if (!property || typeof property !== 'object') continue
    const key = asString((property as { name?: unknown; propertyID?: unknown }).name)
      ?? asString((property as { propertyID?: unknown }).propertyID)
    if (key && names.includes(key.toLowerCase())) {
      return asString((property as { value?: unknown }).value)
    }
  }
  return null
}

function productFromJsonLd(product: Record<string, unknown>, sourceUrl: string): ExtractedProduct {
  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers
  const offer = offers && typeof offers === 'object' ? offers as Record<string, unknown> : {}
  const productUrl = canonicalUrl(asString(product.url)) ?? canonicalUrl(sourceUrl)
  const shape = additionalPropertyValue(product, ['shape', 'frame shape']) ?? asString(product.shape)
  const brand = asString(product.brand)
  return {
    sku: asString(product.sku) ?? asString(product.mpn) ?? asString(product.productID),
    name: asString(product.name),
    brand,
    imageUrl: firstImage(product.image),
    productUrl,
    price: priceInMinorUnits(offer.price ?? product.price),
    currency: (asString(offer.priceCurrency ?? product.priceCurrency) ?? '').toLowerCase() || null,
    shape,
    material: additionalPropertyValue(product, ['material']),
    color: additionalPropertyValue(product, ['color']) ?? asString(product.color),
    widthClass: additionalPropertyValue(product, ['width', 'width class']),
    styleTags: asStringArray(product.keywords),
    collectionTags: asStringArray(product.category),
    source: 'EXTERNAL',
    externalId: productUrl,
    sourceUrl,
  }
}

function collectProductObjects(value: unknown, sourceUrl: string, output: ExtractedProduct[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectProductObjects(item, sourceUrl, output))
    return
  }
  if (!value || typeof value !== 'object') return
  const object = value as Record<string, unknown>
  if (isProduct(object)) output.push(productFromJsonLd(object, sourceUrl))
  if (object['@graph']) collectProductObjects(object['@graph'], sourceUrl, output)
  if (object.itemListElement) collectProductObjects(object.itemListElement, sourceUrl, output)
  if (object.item && typeof object.item === 'object') collectProductObjects(object.item, sourceUrl, output)
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu
  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(match[1].trim()))
    } catch {
      // Malformed structured data is reported as an empty extraction rather than executed or guessed.
    }
  }
  return blocks
}

function metaContent(html: string, property: string): string | null {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'iu')
  return clean(html.match(pattern)?.[1])
}

function extractAnchors(html: string, sourceUrl: string): string[] {
  const source = new URL(sourceUrl)
  const urls = new Set<string>()
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/giu
  for (const match of html.matchAll(pattern)) {
    try {
      const candidate = new URL(match[1], source)
      if (candidate.origin !== source.origin || !['http:', 'https:'].includes(candidate.protocol)) continue
      if (!/(?:^|\/)(?:product|products|item|items|p)(?:\/|$)/iu.test(candidate.pathname)) continue
      candidate.hash = ''
      urls.add(candidate.toString())
    } catch {
      // Ignore malformed links.
    }
  }
  return [...urls].slice(0, MAX_SOURCE_PRODUCTS)
}

function extractProductsFromDocument(html: string, sourceUrl: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = []
  for (const block of jsonLdBlocks(html)) collectProductObjects(block, sourceUrl, products)
  if (products.length > 0) return products

  const title = metaContent(html, 'og:title')
  const imageUrl = metaContent(html, 'og:image')
  const productUrl = canonicalUrl(metaContent(html, 'og:url')) ?? canonicalUrl(sourceUrl)
  if (title && /(product|products|item|items|\/p\/)/iu.test(new URL(sourceUrl).pathname)) {
    return [{ name: title, imageUrl, productUrl, source: 'EXTERNAL', externalId: productUrl, sourceUrl }]
  }
  return []
}

export function extractCatalogProductsFromHtml(html: string, sourceUrl: string): ExtractedProduct[] {
  return extractProductsFromDocument(html, sourceUrl)
}

function normalizeCandidate(product: ExtractedProduct): CatalogImportCandidate {
  const sku = clean(product.sku)
  const name = clean(product.name)
  const imageUrl = clean(product.imageUrl)
  const productUrl = canonicalUrl(clean(product.productUrl))
  const shape = clean(product.shape)
  const issues: string[] = []
  if (!sku) issues.push('MISSING_SKU')
  if (!name) issues.push('MISSING_NAME')
  if (!imageUrl || !isHttpUrl(imageUrl)) issues.push('MISSING_IMAGE_URL')
  if (!shape) issues.push('MISSING_SHAPE')
  if (imageUrl && !isHttpUrl(imageUrl)) issues.push('INVALID_IMAGE_URL')
  if ((product.source ?? 'EXTERNAL') === 'EXTERNAL' && productUrl === null) issues.push('MISSING_PRODUCT_URL')
  const status: CatalogCandidateStatus = issues.includes('INVALID_IMAGE_URL') ? 'INVALID' : issues.length > 0 ? 'NEEDS_REVIEW' : 'READY'
  return {
    sku,
    name,
    brand: clean(product.brand),
    variant: clean(product.variant),
    imageUrl,
    productUrl,
    price: product.price == null ? null : Number.isInteger(product.price) && product.price >= 0 ? product.price : null,
    currency: clean(product.currency)?.toLowerCase() ?? null,
    shape,
    material: clean(product.material),
    color: clean(product.color),
    widthClass: clean(product.widthClass),
    styleTags: asStringArray(product.styleTags),
    collectionTags: asStringArray(product.collectionTags),
    source: product.source ?? 'EXTERNAL',
    externalId: canonicalUrl(clean(product.externalId)) ?? product.externalId ?? productUrl,
    status,
    dedupeStatus: 'NEW',
    issues,
  }
}

function likelyProductSourceUrl(url: string): boolean {
  try {
    return /(?:^|\/)(?:product|products|item|items|p)(?:\/|$)/iu.test(new URL(url).pathname)
  } catch {
    return false
  }
}

async function inspectUrl(url: string, maxProducts: number): Promise<{ candidates: ExtractedProduct[]; fetchedUrls: string[]; issues: Array<{ code: string; message: string }> }> {
  const issues: Array<{ code: string; message: string }> = []
  const fetchedUrls: string[] = []
  const candidates: ExtractedProduct[] = []
  const sourceError = (error: unknown, fallback: MerchantSourceIntakeError) => {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      return { code: String((error as { code: unknown }).code), message: String((error as { message: unknown }).message) }
    }
    return { code: fallback.code, message: fallback.message }
  }
  const fetch = async (target: string) => {
    const document = await fetchMerchantSourceDocument(target, {
      timeoutMs: MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
      maxBytes: MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
      maxRedirects: MERCHANT_SOURCE_MAX_REDIRECTS,
    })
    const contentType = document.contentType.split(';')[0].trim().toLowerCase()
    if (contentType && !['text/html', 'application/xhtml+xml'].includes(contentType)) {
      throw new MerchantSourceIntakeError('UNSUPPORTED_SOURCE', 'The source is not an HTML product page.')
    }
    fetchedUrls.push(document.url)
    return document
  }

  try {
    const document = await fetch(url)
    candidates.push(...extractProductsFromDocument(document.body, document.url))
    if (candidates.length === 0 && !likelyProductSourceUrl(url)) {
      const discovered = extractAnchors(document.body, document.url)
      if (discovered.length >= maxProducts) issues.push({ code: 'TOO_MANY_PRODUCTS', message: `Only the first ${maxProducts} product links were inspected.` })
      for (const productUrl of discovered.slice(0, maxProducts)) {
        try {
          const productDocument = await fetch(productUrl)
          candidates.push(...extractProductsFromDocument(productDocument.body, productDocument.url))
          if (candidates.length >= maxProducts) {
            issues.push({ code: 'TOO_MANY_PRODUCTS', message: `Only the first ${maxProducts} products were retained.` })
            break
          }
        } catch (error) {
          issues.push(sourceError(error, new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'A discovered product page could not be inspected.')))
        }
      }
    }
    if (candidates.length === 0) issues.push({ code: 'NO_PRODUCTS_FOUND', message: 'No deterministic product records were found at this source.' })
  } catch (error) {
    issues.push(sourceError(error, new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'The source could not be inspected.')))
  }
  return { candidates: candidates.slice(0, MAX_SOURCE_PRODUCTS), fetchedUrls, issues }
}

function candidateToImportFrame(candidate: CatalogImportCandidate): CatalogFrameInput | null {
  if (candidate.status !== 'READY' || candidate.dedupeStatus !== 'NEW' || !candidate.sku || !candidate.name || !candidate.shape) return null
  return {
    sku: candidate.sku,
    name: candidate.name,
    brand: candidate.brand,
    variant: candidate.variant,
    imageUrl: candidate.imageUrl,
    productUrl: candidate.productUrl,
    price: candidate.price,
    currency: candidate.currency,
    shape: candidate.shape,
    material: candidate.material,
    color: candidate.color,
    widthClass: candidate.widthClass,
    styleTags: candidate.styleTags,
    collectionTags: candidate.collectionTags,
    source: candidate.source,
    externalId: candidate.externalId,
    sourceNotes: candidate.productUrl ? `Reviewed public catalog source: ${new URL(candidate.productUrl).hostname}` : null,
  }
}

export async function inspectCatalogSource(input: {
  actor: AgentMerchantActor
  sourceUrls?: string[]
  manualProducts?: CatalogFrameInput[]
}) {
  requireAgentScope(input.actor, 'catalog:read')
  const sourceUrls = [...new Set((input.sourceUrls ?? []).map((url) => url.trim()).filter(Boolean))]
  const manualProducts = input.manualProducts ?? []
  if (sourceUrls.length === 0 && manualProducts.length === 0) {
    throw new MerchantSourceIntakeError('SOURCE_REQUIRED', 'Provide a public product/catalog URL or a small structured product set.')
  }
  if (sourceUrls.length > MAX_SOURCE_URLS) throw new MerchantSourceIntakeError('TOO_MANY_SOURCE_URLS', `A maximum of ${MAX_SOURCE_URLS} source URLs is supported.`)
  if (manualProducts.length > MAX_SOURCE_PRODUCTS) throw new MerchantSourceIntakeError('TOO_MANY_PRODUCTS', `A maximum of ${MAX_SOURCE_PRODUCTS} products is supported per review.`)

  const extracted: ExtractedProduct[] = []
  const sourceIssues: Array<{ sourceUrl: string; code: string; message: string }> = []
  const fetchedUrls: string[] = []
  for (const sourceUrl of sourceUrls) {
    const remaining = MAX_SOURCE_PRODUCTS - extracted.length
    if (remaining <= 0) {
      sourceIssues.push({ sourceUrl, code: 'TOO_MANY_PRODUCTS', message: `Only the first ${MAX_SOURCE_PRODUCTS} products were retained for this review.` })
      break
    }
    const inspected = await inspectUrl(sourceUrl, remaining)
    extracted.push(...inspected.candidates)
    fetchedUrls.push(...inspected.fetchedUrls)
    sourceIssues.push(...inspected.issues.map((issue) => ({ sourceUrl, ...issue })))
  }
  extracted.push(...manualProducts.map((product) => ({ ...product, source: product.source ?? 'MANUAL', sourceUrl: 'manual://merchant-provided' })))

  const existing = await prisma.merchantFrame.findMany({
    where: { merchantId: input.actor.merchantId },
    select: { id: true, sku: true, productUrl: true },
  })
  const existingSkus = new Set(existing.map((frame) => clean(frame.sku)).filter((value): value is string => Boolean(value)))
  const existingUrls = new Set(existing.map((frame) => canonicalUrl(frame.productUrl)).filter((value): value is string => Boolean(value)))
  const seenSkus = new Set<string>()
  const seenUrls = new Set<string>()
  const candidates = extracted.slice(0, MAX_SOURCE_PRODUCTS).map(normalizeCandidate).map((candidate) => {
    const duplicateInProposal = Boolean(candidate.sku && seenSkus.has(candidate.sku)) || Boolean(candidate.productUrl && seenUrls.has(candidate.productUrl))
    const alreadyExists = Boolean(candidate.sku && existingSkus.has(candidate.sku)) || Boolean(candidate.productUrl && existingUrls.has(candidate.productUrl))
    if (candidate.sku) seenSkus.add(candidate.sku)
    if (candidate.productUrl) seenUrls.add(candidate.productUrl)
    if (alreadyExists) return { ...candidate, dedupeStatus: 'ALREADY_EXISTS' as const, status: candidate.status === 'INVALID' ? 'INVALID' as const : 'NEEDS_REVIEW' as const, issues: [...candidate.issues, 'ALREADY_EXISTS'] }
    if (duplicateInProposal) return { ...candidate, dedupeStatus: 'POSSIBLE_DUPLICATE' as const, status: candidate.status === 'INVALID' ? 'INVALID' as const : 'NEEDS_REVIEW' as const, issues: [...candidate.issues, 'POSSIBLE_DUPLICATE'] }
    return candidate
  })
  const importable = candidates.map(candidateToImportFrame).filter((candidate): candidate is CatalogFrameInput => Boolean(candidate))
  const sourceHostnames = [...new Set(sourceUrls.map((sourceUrl) => {
    try { return new URL(sourceUrl).hostname } catch { return null }
  }).filter((value): value is string => Boolean(value)))]
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.source_inspected', resourceType: 'CatalogSource', result: 'SUCCESS' })
  logger.info('store', 'Merchant catalog source inspected', {
    merchantId: input.actor.merchantId,
    actorId: input.actor.actorId,
    sourceHostnames,
    fetchedPageCount: fetchedUrls.length,
    candidateCount: candidates.length,
    importReadyCount: importable.length,
    result: 'SUCCESS',
  })
  return {
    proposal: true,
    writePerformed: false,
    requiresApproval: true,
    sourceSummary: {
      sourceUrls,
      sourceHostnames,
      fetchedPageCount: fetchedUrls.length,
      foundCount: candidates.length,
      readyToImport: importable.length,
      needsReview: candidates.filter((candidate) => candidate.status === 'NEEDS_REVIEW').length,
      invalid: candidates.filter((candidate) => candidate.status === 'INVALID').length,
      sourceIssues,
    },
    candidates,
    importReady: importable,
    limits: {
      maxSourceUrls: MAX_SOURCE_URLS,
      maxDiscoveredProducts: MAX_SOURCE_PRODUCTS,
      timeoutMs: MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
      maxResponseBytes: MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
      maxRedirects: MERCHANT_SOURCE_MAX_REDIRECTS,
    },
  }
}

export const merchantCatalogSourceIntake = { inspectCatalogSource }

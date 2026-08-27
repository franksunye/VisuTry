import type { CatalogFrameInput } from './merchant-onboarding'

export const MAX_SOURCE_URLS = 5
export const MAX_SOURCE_PRODUCTS = 20
// Shopify's public products endpoint supports this page size. Generic HTML
// extraction uses the same review budget, while CSV has its own row budget.
export const MAX_HUMAN_URL_PRODUCTS = 250
export const MAX_CSV_ROWS = 1000
export const MAX_CSV_BYTES = 2 * 1024 * 1024

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
  sourceLabel?: string
}

export type ExtractedProduct = {
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
  sourceLabel?: string
  sourceIssues?: string[]
}

export type CatalogSourceDocument = {
  url: string
  body: string
  contentType: string
}

export type CatalogSourceExistingFrame = {
  id?: string
  sku: string | null
  productUrl: string | null
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
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseFloat(value.replace(/[^0-9.-]/gu, ''))
      : Number.NaN
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null
}

export function isHttpUrl(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function canonicalUrl(value: string | null): string | null {
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
    if (key && names.includes(key.toLowerCase())) return asString((property as { value?: unknown }).value)
  }
  return null
}

function productFromJsonLd(product: Record<string, unknown>, sourceUrl: string): ExtractedProduct {
  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers
  const offer = offers && typeof offers === 'object' ? offers as Record<string, unknown> : {}
  const productUrl = canonicalUrl(asString(product.url)) ?? canonicalUrl(sourceUrl)
  return {
    sku: asString(product.sku) ?? asString(product.mpn) ?? asString(product.productID),
    name: asString(product.name),
    brand: asString(product.brand),
    imageUrl: firstImage(product.image),
    productUrl,
    price: priceInMinorUnits(offer.price ?? product.price),
    currency: (asString(offer.priceCurrency ?? product.priceCurrency) ?? '').toLowerCase() || null,
    shape: additionalPropertyValue(product, ['shape', 'frame shape']) ?? asString(product.shape),
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
      // Malformed structured data is reported as an empty extraction.
    }
  }
  return blocks
}

function metaContent(html: string, property: string): string | null {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'iu')
  return clean(html.match(pattern)?.[1])
}

function extractAnchors(html: string, sourceUrl: string, maxProducts = MAX_SOURCE_PRODUCTS): string[] {
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
  return [...urls].slice(0, maxProducts)
}

function extractProductsFromDocument(html: string, sourceUrl: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = []
  for (const block of jsonLdBlocks(html)) collectProductObjects(block, sourceUrl, products)
  if (products.length > 0) return products

  const title = metaContent(html, 'og:title')
  const imageUrl = metaContent(html, 'og:image')
  const productUrl = canonicalUrl(metaContent(html, 'og:url')) ?? canonicalUrl(sourceUrl)
  if (title && /(?:product|products|item|items|\/p\/)/iu.test(new URL(sourceUrl).pathname)) {
    return [{ name: title, imageUrl, productUrl, source: 'EXTERNAL', externalId: productUrl, sourceUrl }]
  }
  return []
}

export function extractCatalogProductsFromHtml(html: string, sourceUrl: string): ExtractedProduct[] {
  return extractProductsFromDocument(html, sourceUrl)
}

export function extractCatalogProductLinksFromHtml(html: string, sourceUrl: string, maxProducts = MAX_SOURCE_PRODUCTS): string[] {
  return extractAnchors(html, sourceUrl, maxProducts)
}

export function extractCatalogSitemapUrls(xml: string, sourceUrl: string, maxUrls = MAX_SOURCE_PRODUCTS): string[] {
  const base = new URL(sourceUrl)
  const urls = new Set<string>()
  const pattern = /<loc[^>]*>\s*([^<]+?)\s*<\/loc>/giu
  for (const match of xml.matchAll(pattern)) {
    try {
      const candidate = new URL(match[1].trim(), base)
      if (candidate.origin !== base.origin || !['http:', 'https:'].includes(candidate.protocol)) continue
      candidate.hash = ''
      urls.add(candidate.toString())
    } catch {
      // Ignore malformed sitemap entries.
    }
  }
  return [...urls].slice(0, maxUrls)
}

function shopifyImage(value: unknown): string | null {
  if (typeof value === 'string') return clean(value)
  if (value && typeof value === 'object' && 'src' in value) return clean((value as { src?: unknown }).src)
  return null
}

function shopifyOptionValue(options: unknown, names: string[]): string | null {
  if (!Array.isArray(options)) return null
  for (const option of options) {
    if (!option || typeof option !== 'object') continue
    const object = option as { name?: unknown; value?: unknown; values?: unknown }
    const name = asString(object.name)?.toLowerCase()
    if (!name || !names.includes(name)) continue
    const values = Array.isArray(object.values) ? object.values : [object.value]
    return asString(values[0])
  }
  return null
}

export function extractCatalogProductsFromShopifyJson(value: unknown, sourceUrl: string, maxProducts = MAX_SOURCE_PRODUCTS): ExtractedProduct[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { products?: unknown }).products)) return []
  const base = new URL(sourceUrl)
  const products: ExtractedProduct[] = []
  for (const product of (value as { products: unknown[] }).products) {
    if (!product || typeof product !== 'object') continue
    const item = product as Record<string, unknown>
    const title = asString(item.title)
    const handle = asString(item.handle)
    if (!title || !handle) continue
    const productUrl = new URL(`/products/${handle}`, base).toString()
    const variants = Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : [null]
    for (const variant of variants) {
      if (products.length >= maxProducts) return products
      const variantObject = variant && typeof variant === 'object' ? variant as Record<string, unknown> : {}
      const variantTitle = asString(variantObject.title)
      const name = variantTitle && variantTitle.toLowerCase() !== 'default title' ? `${title} — ${variantTitle}` : title
      const sku = asString(variantObject.sku) ?? `${asString(item.id) ?? handle}${variantObject.id ? `-${String(variantObject.id)}` : ''}`
      const image = shopifyImage(variantObject.featured_image) ?? shopifyImage(item.image) ?? shopifyImage(Array.isArray(item.images) ? item.images[0] : null)
      const price = priceInMinorUnits(variantObject.price ?? item.price)
      products.push({
        sku,
        name,
        brand: asString(item.vendor),
        imageUrl: image,
        productUrl,
        price,
        currency: asString(item.currency) ?? null,
        shape: shopifyOptionValue(item.options, ['shape', 'frame shape']),
        material: shopifyOptionValue(item.options, ['material']),
        color: shopifyOptionValue(item.options, ['color', 'colour']),
        styleTags: asStringArray(item.tags),
        collectionTags: asStringArray(item.product_type),
        source: 'EXTERNAL',
        externalId: variantObject.id ? `${String(item.id ?? handle)}:${String(variantObject.id)}` : productUrl,
        sourceUrl,
      })
    }
  }
  return products
}

function normalizeCandidate(product: ExtractedProduct): CatalogImportCandidate {
  const sku = clean(product.sku)
  const name = clean(product.name)
  const imageUrl = clean(product.imageUrl)
  const productUrl = canonicalUrl(clean(product.productUrl))
  const shape = clean(product.shape)
  const issues: string[] = [...(product.sourceIssues ?? [])]
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
    ...(product.sourceLabel ? { sourceLabel: product.sourceLabel } : {}),
  }
}

function likelyProductSourceUrl(url: string): boolean {
  try {
    return /(?:^|\/)(?:product|products|item|items|p)(?:\/|$)/iu.test(new URL(url).pathname)
  } catch {
    return false
  }
}

export type SourceIssue = { sourceUrl: string; code: string; message: string }

export type ProgressiveSourceInspection = {
  candidates: ExtractedProduct[]
  fetchedUrls: string[]
  issues: SourceIssue[]
  platform?: 'SHOPIFY' | 'STRUCTURED_DATA' | 'SITEMAP' | 'GENERIC_HTML' | 'BROWSER_RENDER'
}

function sourceError(error: unknown, fallback: MerchantSourceIntakeError) {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return { code: String((error as { code: unknown }).code), message: String((error as { message: unknown }).message) }
  }
  return { code: fallback.code, message: fallback.message }
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

export async function buildCatalogInspectionProposal(input: {
  sourceUrls?: string[]
  manualProducts?: CatalogFrameInput[]
  existing: CatalogSourceExistingFrame[]
  fetchSource: (url: string) => Promise<CatalogSourceDocument>
  inspectSource?: (url: string, maxProducts: number) => Promise<ProgressiveSourceInspection>
  maxProducts?: number
  initialSourceIssues?: SourceIssue[]
}) {
  const maxProducts = input.maxProducts ?? MAX_SOURCE_PRODUCTS
  const sourceUrls = [...new Set((input.sourceUrls ?? []).map((url) => url.trim()).filter(Boolean))]
  const manualProducts = input.manualProducts ?? []
  if (sourceUrls.length === 0 && manualProducts.length === 0) {
    throw new MerchantSourceIntakeError('SOURCE_REQUIRED', 'Provide a public product/catalog URL, CSV file, or a small structured product set.')
  }
  if (sourceUrls.length > MAX_SOURCE_URLS) throw new MerchantSourceIntakeError('TOO_MANY_SOURCE_URLS', `A maximum of ${MAX_SOURCE_URLS} source URLs is supported.`)
  if (manualProducts.length > maxProducts) throw new MerchantSourceIntakeError('TOO_MANY_PRODUCTS', `A maximum of ${maxProducts} products is supported per review.`)

  const extracted: ExtractedProduct[] = []
  const sourceIssues: SourceIssue[] = [...(input.initialSourceIssues ?? [])]
  const fetchedUrls: string[] = []
  const detectedPlatforms = new Set<string>()
  for (const sourceUrl of sourceUrls) {
    const remaining = maxProducts - extracted.length
    if (remaining <= 0) {
      sourceIssues.push({ sourceUrl, code: 'TOO_MANY_PRODUCTS', message: `Only the first ${maxProducts} products were retained for this review.` })
      break
    }
    if (input.inspectSource) {
      try {
        const inspected = await input.inspectSource(sourceUrl, remaining)
        extracted.push(...inspected.candidates.slice(0, remaining))
        fetchedUrls.push(...inspected.fetchedUrls)
        sourceIssues.push(...inspected.issues)
        if (inspected.platform) detectedPlatforms.add(inspected.platform)
      } catch (error) {
        sourceIssues.push({ sourceUrl, ...sourceError(error, new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'The source could not be inspected.')) })
      }
      continue
    }
    const candidates: ExtractedProduct[] = []
    const fetch = async (target: string) => {
      const document = await input.fetchSource(target)
      const contentType = document.contentType.split(';')[0].trim().toLowerCase()
      if (contentType && !['text/html', 'application/xhtml+xml'].includes(contentType)) {
        throw new MerchantSourceIntakeError('UNSUPPORTED_SOURCE', 'The source is not an HTML product page.')
      }
      fetchedUrls.push(document.url)
      return document
    }
    try {
      const document = await fetch(sourceUrl)
      candidates.push(...extractProductsFromDocument(document.body, document.url))
      if (candidates.length === 0 && !likelyProductSourceUrl(sourceUrl)) {
        const discovered = extractAnchors(document.body, document.url)
        if (discovered.length >= remaining) sourceIssues.push({ sourceUrl, code: 'TOO_MANY_PRODUCTS', message: `Only the first ${remaining} product links were inspected.` })
        for (const productUrl of discovered.slice(0, remaining)) {
          try {
            const productDocument = await fetch(productUrl)
            candidates.push(...extractProductsFromDocument(productDocument.body, productDocument.url))
            if (candidates.length >= remaining) {
              sourceIssues.push({ sourceUrl, code: 'TOO_MANY_PRODUCTS', message: `Only the first ${remaining} products were retained.` })
              break
            }
          } catch (error) {
            sourceIssues.push({ sourceUrl, ...sourceError(error, new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'A discovered product page could not be inspected.')) })
          }
        }
      }
      if (candidates.length === 0) sourceIssues.push({ sourceUrl, code: 'NO_PRODUCTS_FOUND', message: 'No deterministic product records were found at this source.' })
      extracted.push(...candidates.slice(0, remaining))
    } catch (error) {
      sourceIssues.push({ sourceUrl, ...sourceError(error, new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'The source could not be inspected.')) })
    }
  }
  extracted.push(...manualProducts.map((product, index) => ({ ...product, source: product.source ?? 'MANUAL', sourceUrl: 'manual://merchant-provided', sourceLabel: `ROW_${index + 1}` })))

  const existingSkus = new Set(input.existing.map((frame) => clean(frame.sku)).filter((value): value is string => Boolean(value)))
  const existingUrls = new Set(input.existing.map((frame) => canonicalUrl(frame.productUrl)).filter((value): value is string => Boolean(value)))
  const seenSkus = new Set<string>()
  const seenUrls = new Set<string>()
  const candidates = extracted.slice(0, maxProducts).map(normalizeCandidate).map((candidate) => {
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
  return {
    proposal: true,
    writePerformed: false,
    requiresApproval: true,
    sourceSummary: {
      sourceUrls,
      sourceHostnames,
      platforms: [...detectedPlatforms],
      fetchedPageCount: fetchedUrls.length,
      foundCount: candidates.length,
      readyToImport: importable.length,
      needsReview: candidates.filter((candidate) => candidate.status === 'NEEDS_REVIEW').length,
      invalid: candidates.filter((candidate) => candidate.status === 'INVALID').length,
      sourceIssues,
    },
    candidates,
    importReady: importable,
    limits: { maxSourceUrls: MAX_SOURCE_URLS, maxDiscoveredProducts: maxProducts },
  }
}

function normalizedCsvHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/gu, '')
}

const CSV_HEADERS: Record<string, keyof CatalogFrameInput | 'priceMinor' | 'tags' | 'collections'> = {
  sku: 'sku', id: 'sku', name: 'name', productname: 'name', brand: 'brand', variant: 'variant',
  image: 'imageUrl', imageurl: 'imageUrl', productimage: 'imageUrl', url: 'productUrl', producturl: 'productUrl', link: 'productUrl',
  price: 'price', priceminor: 'priceMinor', currency: 'currency', shape: 'shape', material: 'material', color: 'color',
  width: 'widthClass', widthclass: 'widthClass', tags: 'tags', styletags: 'styleTags', collections: 'collections', collectiontags: 'collectionTags',
  externalid: 'externalId', sourcenotes: 'sourceNotes',
}

function parseCsvRecords(text: string): { rows: string[][]; issues: Array<{ row: number; message: string }> } {
  const rows: string[][] = []
  const issues: Array<{ row: number; message: string }> = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let rowNumber = 1
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (field.length === 0 || quoted) {
        quoted = !quoted
      } else {
        field += char
      }
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
      rowNumber += 1
    } else {
      field += char
    }
  }
  if (quoted) issues.push({ row: rowNumber, message: 'The CSV contains an unclosed quoted field.' })
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.trim())) rows.push(row)
  }
  return { rows, issues }
}

function splitCsvTags(value: string | undefined): string[] {
  return value?.split(/[|;]/u).map((item) => item.trim()).filter(Boolean).slice(0, 20) ?? []
}

export function parseCatalogCsv(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_CSV_BYTES) throw new MerchantSourceIntakeError('CSV_TOO_LARGE', `CSV files must be smaller than ${Math.floor(MAX_CSV_BYTES / 1024 / 1024)} MB.`)
  const parsed = parseCsvRecords(text)
  const [headerRow, ...dataRows] = parsed.rows
  if (!headerRow || headerRow.length === 0) throw new MerchantSourceIntakeError('CSV_HEADER_REQUIRED', 'The CSV must include a header row.')
  const headers = headerRow.map(normalizedCsvHeader)
  const mapped = headers.map((header) => CSV_HEADERS[header])
  if (!mapped.includes('sku') || !mapped.includes('name')) throw new MerchantSourceIntakeError('CSV_HEADER_REQUIRED', 'The CSV must include at least sku and name columns.')
  if (dataRows.length > MAX_CSV_ROWS) throw new MerchantSourceIntakeError('CSV_TOO_MANY_ROWS', `CSV files can contain up to ${MAX_CSV_ROWS} product rows per approval.`)
  const issues: Array<{ row: number; code: string; message: string }> = parsed.issues.map((issue) => ({ row: issue.row, code: 'CSV_MALFORMED', message: issue.message }))
  const products: Array<CatalogFrameInput & { sourceIssues?: string[] }> = []
  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2
    if (row.length !== headers.length) issues.push({ row: rowNumber, code: 'CSV_COLUMN_MISMATCH', message: `Expected ${headers.length} columns but found ${row.length}.` })
    const values = new Map<string, string>()
    for (let column = 0; column < headers.length; column += 1) {
      const mappedHeader = mapped[column]
      if (mappedHeader) values.set(mappedHeader, (row[column] ?? '').trim())
    }
    const get = (name: string) => values.get(name) || undefined
    const priceMinor = get('priceMinor')
    const rawPrice = get('price')
    const price = priceMinor ? Number.parseInt(priceMinor, 10) : priceInMinorUnits(rawPrice)
    const productIssues: string[] = []
    if (priceMinor && (!Number.isInteger(price) || (price as number) < 0)) {
      issues.push({ row: rowNumber, code: 'INVALID_PRICE', message: 'priceMinor must be a non-negative integer.' })
      productIssues.push('INVALID_PRICE')
    }
    if (!priceMinor && rawPrice && price === null) {
      issues.push({ row: rowNumber, code: 'INVALID_PRICE', message: 'price must be a valid non-negative amount.' })
      productIssues.push('INVALID_PRICE')
    }
    products.push({
      sku: get('sku') ?? '', name: get('name') ?? '', brand: get('brand'), variant: get('variant'),
      imageUrl: get('imageUrl'), productUrl: get('productUrl'), price: price ?? null, currency: get('currency'),
      shape: get('shape') ?? '', material: get('material'), color: get('color'), widthClass: get('widthClass'),
      styleTags: splitCsvTags(get('styleTags') ?? get('tags')), collectionTags: splitCsvTags(get('collectionTags') ?? get('collections')),
      source: 'CSV', externalId: get('externalid'), sourceNotes: get('sourcenotes') ?? `CSV row ${rowNumber}`,
      ...(productIssues.length > 0 ? { sourceIssues: productIssues } : {}),
    })
  }
  return { products, issues }
}

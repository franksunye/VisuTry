import { getCloudflareSql } from '@/data/neon-cloudflare'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'
import { recordMerchantAgentOperation } from './merchant-agent-credentials-cloudflare'
import type { CatalogFrameInput } from './merchant-onboarding-cloudflare'
import { inspectCatalogUrlProgressively } from './merchant-catalog-url-progressive'
import {
  buildCatalogInspectionProposal,
  MAX_CSV_BYTES,
  MAX_CSV_ROWS,
  MAX_HUMAN_URL_PRODUCTS,
  MAX_SOURCE_PRODUCTS,
  MerchantSourceIntakeError,
  parseCatalogCsv,
  type CatalogSourceDocument,
} from './merchant-catalog-source-shared'

const MAX_RESPONSE_BYTES = 512 * 1024
const MAX_REDIRECTS = 2
const FETCH_TIMEOUT_MS = 3_000

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [first, second] = parts
  return first === 0 || first === 10 || first === 127 || (first === 100 && second >= 64 && second <= 127) || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 198 && (second === 18 || second === 19)) || first >= 224
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, '')
  const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/u)?.[1]
  return normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local') || normalized === 'metadata.google.internal' || normalized === '169.254.169.254' || isPrivateIpv4(normalized) || (mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false) || normalized === '::' || normalized === '::1' || normalized.startsWith('0:') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:') || normalized.startsWith('ff')
}

function validateSourceUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new MerchantSourceIntakeError('INVALID_SOURCE_URL', 'Provide a valid public http(s) URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isBlockedHostname(url.hostname)) {
    throw new MerchantSourceIntakeError('UNSAFE_SOURCE_URL', 'Only public http(s) URLs without credentials are allowed.')
  }
  url.hash = ''
  return url
}

async function readResponseBody(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get('content-length') ?? '')
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new MerchantSourceIntakeError('SOURCE_TOO_LARGE', 'The source page is too large to inspect.')
  if (!response.body) {
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new MerchantSourceIntakeError('SOURCE_TOO_LARGE', 'The source page is too large to inspect.')
    return text
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      total += next.value.byteLength
      if (total > MAX_RESPONSE_BYTES) throw new MerchantSourceIntakeError('SOURCE_TOO_LARGE', 'The source page is too large to inspect.')
      chunks.push(next.value)
    }
  } finally {
    reader.releaseLock()
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

async function fetchMerchantSourceDocumentCloudflare(rawUrl: string): Promise<CatalogSourceDocument> {
  let current = validateSourceUrl(rawUrl)
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(current, { redirect: 'manual', signal: controller.signal })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) throw new MerchantSourceIntakeError('SOURCE_REDIRECT_REJECTED', 'The source returned an invalid redirect.')
        if (redirect >= MAX_REDIRECTS) throw new MerchantSourceIntakeError('SOURCE_REDIRECT_REJECTED', 'The source redirected too many times.')
        const next = validateSourceUrl(new URL(location, current).toString())
        if (next.origin !== current.origin) throw new MerchantSourceIntakeError('SOURCE_REDIRECT_REJECTED', 'Cross-site redirects are not allowed during inspection.')
        current = next
        continue
      }
      if (!response.ok) throw new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'The source could not be inspected.')
      const contentType = response.headers.get('content-type') ?? ''
      const normalizedContentType = contentType.split(';')[0].trim().toLowerCase()
      if (normalizedContentType && ![
        'text/html',
        'application/xhtml+xml',
        'application/json',
        'application/xml',
        'text/xml',
      ].includes(normalizedContentType) && !normalizedContentType.endsWith('+json')) {
        throw new MerchantSourceIntakeError('UNSUPPORTED_SOURCE', 'The source is not a supported ecommerce document.')
      }
      return { url: current.toString(), body: await readResponseBody(response), contentType }
    } catch (error) {
      if (error instanceof MerchantSourceIntakeError) throw error
      throw new MerchantSourceIntakeError('SOURCE_UNREACHABLE', 'The source could not be inspected.')
    } finally {
      clearTimeout(timer)
    }
  }
  throw new MerchantSourceIntakeError('SOURCE_REDIRECT_REJECTED', 'The source redirected too many times.')
}

export async function inspectHumanMerchantCatalogSource(input: {
  actor: MerchantActorContext
  sourceUrls?: string[]
  manualProducts?: CatalogFrameInput[]
  csvText?: string
}) {
  requireAgentScope(input.actor, 'catalog:read')
  if (input.csvText !== undefined && ((input.sourceUrls?.length ?? 0) > 0 || (input.manualProducts?.length ?? 0) > 0)) throw new MerchantSourceIntakeError('INVALID_SOURCE', 'Choose one catalog source at a time.')
  let manualProducts = input.manualProducts
  let initialSourceIssues: Array<{ sourceUrl: string; code: string; message: string }> = []
  let maxProducts = input.sourceUrls?.length ? MAX_HUMAN_URL_PRODUCTS : MAX_SOURCE_PRODUCTS
  if (input.csvText !== undefined) {
    if (new TextEncoder().encode(input.csvText).byteLength > MAX_CSV_BYTES) throw new MerchantSourceIntakeError('CSV_TOO_LARGE', 'CSV files must be smaller than 2 MB.')
    const parsed = parseCatalogCsv(input.csvText)
    manualProducts = parsed.products
    maxProducts = MAX_CSV_ROWS
    initialSourceIssues = parsed.issues.map((issue) => ({ sourceUrl: 'csv://merchant-upload', code: issue.code, message: `Row ${issue.row}: ${issue.message}` }))
  }
  const sql = getCloudflareSql()
  const existing = await sql`SELECT "id", "sku", "productUrl", "externalId", "source" FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId}`
  const result = await buildCatalogInspectionProposal({
    sourceUrls: input.sourceUrls,
    manualProducts,
    existing: existing.map((row) => ({ id: String(row.id), sku: row.sku == null ? null : String(row.sku), productUrl: row.productUrl == null ? null : String(row.productUrl), externalId: row.externalId == null ? null : String(row.externalId), source: row.source == null ? null : String(row.source) })),
    fetchSource: fetchMerchantSourceDocumentCloudflare,
    inspectSource: (sourceUrl, remaining) => inspectCatalogUrlProgressively({
      sourceUrl,
      maxProducts: remaining,
      fetchSource: fetchMerchantSourceDocumentCloudflare,
    }),
    maxProducts,
    initialSourceIssues,
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.source_inspected', resourceType: 'CatalogSource', result: 'SUCCESS' })
  return result
}

export const merchantCatalogSourceIntakeCloudflare = { inspectHumanMerchantCatalogSource }

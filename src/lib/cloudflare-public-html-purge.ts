import 'server-only'
import { logger } from '@/lib/logger'

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'
const PUBLIC_HOST = 'www.visutry.com'
const MAX_PURGE_BATCH_SIZE = 100
const TIMEOUT_MS = 5000

export type PublicHtmlPurgeResult = {
  attempted: boolean
  success: boolean
  urlCount: number
  tagCount?: number
  batchCount?: number
  failedBatchCount?: number
  reason?: string
}

type PublicHtmlPurgeKind = 'files' | 'tags'
type PublicHtmlInvalidationStatus = 'success' | 'failed' | 'not_attempted'

/**
 * Emit bounded public-edge telemetry without allowing observability to alter
 * the post-commit purge result or introduce another network request.
 */
function emitPublicHtmlInvalidationTelemetry(input: {
  kind: PublicHtmlPurgeKind
  status: PublicHtmlInvalidationStatus
  failureReason?: string
  level: 'info' | 'warn' | 'error'
}): void {
  // `status` is the existing schema-approved outcome field. Do not add
  // success/count columns here: the full counts remain in the return value.
  const data = {
    event: 'public_html_invalidation',
    type: input.kind,
    status: input.status,
    source: 'cloudflare',
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
  }

  try {
    if (input.level === 'info') {
      logger.info('store', 'Public HTML invalidation', data)
    } else if (input.level === 'warn') {
      logger.warn('store', 'Public HTML invalidation', data)
    } else {
      logger.error('store', 'Public HTML invalidation', new Error(input.failureReason ?? 'public_html_invalidation_failed'), data)
    }
  } catch {
    // Logging is best effort. A logger/Axiom failure must not affect the
    // already-committed mutation or the purge result returned to its caller.
  }
}

function exactPublicUrl(pathname: string): string | null {
  if (!pathname.startsWith('/') || pathname.includes('?') || pathname.includes('#') || pathname.includes('..') || pathname.includes('*')) return null
  try {
    const url = new URL(pathname, `https://${PUBLIC_HOST}`)
    if (url.hostname !== PUBLIC_HOST || url.pathname !== pathname) return null
    return url.toString()
  } catch {
    return null
  }
}

export function publicHtmlPurgeUrls(paths: readonly string[]): string[] {
  return [...new Set(paths.map(exactPublicUrl).filter((url): url is string => Boolean(url)))]
}

async function requestPurge(
  payload: { files: string[] } | { tags: string[] },
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const token = process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN
  if (!zoneId || !token) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetchImpl(`${CLOUDFLARE_API}/zones/${encodeURIComponent(zoneId)}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const responsePayload = await response.json().catch(() => null) as { success?: boolean } | null
    return response.ok && responsePayload?.success === true
  } finally {
    clearTimeout(timeout)
  }
}

async function purgeBatches(
  items: readonly string[],
  kind: 'files' | 'tags',
  fetchImpl: typeof fetch,
): Promise<{ batchCount: number; failedBatchCount: number }> {
  let failedBatchCount = 0
  const batchCount = Math.ceil(items.length / MAX_PURGE_BATCH_SIZE)
  for (let offset = 0; offset < items.length; offset += MAX_PURGE_BATCH_SIZE) {
    const batch = items.slice(offset, offset + MAX_PURGE_BATCH_SIZE)
    let batchSucceeded = false
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        if (await requestPurge(kind === 'files' ? { files: batch } : { tags: batch }, fetchImpl)) {
          batchSucceeded = true
          break
        }
      } catch {
        // Retry the bounded batch once, then continue so later batches are not
        // silently skipped when one Cloudflare request fails.
      }
    }
    if (!batchSucceeded) failedBatchCount += 1
  }
  return { batchCount, failedBatchCount }
}

/**
 * Purges only exact, pre-derived public URLs. This is post-commit and
 * deliberately fail-open for the successful database mutation: a purge outage
 * must not report or roll back a write that already committed.
 */
export async function purgePublicHtmlUrls(
  paths: readonly string[],
  fetchImpl?: typeof fetch,
): Promise<PublicHtmlPurgeResult> {
  const urls = publicHtmlPurgeUrls(paths)
  if (urls.length === 0) return { attempted: false, success: true, urlCount: 0, reason: 'no-safe-urls' }
  if (!process.env.CLOUDFLARE_ZONE_ID || !process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN) {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'files',
      status: 'not_attempted',
      failureReason: 'purge_credentials_not_configured',
      level: 'warn',
    })
    return { attempted: false, success: false, urlCount: urls.length, reason: 'purge_credentials_not_configured' }
  }

  const requestFetch = fetchImpl ?? globalThis.fetch
  if (typeof requestFetch !== 'function') {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'files',
      status: 'not_attempted',
      failureReason: 'fetch_unavailable',
      level: 'warn',
    })
    return { attempted: false, success: false, urlCount: urls.length, reason: 'fetch_unavailable' }
  }

  const outcome = await purgeBatches(urls, 'files', requestFetch)
  const success = outcome.failedBatchCount === 0
  if (success) {
    emitPublicHtmlInvalidationTelemetry({ kind: 'files', status: 'success', level: 'info' })
  } else {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'files',
      status: 'failed',
      failureReason: 'cloudflare_purge_partial_failure',
      level: 'error',
    })
  }
  return { attempted: true, success, urlCount: urls.length, ...outcome, ...(success ? {} : { reason: 'cloudflare_purge_partial_failure' }) }
}

export async function purgePublicHtmlTags(
  tags: readonly string[],
  fetchImpl?: typeof fetch,
): Promise<PublicHtmlPurgeResult> {
  const safeTags = [...new Set(tags.filter((tag) => /^[\x21-\x7E]+$/u.test(tag) && tag.length <= 1024))]
  if (safeTags.length === 0) return { attempted: false, success: true, urlCount: 0, tagCount: 0, reason: 'no-safe-tags' }
  if (!process.env.CLOUDFLARE_ZONE_ID || !process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN) {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'tags',
      status: 'not_attempted',
      failureReason: 'purge_credentials_not_configured',
      level: 'warn',
    })
    return { attempted: false, success: false, urlCount: 0, tagCount: safeTags.length, reason: 'purge_credentials_not_configured' }
  }

  const requestFetch = fetchImpl ?? globalThis.fetch
  if (typeof requestFetch !== 'function') {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'tags',
      status: 'not_attempted',
      failureReason: 'fetch_unavailable',
      level: 'warn',
    })
    return { attempted: false, success: false, urlCount: 0, tagCount: safeTags.length, reason: 'fetch_unavailable' }
  }

  const outcome = await purgeBatches(safeTags, 'tags', requestFetch)
  const success = outcome.failedBatchCount === 0
  if (success) {
    emitPublicHtmlInvalidationTelemetry({ kind: 'tags', status: 'success', level: 'info' })
  } else {
    emitPublicHtmlInvalidationTelemetry({
      kind: 'tags',
      status: 'failed',
      failureReason: 'cloudflare_purge_partial_failure',
      level: 'error',
    })
  }
  return { attempted: true, success, urlCount: 0, tagCount: safeTags.length, ...outcome, ...(success ? {} : { reason: 'cloudflare_purge_partial_failure' }) }
}

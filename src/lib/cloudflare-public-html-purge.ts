import 'server-only'

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'
const PUBLIC_HOST = 'www.visutry.com'
const MAX_URLS = 200
const TIMEOUT_MS = 5000

function safePurgePaths(urls: readonly string[]): string[] {
  return urls.map((url) => new URL(url).pathname)
}

export type PublicHtmlPurgeResult = {
  attempted: boolean
  success: boolean
  urlCount: number
  reason?: string
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
  return [...new Set(paths.map(exactPublicUrl).filter((url): url is string => Boolean(url)))].slice(0, MAX_URLS)
}

async function requestPurge(
  urls: string[],
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
      body: JSON.stringify({ files: urls }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null) as { success?: boolean } | null
    return response.ok && payload?.success === true
  } finally {
    clearTimeout(timeout)
  }
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
    console.warn(JSON.stringify({ event: 'public_html_invalidation', success: false, urlCount: urls.length, paths: safePurgePaths(urls), reason: 'purge_credentials_not_configured' }))
    return { attempted: false, success: false, urlCount: urls.length, reason: 'purge_credentials_not_configured' }
  }

  const requestFetch = fetchImpl ?? globalThis.fetch
  if (typeof requestFetch !== 'function') {
    console.warn(JSON.stringify({ event: 'public_html_invalidation', success: false, urlCount: urls.length, paths: safePurgePaths(urls), reason: 'fetch_unavailable' }))
    return { attempted: false, success: false, urlCount: urls.length, reason: 'fetch_unavailable' }
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      if (await requestPurge(urls, requestFetch)) {
        console.info(JSON.stringify({ event: 'public_html_invalidation', success: true, urlCount: urls.length, paths: safePurgePaths(urls) }))
        return { attempted: true, success: true, urlCount: urls.length }
      }
    } catch (error) {
      if (attempt === 2) {
        console.error(JSON.stringify({ event: 'public_html_invalidation', success: false, urlCount: urls.length, paths: safePurgePaths(urls), reason: error instanceof Error ? error.name : 'purge_request_failed' }))
      }
    }
  }

  return { attempted: true, success: false, urlCount: urls.length, reason: 'cloudflare_purge_failed' }
}

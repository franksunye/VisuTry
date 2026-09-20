/**
 * Strict semantic gate for the first Store/Campaign public HTML edge slice.
 * The Worker Route is intentionally broader; malformed or non-document
 * variants still proxy to Vercel and never enter this cache.
 */

import {
  hasPreviewOrPersonalizationSignal,
  hasRscOrPrefetchSignal,
  headerHasValue,
} from './public-html-offload'

export const STORE_CAMPAIGN_EDGE_LOCALES = ['en'] as const
export const STORE_CAMPAIGN_PUBLIC_HTML_CACHE_TTL_SECONDS = 3600
export const STORE_CAMPAIGN_PUBLIC_HTML_HOST = 'www.visutry.com'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const MAX_MERCHANT_SLUG_LENGTH = 180
const MAX_EXPERIENCE_SLUG_LENGTH = 240
const SAFE_QUERY_KEYS = new Set([
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid',
  'source', 'medium', 'surface', 'campaign', 'merchantContinuation',
])

export type StoreCampaignPublicHtmlRoute = {
  surface: 'STORE' | 'CAMPAIGN'
  locale: 'en'
  merchantSlug: string
  experienceSlug?: string
}

function isSlug(value: string, maxLength: number): boolean {
  return value.length > 0 && value.length <= maxLength && SLUG.test(value)
}

function isSafeQueryKey(key: string): boolean {
  return key.startsWith('utm_') || SAFE_QUERY_KEYS.has(key)
}

/** Unknown query parameters fail open. Attribution is client-only on this surface. */
export function isSafeStoreCampaignQuery(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (!isSafeQueryKey(key)) return false
    if (key === 'merchantContinuation' && (url.searchParams.get(key)?.length ?? 0) > 1200) return false
  }
  return true
}

export function storeCampaignPublicHtmlRoute(pathname: string): StoreCampaignPublicHtmlRoute | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'en') return null

  if (segments.length === 3 && segments[1] === 'store' && isSlug(segments[2], MAX_MERCHANT_SLUG_LENGTH)) {
    return { surface: 'STORE', locale: 'en', merchantSlug: segments[2] }
  }

  if (
    segments.length === 4
    && segments[1] === 'c'
    && isSlug(segments[2], MAX_MERCHANT_SLUG_LENGTH)
    && isSlug(segments[3], MAX_EXPERIENCE_SLUG_LENGTH)
  ) {
    return { surface: 'CAMPAIGN', locale: 'en', merchantSlug: segments[2], experienceSlug: segments[3] }
  }

  return null
}

export function isStoreCampaignPublicHtmlPath(pathname: string): boolean {
  return storeCampaignPublicHtmlRoute(pathname) !== null
}

export function isStoreCampaignPublicHtmlEligible(request: Request): boolean {
  const url = new URL(request.url)
  if (url.hostname !== STORE_CAMPAIGN_PUBLIC_HTML_HOST) return false
  if (!storeCampaignPublicHtmlRoute(url.pathname)) return false
  if (!isSafeStoreCampaignQuery(url)) return false
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (headerHasValue(request, 'authorization') || headerHasValue(request, 'cookie')) return false
  if (hasRscOrPrefetchSignal(request) || hasPreviewOrPersonalizationSignal(request)) return false

  const destination = request.headers.get('sec-fetch-dest')
  if (destination && destination.toLowerCase() !== 'document') return false
  const accept = request.headers.get('accept')?.toLowerCase()
  return !accept || accept.includes('text/html') || accept.includes('*/*')
}

/** Safe attribution values do not affect server HTML and are omitted from the cache key. */
export function storeCampaignPublicHtmlCacheKey(request: Request): Request {
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  return new Request(url.toString(), { method: 'GET' })
}

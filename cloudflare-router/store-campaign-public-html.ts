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
import {
  STORE_CAMPAIGN_EDGE_LOCALES,
  STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH,
  STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH,
  STORE_CAMPAIGN_PUBLIC_HTML_CACHE_TTL_SECONDS,
  publicCampaignEdgeCacheTag,
  publicStoreEdgeCacheTag,
  storeCampaignEdgeRoute,
  type StoreCampaignEdgeRoute,
} from '../src/modules/store/application/public-edge-contract'

export const STORE_CAMPAIGN_PUBLIC_HTML_HOST = 'www.visutry.com'
const SAFE_QUERY_KEYS = new Set([
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid',
  'source', 'medium', 'surface', 'campaign', 'merchantContinuation',
])

export type StoreCampaignPublicHtmlRoute = StoreCampaignEdgeRoute

export {
  STORE_CAMPAIGN_EDGE_LOCALES,
  STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH,
  STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH,
  STORE_CAMPAIGN_PUBLIC_HTML_CACHE_TTL_SECONDS,
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
  return storeCampaignEdgeRoute(pathname)
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

/**
 * Cache-Tag is attached to the cached Vercel response, not exposed as a
 * client-facing header. It gives writes a globally purgeable identity even
 * though safe attribution query strings intentionally share one Cache API key.
 */
export function storeCampaignPublicHtmlCacheTag(request: Request): string | null {
  const route = storeCampaignPublicHtmlRoute(new URL(request.url).pathname)
  return route?.surface === 'STORE'
    ? publicStoreEdgeCacheTag(route.merchantSlug)
    : route?.surface === 'CAMPAIGN'
      ? publicCampaignEdgeCacheTag(route.merchantSlug, route.experienceSlug)
      : null
}

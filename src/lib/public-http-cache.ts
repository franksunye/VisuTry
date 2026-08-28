/**
 * CDN cache headers for anonymous public GET responses.
 *
 * Browser cache stays disabled (`max-age=0`) so clients still revalidate.
 * Shared caches (Vercel CDN) hold the payload and collapse origin hits.
 *
 * These headers are not sufficient on their own: public catalog loaders also
 * use Next.js `unstable_cache` (tag `glasses-catalog`) and the Cloudflare
 * Worker Cache API for approved edge catalog JSON.
 */
export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'

export const PUBLIC_MERCHANT_CACHE_CONTROL =
  'public, max-age=0, s-maxage=300, stale-while-revalidate=60'

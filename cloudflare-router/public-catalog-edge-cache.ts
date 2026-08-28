import { PUBLIC_CATALOG_CACHE_CONTROL } from '../src/lib/public-http-cache'

/**
 * Cloudflare Cache API helper for approved public catalog JSON.
 *
 * Workers Caching is intentionally disabled in wrangler (Static Assets quota).
 * `caches.default` still lets this Worker skip Neon on repeat anonymous GETs
 * even though the Worker itself still runs (cf-cache-status may stay DYNAMIC).
 *
 * Cache key: scheme + host + path, GET method, query ignored (list endpoints
 * have no required query). Authorization bypasses cache. 5xx is never stored.
 * Stored TTL is 3600s via Cache-Control max-age on the *stored* copy.
 * Clients still receive PUBLIC_CATALOG_CACHE_CONTROL (browser max-age=0).
 */
export const CATALOG_EDGE_CACHE_HEADER = 'x-visutry-catalog-cache'
export const CATALOG_EDGE_CACHE_TTL_SECONDS = 3600

export type CatalogEdgeCacheStatus = 'hit' | 'miss' | 'bypass'

export type CatalogEdgeCache = {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

export function catalogEdgeCacheKey(request: Request): Request {
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  return new Request(url.toString(), { method: 'GET' })
}

export function shouldBypassCatalogEdgeCache(request: Request): boolean {
  return Boolean(request.headers.get('authorization'))
}

export function getCatalogEdgeCache(): CatalogEdgeCache | null {
  const injected = (globalThis as { __VISUTRY_CATALOG_EDGE_CACHE__?: CatalogEdgeCache }).__VISUTRY_CATALOG_EDGE_CACHE__
  if (injected) return injected
  try {
    const cachesApi = (globalThis as { caches?: { default?: CatalogEdgeCache } }).caches
    return cachesApi?.default ?? null
  } catch {
    return null
  }
}

function withCatalogCacheStatus(response: Response, status: CatalogEdgeCacheStatus): Response {
  const headers = new Headers(response.headers)
  headers.set(CATALOG_EDGE_CACHE_HEADER, status)
  headers.set('Cache-Control', PUBLIC_CATALOG_CACHE_CONTROL)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function matchCatalogEdgeCache(request: Request): Promise<Response | null> {
  if (shouldBypassCatalogEdgeCache(request)) return null
  const cache = getCatalogEdgeCache()
  if (!cache) return null
  const cached = await cache.match(catalogEdgeCacheKey(request))
  if (!cached) return null
  const restored = withCatalogCacheStatus(cached, 'hit')
  if (request.method === 'HEAD') {
    return new Response(null, { status: restored.status, statusText: restored.statusText, headers: restored.headers })
  }
  return restored
}

export async function storeCatalogEdgeCache(request: Request, response: Response): Promise<void> {
  if (shouldBypassCatalogEdgeCache(request)) return
  if (response.status !== 200) return
  const cache = getCatalogEdgeCache()
  if (!cache) return
  const stored = response.clone()
  stored.headers.set('Cache-Control', `public, max-age=${CATALOG_EDGE_CACHE_TTL_SECONDS}`)
  stored.headers.delete(CATALOG_EDGE_CACHE_HEADER)
  await cache.put(catalogEdgeCacheKey(request), stored)
}

export function markCatalogEdgeCacheStatus(
  response: Response,
  status: CatalogEdgeCacheStatus,
): Response {
  return withCatalogCacheStatus(response, status)
}

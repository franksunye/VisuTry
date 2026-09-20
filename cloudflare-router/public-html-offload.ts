/**
 * Explicit, production-only public HTML offload capability.
 *
 * Vercel remains the canonical Next producer. This module only lets the
 * app-host Worker cache a small, reviewed allowlist of anonymous HTML
 * responses after fetching the response from Vercel. Adding another page is
 * a configuration review: add one exact path here and one exact Worker Route
 * per approved page. The allowlist is intentionally small and finite.
 * There is no wildcard or locale-family matching.
 *
 * Invalidation is URL-scoped: after a verified production deployment, purge
 * the exact `https://www.visutry.com<path>` URL through the existing Cloudflare
 * cache purge workflow before relying on the one-hour edge copy.
 */

export const PUBLIC_HTML_OFFLOAD_CACHE_CLASS = 'public-html-offload' as const
export const PUBLIC_HTML_OFFLOAD_CACHE_HEADER = 'x-visutry-edge-cache'
export const PUBLIC_HTML_OFFLOAD_CACHE_TTL_SECONDS = 3600
export const PUBLIC_HTML_OFFLOAD_PUBLIC_HOST = 'www.visutry.com'

export const PUBLIC_HTML_OFFLOAD_ROUTES = [
  {
    path: '/en',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/face-shape-detector',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/face-shape-detector/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/what-glasses-suit-my-face',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/what-glasses-suit-my-face/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/ai-glasses-advisor',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/ai-glasses-advisor/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/virtual-glasses-try-on',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/virtual-glasses-try-on/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/blog/ai-face-analysis-for-glasses-guide',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/blog/ai-face-analysis-for-glasses-guide/page.tsx',
    purge: 'exact-url',
  },
  {
    path: '/en/brand/gentle-monster',
    methods: ['GET', 'HEAD'],
    source: 'src/app/[locale]/(public)/brand/[brand]/page.tsx',
    purge: 'exact-url',
  },
] as const

export const PUBLIC_HTML_OFFLOAD_PURGE_URLS = PUBLIC_HTML_OFFLOAD_ROUTES.map(
  ({ path }) => `https://${PUBLIC_HTML_OFFLOAD_PUBLIC_HOST}${path}`,
)

export type PublicHtmlOffloadCacheStatus = 'HIT' | 'MISS' | 'BYPASS'

export type PublicHtmlOffloadCache = {
  match(request: Request): Promise<Response | undefined | null>
  put(request: Request, response: Response): Promise<void>
}

export type PublicHtmlOffloadRuntime = {
  cache?: PublicHtmlOffloadCache | null
  fetchOrigin(request: Request): Promise<Response>
  waitUntil?(promise: Promise<unknown>): void
}

export type PublicHtmlOffloadPolicy = {
  isEligible: (request: Request) => boolean
  cacheKey: (request: Request) => Request
  cacheTag?: (request: Request) => string | null
  ttlSeconds?: number
}

export type PublicHtmlOffloadResult = {
  response: Response
  status: PublicHtmlOffloadCacheStatus
}

export function headerHasValue(request: Request, name: string): boolean {
  const value = request.headers.get(name)
  return value != null && value.trim() !== ''
}

export function hasRscOrPrefetchSignal(request: Request): boolean {
  const url = new URL(request.url)
  if (url.searchParams.has('_rsc')) return true
  if (headerHasValue(request, 'rsc')) return true
  if (headerHasValue(request, 'next-router-prefetch')) return true
  if (headerHasValue(request, 'next-router-state-tree')) return true
  if (headerHasValue(request, 'x-middleware-prefetch')) return true

  const accept = request.headers.get('accept')?.toLowerCase() || ''
  if (accept.includes('text/x-component')) return true

  const purpose = `${request.headers.get('purpose') || ''} ${request.headers.get('sec-purpose') || ''}`.toLowerCase()
  return purpose.includes('prefetch')
}

export function hasPreviewOrPersonalizationSignal(request: Request): boolean {
  return [
    'x-vercel-protection-bypass',
    'x-middleware-subrequest',
    'x-prerender-revalidate',
    'x-preview',
    'x-draft-mode',
    'x-user-id',
    'x-personalized',
  ].some((name) => headerHasValue(request, name))
}

/** Exact path membership; trailing slash and sibling paths are not enabled. */
export function isPublicHtmlOffloadPath(pathname: string): boolean {
  return PUBLIC_HTML_OFFLOAD_ROUTES.some((route) => route.path === pathname)
}

/**
 * Only a clean, anonymous document request can use the HTML cache.
 * Missing browser headers are allowed for controlled HTTP probes; ambiguous
 * or explicitly non-document signals fail open to Vercel.
 */
export function isPublicHtmlOffloadEligible(request: Request): boolean {
  const url = new URL(request.url)
  if (url.hostname !== PUBLIC_HTML_OFFLOAD_PUBLIC_HOST) return false
  if (!isPublicHtmlOffloadPath(url.pathname)) return false
  if (url.search !== '') return false
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (headerHasValue(request, 'authorization') || headerHasValue(request, 'cookie')) return false
  if (hasRscOrPrefetchSignal(request) || hasPreviewOrPersonalizationSignal(request)) return false

  const destination = request.headers.get('sec-fetch-dest')
  if (destination && destination.toLowerCase() !== 'document') return false

  const accept = request.headers.get('accept')?.toLowerCase()
  if (accept && !accept.includes('text/html') && !accept.includes('*/*')) return false
  return true
}

export function publicHtmlOffloadCacheKey(request: Request): Request {
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  return new Request(url.toString(), { method: 'GET' })
}

export function getPublicHtmlOffloadCache(): PublicHtmlOffloadCache | null {
  const injected = (globalThis as { __VISUTRY_PUBLIC_HTML_OFFLOAD_CACHE__?: PublicHtmlOffloadCache }).__VISUTRY_PUBLIC_HTML_OFFLOAD_CACHE__
  if (injected) return injected
  try {
    const cachesApi = (globalThis as { caches?: { default?: PublicHtmlOffloadCache } }).caches
    return cachesApi?.default ?? null
  } catch {
    return null
  }
}

export function isCacheablePublicHtmlResponse(response: Response): boolean {
  if (response.status !== 200) return false
  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  if (!contentType.includes('text/html')) return false
  if (response.headers.has('set-cookie')) return false
  if (response.headers.has('location')) return false

  const cacheControl = response.headers.get('cache-control')?.toLowerCase() || ''
  if (/(^|,)\s*(private|no-store|no-cache)(\s|,|$)/.test(cacheControl)) return false

  const vary = response.headers.get('vary')?.toLowerCase() || ''
  if (vary === '*' || vary.includes('cookie') || vary.includes('authorization')) return false
  return true
}

function responseWithCacheStatus(
  request: Request,
  response: Response,
  status: PublicHtmlOffloadCacheStatus,
  ttlSeconds: number,
): Response {
  const headers = new Headers(response.headers)
  headers.set(PUBLIC_HTML_OFFLOAD_CACHE_HEADER, status)
  // Cache-Tag is an edge purge index, not a client-facing application header.
  // Cloudflare strips it at the network boundary; delete it here as well so
  // local tests and alternate runtimes preserve the same contract.
  headers.delete('Cache-Tag')
  if (status === 'HIT') {
    headers.set(
      'Cache-Control',
      `public, s-maxage=${ttlSeconds}, max-age=0, must-revalidate`,
    )
  }
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function originRequestForCacheFill(request: Request): Request {
  if (request.method !== 'HEAD') return request
  return new Request(request, { method: 'GET' })
}

async function fetchBypass(
  request: Request,
  runtime: PublicHtmlOffloadRuntime,
  ttlSeconds: number,
): Promise<PublicHtmlOffloadResult> {
  const origin = await runtime.fetchOrigin(originRequestForCacheFill(request))
  return {
    response: responseWithCacheStatus(request, origin, 'BYPASS', ttlSeconds),
    status: 'BYPASS',
  }
}

/**
 * Fetches Vercel on MISS and asynchronously stores only safe 200 HTML. Cache
 * API failures are fail-open: the caller still receives the origin response.
 */
export async function handlePublicHtmlOffload(
  request: Request,
  runtime: PublicHtmlOffloadRuntime,
  policy: PublicHtmlOffloadPolicy = {
    isEligible: isPublicHtmlOffloadEligible,
    cacheKey: publicHtmlOffloadCacheKey,
    ttlSeconds: PUBLIC_HTML_OFFLOAD_CACHE_TTL_SECONDS,
  },
): Promise<PublicHtmlOffloadResult> {
  const ttlSeconds = policy.ttlSeconds ?? PUBLIC_HTML_OFFLOAD_CACHE_TTL_SECONDS
  if (!policy.isEligible(request)) return fetchBypass(request, runtime, ttlSeconds)

  const cache = runtime.cache === undefined ? getPublicHtmlOffloadCache() : runtime.cache
  if (!cache) return fetchBypass(request, runtime, ttlSeconds)

  const key = policy.cacheKey(request)
  try {
    const cached = await cache.match(key)
    if (cached) {
      return {
        response: responseWithCacheStatus(request, cached, 'HIT', ttlSeconds),
        status: 'HIT',
      }
    }
  } catch {
    return fetchBypass(request, runtime, ttlSeconds)
  }

  const origin = await runtime.fetchOrigin(originRequestForCacheFill(request))
  if (!isCacheablePublicHtmlResponse(origin)) {
    return {
      response: responseWithCacheStatus(request, origin, 'BYPASS', ttlSeconds),
      status: 'BYPASS',
    }
  }

  const stored = origin.clone()
  const storedHeaders = new Headers(stored.headers)
  storedHeaders.set(
    'Cache-Control',
    `public, s-maxage=${ttlSeconds}, max-age=0, must-revalidate`,
  )
  storedHeaders.delete(PUBLIC_HTML_OFFLOAD_CACHE_HEADER)
  const cacheTag = policy.cacheTag?.(request)
  if (cacheTag) storedHeaders.set('Cache-Tag', cacheTag)
  const storedResponse = new Response(stored.body, {
    status: stored.status,
    statusText: stored.statusText,
    headers: storedHeaders,
  })
  const store = cache.put(key, storedResponse).catch(() => undefined)
  if (runtime.waitUntil) runtime.waitUntil(store)

  return {
    response: responseWithCacheStatus(request, origin, 'MISS', ttlSeconds),
    status: 'MISS',
  }
}

export function markPublicHtmlOffloadCacheStatus(
  request: Request,
  response: Response,
  status: PublicHtmlOffloadCacheStatus,
): Response {
  return responseWithCacheStatus(request, response, status, PUBLIC_HTML_OFFLOAD_CACHE_TTL_SECONDS)
}

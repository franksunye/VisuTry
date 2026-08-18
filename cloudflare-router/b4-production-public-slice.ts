/**
 * B4.2 first production public slice — proposed classifier.
 *
 * Staging app-host-worker.ts now uses classifyB4ProductionPublicSlice().
 * Live B3.2 classify() in worker.ts remains for regression tests.
 * Do not attach this slice to www.visutry.com from this PR.
 *
 * Free-plan quota model (corrected):
 * - Static Assets are free only when served without invoking the Worker.
 * - Keep wrangler assets.run_worker_first = false (the default).
 * - Workers Caching still counts as Worker requests and can bill otherwise-free assets.
 * - Next.js force-static HTML is OpenNext Worker output, not a Static Asset file.
 */

export type B4Backend = 'cloudflare' | 'vercel'
export type B4RouteClass = 'cf-ready' | 'vercel-required' | 'unknown-fallback'
export type B4CutoverClass = 'first' | 'later' | 'vercel'
export type B4InvocationMode = 'static-asset' | 'worker' | 'vercel'
export type B4CacheClass =
  | 'hashed-immutable'
  | 'deploy-public-asset'
  | 'control-files'
  | 'deploy-static-html'
  | 'static-sitemap'
  | 'locale-less-redirect'
  | 'root-locale-detect'
  | 'public-catalog-api'
  | 'health'
  | 'none'

export interface B4RouteDecision {
  backend: B4Backend
  routeClass: B4RouteClass
  cutoverClass: B4CutoverClass
  cacheClass: B4CacheClass
  invocation: B4InvocationMode
  countsAgainstWorkerQuota: boolean
  auth: 'none'
  methods: 'GET,HEAD'
}

export interface B4ManifestRow {
  route: string
  methods: string
  backend: B4Backend
  cachePolicy: B4CacheClass
  invocation: B4InvocationMode
  auth: 'none' | 'session' | 'bearer'
  reason: string
  rollbackClass: 'public-cdn' | 'origin-fallback' | 'keep-vercel'
  cutoverClass: B4CutoverClass
}

export const B4_LOCALES = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
const locales = B4_LOCALES

export const B4_LOCALE_LESS_MARKETING_EXACT = [
  '/face-analysis',
  '/face-shape-detector',
  '/glasses-for-face-shape',
  '/sunglasses-for-face-shape',
  '/try-on',
  '/try-on/glasses',
  '/try-on/glasses/compare',
  '/what-is-my-face-shape',
  '/what-glasses-suit-my-face',
  '/find-glasses-for-my-face',
  '/virtual-glasses-try-on',
  '/try-glasses-on-photo',
  '/compare-glasses-frames',
  '/ai-glasses-advisor',
  '/glasses-guide',
  '/blog',
  '/pricing',
  '/store',
  '/business',
  '/privacy',
  '/terms',
  '/refund',
  '/faq',
  '/face-shape-measurement',
  '/face-shapes',
  '/hairstyles-for-face-shape',
] as const
const localeLessMarketingExact = B4_LOCALE_LESS_MARKETING_EXACT

export const B4_LOCALIZED_EXACT_PAGES = [
  '/store',
  '/blog',
  '/face-shape-detector',
  '/face-analysis',
  '/glasses-for-face-shape',
  '/sunglasses-for-face-shape',
  '/try-on',
  '/try-on/glasses',
  '/try-on/glasses/compare',
  '/what-is-my-face-shape',
  '/what-glasses-suit-my-face',
  '/find-glasses-for-my-face',
  '/virtual-glasses-try-on',
  '/try-glasses-on-photo',
  '/compare-glasses-frames',
  '/ai-glasses-advisor',
  '/glasses-guide',
  '/pricing',
  '/business',
  '/privacy',
  '/terms',
  '/refund',
  '/faq',
  '/face-shape-measurement',
  '/face-shapes',
  '/hairstyles-for-face-shape',
] as const
const localizedExactPages = B4_LOCALIZED_EXACT_PAGES

export const B4_LOCALIZED_PREFIXES = [
  '/blog/',
  '/brand/',
  '/glasses-guide/',
  '/face-shapes/',
  '/style/',
  '/sunglasses-for/',
  '/hairstyles-for/',
  '/try-on/',
] as const
const localizedPrefixes = B4_LOCALIZED_PREFIXES

export const B4_HASHED_IMMUTABLE_PREFIXES = ['/_next/static/'] as const
const hashedImmutablePrefixes = B4_HASHED_IMMUTABLE_PREFIXES

export const B4_DEPLOY_PUBLIC_ASSET_PREFIXES = [
  '/blog-covers/',
  '/assets/',
  '/images/',
  '/home/',
  '/experience-heroes/',
] as const
const deployPublicAssetPrefixes = B4_DEPLOY_PUBLIC_ASSET_PREFIXES

export const B4_DEPLOY_PUBLIC_ASSET_EXACT = ['/favicon.ico'] as const
const deployPublicAssetExact = B4_DEPLOY_PUBLIC_ASSET_EXACT

export const B4_CONTROL_FILES_EXACT = ['/robots.txt', '/llms.txt'] as const
const controlFilesExact = B4_CONTROL_FILES_EXACT

export const B4_STATIC_SITEMAP_EXACT = ['/sitemap.xml', '/sitemaps/core.xml', '/sitemaps/blog.xml'] as const
const staticSitemapExact = B4_STATIC_SITEMAP_EXACT

export const B4_FIRST_SLICE_APIS = [
  '/api/health',
  '/api/glasses/brands',
  '/api/glasses/categories',
  '/api/glasses/face-shapes',
] as const

const vercelRequiredPrefixes = [
  '/api/admin/',
  '/api/agent/v1/merchant',
  '/api/cron/',
  '/api/face-analysis/submit',
  '/api/mcp/oauth/',
  '/api/payment/',
  '/api/store/sessions',
  '/api/try-on/',
  '/api/upload',
  '/_next/image',
  '/api/auth',
  '/api/merchant/',
  '/api/mcp',
] as const

export const B4_CACHE_POLICIES: Record<B4CacheClass, {
  browserCacheControl: string
  cloudflareTtl: string
  cacheKey: string
  queryString: string
  cookieBypass: string
  authorizationBypass: string
  stale: string
  purge: string
  negativeCache: string
}> = {
  'hashed-immutable': {
    browserCacheControl: 'public, max-age=31536000, immutable',
    cloudflareTtl: 'Static Assets automatic edge cache; hashed filename is the invalidation',
    cacheKey: 'scheme + host + path (ignore query, ignore Cookie)',
    queryString: 'ignore',
    cookieBypass: 'do not vary',
    authorizationBypass: 'do not cache if Authorization is present',
    stale: 'none; hashed filename is the invalidation',
    purge: 'deploy new hashed assets; no year-long stale copies of old hashes',
    negativeCache: '404 for 60s',
  },
  'deploy-public-asset': {
    browserCacheControl: 'public, max-age=3600, must-revalidate',
    cloudflareTtl: 's-maxage=86400; Static Assets automatic edge cache',
    cacheKey: 'scheme + host + path (ignore query, ignore Cookie)',
    queryString: 'ignore',
    cookieBypass: 'do not vary',
    authorizationBypass: 'do not cache if Authorization is present',
    stale: 'none; filenames are not content-hashed',
    purge: 'Cloudflare Static Assets deploy replaces files; purge URL on deploy',
    negativeCache: '404 for 60s',
  },
  'control-files': {
    browserCacheControl: 'public, max-age=0, must-revalidate',
    cloudflareTtl: 's-maxage=3600; purge on deploy',
    cacheKey: 'scheme + host + path',
    queryString: 'ignore',
    cookieBypass: 'do not vary',
    authorizationBypass: 'not applicable',
    stale: 'none',
    purge: 'purge URL on deploy so robots/llms cannot stay stale for a year',
    negativeCache: '404 for 60s',
  },
  'deploy-static-html': {
    browserCacheControl: 'public, max-age=0, must-revalidate',
    cloudflareTtl: 's-maxage=86400, stale-while-revalidate=604800',
    cacheKey: 'scheme + host + path (ignore query, ignore Cookie)',
    queryString: 'ignore (canonicals strip search)',
    cookieBypass: 'do not vary on Cookie; UserMenu is client-side',
    authorizationBypass: 'bypass cache when Authorization is present',
    stale: 'serve stale up to 7 days while revalidating',
    purge: 'Cloudflare purge by URL on deploy; no Store/Campaign tags in B4.2',
    negativeCache: '404/410 for 60s; never cache 5xx',
  },
  'static-sitemap': {
    browserCacheControl: 'public, max-age=0, must-revalidate',
    cloudflareTtl: 's-maxage=3600; purge on deploy',
    cacheKey: 'scheme + host + path',
    queryString: 'ignore',
    cookieBypass: 'do not vary',
    authorizationBypass: 'not applicable',
    stale: 'none',
    purge: 'purge URL on deploy; dynamic sitemap stays on Vercel',
    negativeCache: '404 for 60s; never cache 5xx',
  },
  'locale-less-redirect': {
    browserCacheControl: 'public, max-age=86400',
    cloudflareTtl: '308 cached 86400s',
    cacheKey: 'scheme + host + path',
    queryString: 'ignore',
    cookieBypass: 'do not vary',
    authorizationBypass: 'not applicable',
    stale: 'none required',
    purge: 'purge on redirect-table change',
    negativeCache: 'n/a',
  },
  'root-locale-detect': {
    browserCacheControl: 'private, max-age=0, must-revalidate',
    cloudflareTtl: 'bypass CDN (Accept-Language)',
    cacheKey: 'uncached',
    queryString: 'ignore',
    cookieBypass: 'n/a',
    authorizationBypass: 'n/a',
    stale: 'none',
    purge: 'n/a',
    negativeCache: 'n/a',
  },
  'public-catalog-api': {
    browserCacheControl: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    cloudflareTtl: '3600s (match PUBLIC_CATALOG_CACHE_CONTROL)',
    cacheKey: 'scheme + host + path (ignore query, ignore Cookie)',
    queryString: 'ignore for these list endpoints (no required query)',
    cookieBypass: 'do not vary',
    authorizationBypass: 'bypass cache when Authorization is present',
    stale: 'SWR 86400s',
    purge: 'purge URL after catalog admin edits if freshness < 1h is required',
    negativeCache: 'do not cache 5xx; 404 n/a for list endpoints',
  },
  health: {
    browserCacheControl: 'no-store',
    cloudflareTtl: 'bypass',
    cacheKey: 'uncached',
    queryString: 'ignore',
    cookieBypass: 'n/a',
    authorizationBypass: 'n/a',
    stale: 'none',
    purge: 'n/a',
    negativeCache: 'n/a',
  },
  none: {
    browserCacheControl: 'do not cache at Cloudflare',
    cloudflareTtl: 'bypass',
    cacheKey: 'n/a',
    queryString: 'forward as-is to Vercel',
    cookieBypass: 'forward Cookie; never store',
    authorizationBypass: 'forward Authorization; never store',
    stale: 'n/a',
    purge: 'n/a',
    negativeCache: 'n/a',
  },
}

export const B4_PRODUCTION_PUBLIC_SLICE_MANIFEST: B4ManifestRow[] = [
  { route: '/', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'root-locale-detect', invocation: 'worker', auth: 'none', reason: 'Accept-Language locale redirect; do not CDN-cache; Worker required', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/:locale', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'deploy-static-html', invocation: 'worker', auth: 'none', reason: 'OpenNext incremental cache HTML, not a Static Asset file', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/:locale/{marketing,blog,brand,guide,face-shape,try-on landing}', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'deploy-static-html', invocation: 'worker', auth: 'none', reason: 'Next force-static HTML is served by OpenNext Worker, not .open-next/assets', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: 'locale-less marketing/SEO URLs', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'locale-less-redirect', invocation: 'worker', auth: 'none', reason: 'next.config 308s already proven; keep off middleware', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/_next/static/*', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'hashed-immutable', invocation: 'static-asset', auth: 'none', reason: 'hashed files exist in .open-next/assets on this Worker; production www route stays unpublished until same-commit Vercel `.next/static` ⊆ CF assets', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/favicon.ico, /images/*, /home/*, /experience-heroes/*, /blog-covers/*, /assets/*', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'deploy-public-asset', invocation: 'static-asset', auth: 'none', reason: 'non-hashed public files in .open-next/assets; finite TTL, not immutable', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/robots.txt, /llms.txt', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'control-files', invocation: 'static-asset', auth: 'none', reason: 'control files exist in .open-next/assets; conservative cache + deploy purge', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: '/sitemap.xml, /sitemaps/core.xml, /sitemaps/blog.xml', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'static-sitemap', invocation: 'worker', auth: 'none', reason: 'OpenNext .cache artifacts only; not present in .open-next/assets', rollbackClass: 'public-cdn', cutoverClass: 'first' },
  { route: 'GET /api/health', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'health', invocation: 'worker', auth: 'none', reason: 'proven CF public read; not cacheable', rollbackClass: 'origin-fallback', cutoverClass: 'first' },
  { route: 'GET /api/glasses/brands|categories|face-shapes', methods: 'GET,HEAD', backend: 'cloudflare', cachePolicy: 'public-catalog-api', invocation: 'worker', auth: 'none', reason: 'anonymous catalog lists via glasses data layer', rollbackClass: 'origin-fallback', cutoverClass: 'first' },
  { route: '/:locale/store/:merchantSlug', methods: 'GET,HEAD', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'none', reason: 'on-demand ISR + Neon admission; CF cache cannot use revalidateTag', rollbackClass: 'keep-vercel', cutoverClass: 'later' },
  { route: '/:locale/c/:merchantSlug/:experienceSlug', methods: 'GET,HEAD', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'none', reason: 'Campaign ISR + publish invalidation stays on Vercel', rollbackClass: 'keep-vercel', cutoverClass: 'later' },
  { route: '/:locale/category/*, /:locale/try/*', methods: 'GET,HEAD', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'none', reason: 'PROGRAMMATIC_SEO off; Vercel dynamicParams=false 404s all slugs', rollbackClass: 'keep-vercel', cutoverClass: 'later' },
  { route: '/:locale/discover, /:locale/style-explorer', methods: 'GET,HEAD', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'none', reason: 'force-dynamic', rollbackClass: 'keep-vercel', cutoverClass: 'vercel' },
  { route: '/api/auth/*, protected reads, merchant writes, MCP', methods: '*', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'session', reason: 'first slice excludes authenticated traffic', rollbackClass: 'keep-vercel', cutoverClass: 'later' },
  { route: '/_next/image, Stripe, Blob, AI, cron, admin', methods: '*', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'session', reason: 'VERCEL_REQUIRED capability boundary', rollbackClass: 'keep-vercel', cutoverClass: 'vercel' },
  { route: 'unknown path or unknown method', methods: '*', backend: 'vercel', cachePolicy: 'none', invocation: 'vercel', auth: 'none', reason: 'fail to Vercel; no CF retry; Worker still invoked to proxy unless the path is a Static Asset', rollbackClass: 'keep-vercel', cutoverClass: 'vercel' },
]

/**
 * Proven 2026-08-17 from OpenNext 1.15.1 output on this branch.
 * HTML is NOT a Cloudflare Static Asset just because Next.js marked the route force-static.
 */
export const B4_OPENNEXT_ASSET_AUDIT = {
  provenAt: '2026-08-17',
  openNextAssetsFileCount: 291,
  htmlFilesInAssets: 1,
  localeHomeHtmlInAssets: false,
  seoHtmlInAssets: false,
  blogHtmlInAssets: false,
  brandHtmlInAssets: false,
  sitemapFilesInAssets: false,
  hashedStaticInAssets: true,
  faviconInAssets: true,
  robotsInAssets: true,
  llmsInAssets: true,
  publicImagesInAssets: true,
  htmlServedFrom: '.open-next/cache/*.cache via OpenNext Worker',
  wranglerRunWorkerFirst: false,
} as const

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function isGetHead(method: string): boolean {
  return method === 'GET' || method === 'HEAD'
}

function localeAndRest(path: string): { locale: string; rest: string } | null {
  const match = path.match(/^\/([^/]+)(\/.*)?$/)
  if (!match) return null
  if (!locales.includes(match[1] as (typeof locales)[number])) return null
  return { locale: match[1], rest: match[2] || '' }
}

function isVercelRequired(path: string): boolean {
  return vercelRequiredPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))
}

function isDeferredPublicHtml(path: string): boolean {
  const localized = localeAndRest(path)
  const rest = localized?.rest || path
  if (rest.startsWith('/store/')) return true
  if (rest.startsWith('/c/')) return true
  if (rest.startsWith('/category/')) return true
  if (rest.startsWith('/try/') || rest === '/try') return true
  if (rest === '/discover' || rest.startsWith('/discover/')) return true
  if (rest === '/style-explorer' || rest.startsWith('/style-explorer/')) return true
  if (rest === '/auth/signin' || rest === '/auth/error' || rest.startsWith('/auth/')) return true
  if (rest === '/merchant' || rest.startsWith('/merchant/')) return true
  if (rest === '/dashboard' || rest.startsWith('/dashboard/')) return true
  if (rest === '/payments' || rest.startsWith('/payments/')) return true
  if (rest.startsWith('/share/')) return true
  if (rest.startsWith('/user/')) return true
  if (path.startsWith('/admin')) return true
  if (path === '/sitemaps/dynamic.xml') return true
  if (path === '/api/glasses/frames' || path.startsWith('/api/glasses/frames/')) return true
  if (path === '/api/frames' || path.startsWith('/api/frames/')) return true
  if (path.startsWith('/api/store/merchants/')) return true
  if (path === '/api/try-on/history' || path === '/api/face-analysis/history' || path === '/api/user/balance') return true
  return false
}

function isHashedImmutable(path: string): boolean {
  return hashedImmutablePrefixes.some((prefix) => path.startsWith(prefix))
}

function isControlFile(path: string): boolean {
  return controlFilesExact.includes(path as (typeof controlFilesExact)[number])
}

function isStaticSitemap(path: string): boolean {
  return staticSitemapExact.includes(path as (typeof staticSitemapExact)[number])
}

function isDeployPublicAsset(path: string): boolean {
  if (deployPublicAssetExact.includes(path as (typeof deployPublicAssetExact)[number])) return true
  if (deployPublicAssetPrefixes.some((prefix) => path.startsWith(prefix))) return true
  if (/^\/google[a-z0-9]+\.html$/i.test(path)) return true
  return false
}

export function invocationModeForCacheClass(cacheClass: B4CacheClass): B4InvocationMode {
  if (cacheClass === 'hashed-immutable' || cacheClass === 'deploy-public-asset' || cacheClass === 'control-files') {
    return 'static-asset'
  }
  if (cacheClass === 'none') return 'vercel'
  return 'worker'
}

function isLocaleLessFirstSlice(path: string): boolean {
  if (localeLessMarketingExact.includes(path as (typeof localeLessMarketingExact)[number])) return true
  if (path.startsWith('/blog/')) return true
  if (path.startsWith('/brand/')) return true
  if (path.startsWith('/glasses-guide/')) return true
  if (path.startsWith('/face-shapes/')) return true
  if (path.startsWith('/style/')) return true
  if (path.startsWith('/sunglasses-for/')) return true
  if (path.startsWith('/hairstyles-for/')) return true
  if (path.startsWith('/try-on/')) return true
  if (path.startsWith('/store/')) return true
  if (path.startsWith('/c/')) return true
  if (path.startsWith('/category/')) return true
  if (path.startsWith('/try/')) return true
  return false
}

function isLocalizedFirstSlicePage(path: string): boolean {
  const localized = localeAndRest(path)
  if (!localized) return false
  if (localized.rest === '') return true
  if (localizedExactPages.includes(localized.rest as (typeof localizedExactPages)[number])) return true
  return localizedPrefixes.some((prefix) => localized.rest.startsWith(prefix))
}

function isFirstSliceApi(path: string): boolean {
  return (B4_FIRST_SLICE_APIS as readonly string[]).includes(path)
}

function decision(
  backend: B4Backend,
  routeClass: B4RouteClass,
  cutoverClass: B4CutoverClass,
  cacheClass: B4CacheClass,
): B4RouteDecision {
  const invocation = backend === 'vercel' ? 'vercel' : invocationModeForCacheClass(cacheClass)
  return {
    backend,
    routeClass,
    cutoverClass,
    cacheClass,
    invocation,
    countsAgainstWorkerQuota: invocation !== 'static-asset',
    auth: 'none',
    methods: 'GET,HEAD',
  }
}

export function classifyB4ProductionPublicSlice(request: Request): B4RouteDecision {
  const path = cleanPath(new URL(request.url).pathname)
  const method = request.method

  if (isVercelRequired(path)) {
    return decision('vercel', 'vercel-required', path.startsWith('/api/auth') || path.startsWith('/api/merchant') || path === '/api/mcp' ? 'later' : 'vercel', 'none')
  }

  if (!isGetHead(method)) {
    return decision('vercel', 'unknown-fallback', 'vercel', 'none')
  }

  if (isDeferredPublicHtml(path)) {
    return decision('vercel', 'unknown-fallback', path.startsWith('/en/store/') || path.includes('/c/') || path.includes('/category/') || path.includes('/try/') ? 'later' : 'vercel', 'none')
  }

  if (path === '/') {
    return decision('cloudflare', 'cf-ready', 'first', 'root-locale-detect')
  }

  if (isHashedImmutable(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'hashed-immutable')
  }

  if (isControlFile(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'control-files')
  }

  if (isDeployPublicAsset(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'deploy-public-asset')
  }

  if (isStaticSitemap(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'static-sitemap')
  }

  if (isFirstSliceApi(path)) {
    return decision('cloudflare', 'cf-ready', 'first', path === '/api/health' ? 'health' : 'public-catalog-api')
  }

  if (isLocalizedFirstSlicePage(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'deploy-static-html')
  }

  if (isLocaleLessFirstSlice(path)) {
    return decision('cloudflare', 'cf-ready', 'first', 'locale-less-redirect')
  }

  return decision('vercel', 'unknown-fallback', 'vercel', 'none')
}

export function shouldBypassPublicCache(request: Request, decision: B4RouteDecision): boolean {
  if (decision.cacheClass === 'none' || decision.cacheClass === 'root-locale-detect' || decision.cacheClass === 'health') {
    return true
  }
  if (request.headers.get('authorization')) return true
  return false
}

export function productionFallbackOrigin(): string {
  return 'https://visutry.vercel.app'
}

export function productionPublicHost(): string {
  return 'www.visutry.com'
}

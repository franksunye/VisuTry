import {
  B4_LOCALIZED_EXACT_PAGES,
  B4_LOCALES,
  B4_LOCALE_LESS_MARKETING_EXACT,
  isRscRequest,
} from './b4-production-public-slice'
import type { B4RouteDecision } from './b4-production-public-slice'

export const PUBLIC_DELIVERY_FORENSIC_EVENT = 'public_delivery_forensic' as const

export type PublicDeliveryRequestClass =
  | 'document'
  | 'rsc'
  | 'next_static'
  | 'next_image'
  | 'sitemap'
  | 'api'
  | 'asset'
  | 'other'

export type PublicDeliveryUaClass =
  | 'chrome'
  | 'safari'
  | 'firefox'
  | 'edge'
  | 'googlebot'
  | 'bingbot'
  | 'oai_searchbot'
  | 'gptbot'
  | 'social_bot'
  | 'generic_bot'
  | 'curl'
  | 'other_browser'
  | 'unknown'

export interface PublicDeliveryForensicsEnv {
  VISUTRY_PUBLIC_DELIVERY_FORENSICS?: string
}

export interface PublicDeliveryForensicEvent {
  event: typeof PUBLIC_DELIVERY_FORENSIC_EVENT
  timestamp: string
  requestId: string
  method: string
  pathFamily: string
  locale: string
  requestClass: PublicDeliveryRequestClass
  isRsc: boolean
  isPrefetch: boolean
  uaClass: PublicDeliveryUaClass
  cfDecision: string
  /** Header observed on the Worker-side response; not the final public CF result. */
  observedCfCacheStatus: string
  forwardedToVercel: boolean
  status: number
  contentType: string
  contentLength: number | null
  vercelCache: string
  vercelIdPresent: boolean
  cfRayPresent: boolean
}

interface WaitUntilContext {
  waitUntil(promise: Promise<unknown>): void
}

const locales = new Set<string>(B4_LOCALES)
const safeExactPathFamilies = new Set([
  '/',
  '/favicon.ico',
  '/robots.txt',
  '/llms.txt',
  '/sitemap.xml',
  '/sitemaps/core.xml',
  '/sitemaps/blog.xml',
  '/sitemaps/dynamic.xml',
  '/_next/image',
  ...B4_LOCALE_LESS_MARKETING_EXACT,
])
const localizedExactPathFamilies = new Set([
  '/:locale',
  ...B4_LOCALIZED_EXACT_PAGES.map((path) => `/:locale${path}`),
])

type PathFamilyMatcher = { template: string; matches: (path: string) => boolean }

function matchesLocalizedRest(path: string, restPattern: RegExp): boolean {
  const segments = path.split('/')
  const locale = segments[1] ?? ''
  if (!locales.has(locale)) return false
  return restPattern.test(`/${segments.slice(2).join('/')}`)
}

// These matchers only return constants. They intentionally never interpolate a
// path segment, so unknown slugs, IDs, and encoded values cannot enter telemetry.
const pathFamilyMatchers: PathFamilyMatcher[] = [
  { template: '/:locale/blog/tag/:tag', matches: (path) => matchesLocalizedRest(path, /^\/blog\/tag\/[^/]+$/) },
  { template: '/:locale/blog/:slug', matches: (path) => matchesLocalizedRest(path, /^\/blog\/[^/]+$/) },
  { template: '/:locale/brand/:brand', matches: (path) => matchesLocalizedRest(path, /^\/brand\/[^/]+$/) },
  { template: '/:locale/glasses-guide/:slug', matches: (path) => matchesLocalizedRest(path, /^\/glasses-guide\/[^/]+$/) },
  { template: '/:locale/face-shapes/:faceShape', matches: (path) => matchesLocalizedRest(path, /^\/face-shapes\/[^/]+$/) },
  { template: '/:locale/style/:faceShape', matches: (path) => matchesLocalizedRest(path, /^\/style\/[^/]+$/) },
  { template: '/:locale/sunglasses-for/:faceShape', matches: (path) => matchesLocalizedRest(path, /^\/sunglasses-for\/[^/]+$/) },
  { template: '/:locale/hairstyles-for/:faceShape', matches: (path) => matchesLocalizedRest(path, /^\/hairstyles-for\/[^/]+$/) },
  { template: '/:locale/store/:merchantSlug', matches: (path) => matchesLocalizedRest(path, /^\/store\/[^/]+$/) },
  { template: '/:locale/c/:merchantSlug/:experienceSlug', matches: (path) => matchesLocalizedRest(path, /^\/c\/[^/]+\/[^/]+$/) },
  { template: '/:locale/category/:slug', matches: (path) => matchesLocalizedRest(path, /^\/category\/[^/]+$/) },
  { template: '/:locale/try/:slug', matches: (path) => matchesLocalizedRest(path, /^\/try\/[^/]+$/) },
  { template: '/blog/tag/:tag', matches: (path) => /^\/blog\/tag\/[^/]+$/.test(path) },
  { template: '/blog/:slug', matches: (path) => /^\/blog\/[^/]+$/.test(path) },
  { template: '/brand/:brand', matches: (path) => /^\/brand\/[^/]+$/.test(path) },
  { template: '/glasses-guide/:slug', matches: (path) => /^\/glasses-guide\/[^/]+$/.test(path) },
  { template: '/face-shapes/:faceShape', matches: (path) => /^\/face-shapes\/[^/]+$/.test(path) },
  { template: '/style/:faceShape', matches: (path) => /^\/style\/[^/]+$/.test(path) },
  { template: '/sunglasses-for/:faceShape', matches: (path) => /^\/sunglasses-for\/[^/]+$/.test(path) },
  { template: '/hairstyles-for/:faceShape', matches: (path) => /^\/hairstyles-for\/[^/]+$/.test(path) },
  { template: '/store/:merchantSlug', matches: (path) => /^\/store\/[^/]+$/.test(path) },
  { template: '/c/:merchantSlug/:experienceSlug', matches: (path) => /^\/c\/[^/]+\/[^/]+$/.test(path) },
  { template: '/category/:slug', matches: (path) => /^\/category\/[^/]+$/.test(path) },
  { template: '/try/:slug', matches: (path) => /^\/try\/[^/]+$/.test(path) },
]

function header(request: Request, name: string): string {
  return request.headers.get(name) ?? ''
}

function cleanPath(pathname: string): string {
  pathname = pathname.split('?')[0] || '/'
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

function pathnameOf(request: Request): string {
  try {
    return cleanPath(new URL(request.url).pathname)
  } catch {
    return '/'
  }
}

function hasAuthenticatedSession(request: Request): boolean {
  if (header(request, 'authorization').trim() !== '') return true
  const cookie = header(request, 'cookie')
  return cookie.split(';').some((part) =>
    /^\s*(?:(?:__Secure-|__Host-)?next-auth\.session-token|(?:(?:__Secure-|__Host-)?authjs\.session-token))(?:=|\s*$)/i.test(part),
  )
}

function isPrefetchRequest(request: Request): boolean {
  if (request.headers.get('next-router-prefetch') !== null) return true
  return /(?:^|[;,\s])(?:prefetch|prerender)(?:$|[;,\s])/i.test(header(request, 'purpose')) ||
    /(?:^|[;,\s])(?:prefetch|prerender)(?:$|[;,\s])/i.test(header(request, 'sec-purpose'))
}

function localeOf(path: string): string {
  const firstSegment = path.split('/')[1] ?? ''
  return locales.has(firstSegment) ? firstSegment : 'unknown'
}

/** Return a route template, never a raw arbitrary pathname or query string. */
export function forensicPathFamily(pathname: string): string {
  const path = cleanPath(pathname)
  if (safeExactPathFamilies.has(path)) return path
  const locale = path.split('/')[1] ?? ''
  const localizedRest = path.slice(locale ? locale.length + 1 : path.length)
  const localizedTemplate = `/:locale${localizedRest}`
  if (locales.has(locale) && localizedExactPathFamilies.has(localizedTemplate)) {
    return localizedTemplate
  }
  for (const matcher of pathFamilyMatchers) {
    if (matcher.matches(path)) return matcher.template
  }
  if (path.startsWith('/api/')) return '/api/*'
  if (path.startsWith('/_next/static/')) return '/_next/static/*'
  if (path.startsWith('/_next/')) return '/_next/*'
  if (path.startsWith('/sitemaps/')) return '/sitemaps/*'
  if (path.startsWith('/images/')) return '/images/*'
  if (path.startsWith('/home/')) return '/home/*'
  if (path.startsWith('/experience-heroes/')) return '/experience-heroes/*'
  if (path.startsWith('/blog-covers/')) return '/blog-covers/*'
  if (path.startsWith('/assets/')) return '/assets/*'
  if (locales.has(path.split('/')[1] ?? '')) return '/:locale/*'
  return '/*'
}

export function classifyPublicDeliveryRequest(
  request: Request,
): { requestClass: PublicDeliveryRequestClass; isRsc: boolean; isPrefetch: boolean } {
  const path = pathnameOf(request)
  const isRsc = isRscRequest(request)
  const isPrefetch = isPrefetchRequest(request)

  if (isRsc) return { requestClass: 'rsc', isRsc, isPrefetch }
  if (path.startsWith('/_next/static/')) return { requestClass: 'next_static', isRsc, isPrefetch }
  if (path === '/_next/image' || path.startsWith('/_next/image/')) return { requestClass: 'next_image', isRsc, isPrefetch }
  if (path === '/sitemap.xml' || path.startsWith('/sitemaps/')) return { requestClass: 'sitemap', isRsc, isPrefetch }
  if (path === '/favicon.ico' || path === '/robots.txt' || path === '/llms.txt' ||
      path.startsWith('/images/') || path.startsWith('/home/') ||
      path.startsWith('/experience-heroes/') || path.startsWith('/blog-covers/') ||
      path.startsWith('/assets/')) {
    return { requestClass: 'asset', isRsc, isPrefetch }
  }
  if (path === '/api' || path.startsWith('/api/')) return { requestClass: 'api', isRsc, isPrefetch }

  const accept = header(request, 'accept')
  if (!path.includes('.') || accept.toLowerCase().includes('text/html')) {
    return { requestClass: 'document', isRsc, isPrefetch }
  }
  return { requestClass: 'other', isRsc, isPrefetch }
}

export function classifyUa(userAgent: string): PublicDeliveryUaClass {
  const ua = userAgent.toLowerCase()
  if (!ua) return 'unknown'
  if (ua.includes('googlebot')) return 'googlebot'
  if (ua.includes('bingbot')) return 'bingbot'
  if (ua.includes('oai-searchbot')) return 'oai_searchbot'
  if (ua.includes('gptbot')) return 'gptbot'
  if (/(facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot)/.test(ua)) return 'social_bot'
  if (/(bot|crawler|spider|slurp|headless|scrapy)/.test(ua)) return 'generic_bot'
  if (/(?:^|[\s(])(?:curl|wget)\//.test(ua)) return 'curl'
  if (ua.includes('edg/')) return 'edge'
  if (ua.includes('firefox/')) return 'firefox'
  if (ua.includes('chrome/') || ua.includes('crios/')) return 'chrome'
  if (ua.includes('safari/')) return 'safari'
  return 'other_browser'
}

function isBot(uaClass: PublicDeliveryUaClass): boolean {
  return uaClass === 'googlebot' || uaClass === 'bingbot' || uaClass === 'oai_searchbot' ||
    uaClass === 'gptbot' || uaClass === 'social_bot' || uaClass === 'generic_bot'
}

function stableBucket(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 100
}

/** 100% for RSC/prefetch/sitemaps/bots; deterministic 10% for anonymous documents. */
export function shouldSamplePublicDelivery(request: Request): boolean {
  if (hasAuthenticatedSession(request)) return false
  const { requestClass, isRsc, isPrefetch } = classifyPublicDeliveryRequest(request)
  const uaClass = classifyUa(header(request, 'user-agent'))
  if (isRsc || isPrefetch || requestClass === 'sitemap' || isBot(uaClass)) return true
  if (requestClass !== 'document') return false

  const cfRay = header(request, 'cf-ray')
  return stableBucket(`${cfRay}|${request.method}|${pathnameOf(request)}`) < 10
}

function responseContentLength(response: Response): number | null {
  const value = response.headers.get('content-length')
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function responseHeader(response: Response, name: string): string {
  return response.headers.get(name)?.split(';', 1)[0].slice(0, 128) || 'unknown'
}

export function buildPublicDeliveryForensicEvent(
  request: Request,
  decision: B4RouteDecision,
  response: Response,
): PublicDeliveryForensicEvent {
  const path = pathnameOf(request)
  const { requestClass, isRsc, isPrefetch } = classifyPublicDeliveryRequest(request)
  const cfRay = header(request, 'cf-ray').slice(0, 128)
  const forwardedToVercel = decision.backend === 'vercel'

  return {
    event: PUBLIC_DELIVERY_FORENSIC_EVENT,
    timestamp: new Date().toISOString(),
    requestId: cfRay || 'unknown',
    method: request.method,
    pathFamily: forensicPathFamily(path),
    locale: localeOf(path),
    requestClass,
    isRsc,
    isPrefetch,
    uaClass: classifyUa(header(request, 'user-agent')),
    cfDecision: `${decision.backend}:${decision.routeClass}:${decision.cacheClass}:${decision.invocation}`,
    // This is the header observable inside the Worker on the response it sees;
    // it is not authoritative for the final client-facing Cloudflare edge
    // result. Final CF-Cache-Status requires a controlled external HTTP probe.
    observedCfCacheStatus: response.headers.get('cf-cache-status')?.slice(0, 32) || 'unknown',
    forwardedToVercel,
    status: response.status,
    contentType: responseHeader(response, 'content-type'),
    contentLength: responseContentLength(response),
    vercelCache: forwardedToVercel ? response.headers.get('x-vercel-cache')?.slice(0, 32) || 'unknown' : 'unknown',
    vercelIdPresent: response.headers.get('x-vercel-id') !== null,
    cfRayPresent: cfRay !== '',
  }
}

export function isPublicDeliveryForensicsEnabled(env: PublicDeliveryForensicsEnv): boolean {
  const value = env.VISUTRY_PUBLIC_DELIVERY_FORENSICS?.trim().toLowerCase()
  return value === '1' || value === 'true'
}

export function emitPublicDeliveryForensicEvent(
  request: Request,
  decision: B4RouteDecision,
  response: Response,
  env: PublicDeliveryForensicsEnv,
  ctx: WaitUntilContext,
): void {
  if (!isPublicDeliveryForensicsEnabled(env) || !shouldSamplePublicDelivery(request)) return

  const event = buildPublicDeliveryForensicEvent(request, decision, response)
  try {
    // Telemetry must never delay or fail the response. The nested catch also
    // prevents a console/serialization failure from becoming an unhandled task.
    ctx.waitUntil(Promise.resolve().then(() => {
      try {
        console.log(JSON.stringify(event))
      } catch {
        // Forensic logging is best-effort by design.
      }
    }))
  } catch {
    // A missing/broken execution context must not affect request handling.
  }
}

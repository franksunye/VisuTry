/**
 * ISR edge telemetry helpers for the Cloudflare capability router.
 *
 * Observability only: never changes routing, caching, cookies, redirects,
 * or the upstream request/response body. Analytics Engine writes must not
 * fail the request.
 */

export const LOCALES = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export type RequestKind =
  | 'HTML_DOCUMENT'
  | 'RSC'
  | 'NEXT_PREFETCH'
  | 'NEXT_IMAGE'
  | 'API'
  | 'STATIC_ASSET'
  | 'OTHER'

export type BotCategory =
  | 'GOOGLEBOT'
  | 'BINGBOT'
  | 'APPLEBOT'
  | 'OAI_SEARCHBOT'
  | 'CHATGPT_USER'
  | 'PERPLEXITY'
  | 'ANTHROPIC'
  | 'AHREFS'
  | 'SEMRUSH'
  | 'OTHER_KNOWN_BOT'
  | 'LIKELY_BROWSER'
  | 'UNKNOWN'

export type BotClassificationSource = 'CF_VERIFIED' | 'UA_HEURISTIC' | 'NONE'

export type VercelCacheStatus =
  | 'HIT'
  | 'MISS'
  | 'PRERENDER'
  | 'STALE'
  | 'BYPASS'
  | 'REVALIDATED'
  | 'UNKNOWN'

export type AnalyticsEngineBinding = {
  writeDataPoint(event: {
    indexes?: string[]
    blobs?: (string | null)[]
    doubles?: number[]
  }): void
}

export type IsrTelemetryEnv = {
  ISR_TELEMETRY?: AnalyticsEngineBinding
  ISR_TELEMETRY_ENABLED?: string
  ISR_TELEMETRY_SAMPLE_RATE?: string
  ISR_HTML_TELEMETRY_SAMPLE_RATE?: string
}

export type SafeTelemetryRecord = {
  indexes: [string]
  blobs: string[]
  doubles: number[]
}

export const TELEMETRY_BLOB_FIELDS = [
  'pathname',
  'method',
  'routeClass',
  'normalizedBotCategory',
  'userAgentFamily',
  'cfColo',
  'cfCountry',
  'contentType',
  'xVercelCache',
  'xMatchedPath',
  'requestKind',
  'locale',
  'routeFamily',
  'botClassificationSource',
] as const

export const TELEMETRY_DOUBLE_FIELDS = [
  'status',
  'latencyMs',
  'responseContentLength',
  'ageSeconds',
  'hasQuery',
  'hasRscQuery',
  'hasSourcePage',
] as const

const PATH_MAX = 256
const HEADER_MAX = 128
const INDEX_MAX = 96

const STATIC_PREFIXES = [
  '/_next/static/',
  '/blog-covers/',
  '/assets/',
  '/images/',
  '/home/',
  '/experience-heroes/',
]

const KNOWN_VERCEL_CACHE = new Set<VercelCacheStatus>([
  'HIT',
  'MISS',
  'PRERENDER',
  'STALE',
  'BYPASS',
  'REVALIDATED',
])

function clip(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max)
}

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

export function extractLocale(pathname: string): Locale | null {
  const first = cleanPath(pathname).split('/').filter(Boolean)[0]
  return LOCALES.includes(first as Locale) ? (first as Locale) : null
}

export function parseBooleanEnv(value: string | undefined, fallback = false): boolean {
  if (value == null || value === '') return fallback
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
}

export function parseSampleRate(value: string | undefined, fallback: number): number {
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0, parsed))
}

export function hashSampleKey(key: string): number {
  let hash = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function shouldSample(key: string, rate: number): boolean {
  if (rate >= 1) return true
  if (rate <= 0) return false
  return hashSampleKey(key) / 0xffffffff < rate
}

export function detectRequestKind(input: {
  method: string
  pathname: string
  searchParams: URLSearchParams
  headers: { get(name: string): string | null }
}): RequestKind {
  const path = cleanPath(input.pathname)
  if (path === '/_next/image' || path.startsWith('/_next/image/')) return 'NEXT_IMAGE'
  if (path === '/api' || path.startsWith('/api/')) return 'API'
  if (path === '/favicon.ico' || STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return 'STATIC_ASSET'
  }

  const prefetch = input.headers.get('next-router-prefetch')
  if (prefetch === '1' || prefetch?.toLowerCase() === 'true') return 'NEXT_PREFETCH'

  const rscHeader = input.headers.get('rsc')
  const routerState = input.headers.get('next-router-state-tree')
  const hasRscQuery = input.searchParams.has('_rsc')
  if (rscHeader === '1' || rscHeader?.toLowerCase() === 'true' || routerState || hasRscQuery) {
    return 'RSC'
  }

  const accept = (input.headers.get('accept') || '').toLowerCase()
  if (accept.includes('text/html') || accept === '' || accept === '*/*') {
    if (input.method === 'GET' || input.method === 'HEAD') return 'HTML_DOCUMENT'
  }
  return 'OTHER'
}

export function userAgentFamily(userAgent: string): string {
  const ua = userAgent.trim()
  if (!ua) return 'UNKNOWN'
  if (/Googlebot/i.test(ua)) return 'Googlebot'
  if (/bingbot|msnbot|adidxbot/i.test(ua)) return 'bingbot'
  if (/Applebot/i.test(ua)) return 'Applebot'
  if (/OAI-SearchBot/i.test(ua)) return 'OAI-SearchBot'
  if (/ChatGPT-User/i.test(ua)) return 'ChatGPT-User'
  if (/Perplexity/i.test(ua)) return 'Perplexity'
  if (/ClaudeBot|anthropic-ai|Claude-User/i.test(ua)) return 'Anthropic'
  if (/AhrefsBot/i.test(ua)) return 'AhrefsBot'
  if (/SemrushBot/i.test(ua)) return 'SemrushBot'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari'
  const token = ua.split(/[\s/]/)[0]
  return clip(token || 'UNKNOWN', 40)
}

export function classifyBotFromUserAgent(userAgent: string): BotCategory {
  const ua = userAgent
  if (!ua) return 'UNKNOWN'
  if (/Googlebot|Google-InspectionTool|GoogleOther/i.test(ua)) return 'GOOGLEBOT'
  if (/bingbot|msnbot|adidxbot/i.test(ua)) return 'BINGBOT'
  if (/Applebot/i.test(ua)) return 'APPLEBOT'
  if (/OAI-SearchBot/i.test(ua)) return 'OAI_SEARCHBOT'
  if (/ChatGPT-User/i.test(ua)) return 'CHATGPT_USER'
  if (/PerplexityBot|Perplexity/i.test(ua)) return 'PERPLEXITY'
  if (/ClaudeBot|anthropic-ai|Claude-User/i.test(ua)) return 'ANTHROPIC'
  if (/AhrefsBot/i.test(ua)) return 'AHREFS'
  if (/SemrushBot/i.test(ua)) return 'SEMRUSH'
  if (/(?:bot|crawler|spider|slurp|duckduckbot|yandex|baiduspider|bytespider|facebookexternalhit|twitterbot|linkedinbot)\b/i.test(ua)) {
    return 'OTHER_KNOWN_BOT'
  }
  if (/Mozilla\/5\.0/i.test(ua) && /(?:Chrome|Firefox|Safari|Edg)\//i.test(ua)) return 'LIKELY_BROWSER'
  return 'UNKNOWN'
}

export type CfBotHints = {
  verifiedBot?: boolean
  score?: number
}

export function classifyBot(
  userAgent: string,
  cfBotManagement?: CfBotHints | null,
): { category: BotCategory; source: BotClassificationSource; userAgentFamily: string } {
  const family = userAgentFamily(userAgent)
  const uaCategory = classifyBotFromUserAgent(userAgent)
  if (cfBotManagement && cfBotManagement.verifiedBot === true) {
    return {
      category: uaCategory === 'LIKELY_BROWSER' || uaCategory === 'UNKNOWN' ? 'OTHER_KNOWN_BOT' : uaCategory,
      source: 'CF_VERIFIED',
      userAgentFamily: family,
    }
  }
  if (!userAgent) {
    return { category: 'UNKNOWN', source: 'NONE', userAgentFamily: family }
  }
  return { category: uaCategory, source: 'UA_HEURISTIC', userAgentFamily: family }
}

export function normalizeVercelCache(value: string | null): VercelCacheStatus {
  if (!value) return 'UNKNOWN'
  const normalized = value.trim().split(/\s/)[0]?.toUpperCase() as VercelCacheStatus
  return KNOWN_VERCEL_CACHE.has(normalized) ? normalized : 'UNKNOWN'
}

export function parseAgeSeconds(value: string | null): number {
  if (!value) return -1
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1
}

export function parseContentLength(value: string | null): number {
  if (!value) return -1
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1
}

export function mimeTypeOnly(contentType: string | null): string {
  if (!contentType) return ''
  return clip(contentType.split(';')[0]?.trim().toLowerCase() || '', 64)
}

export function normalizeRouteFamily(pathname: string): string {
  const path = cleanPath(pathname)
  if (path === '/_next/image' || path.startsWith('/_next/image/')) return '/_next/image'
  if (path === '/api' || path.startsWith('/api/')) return '/api/*'
  if (path.startsWith('/_next/static/')) return '/_next/static/*'

  const locale = extractLocale(path)
  const rest = locale ? (path === `/${locale}` ? '' : path.slice(locale.length + 1)) : path
  const prefix = locale ? '/[locale]' : ''

  if (locale && rest === '') return '/[locale]'

  const localized = (suffix: string) => `${prefix}${suffix}`
  const subject = locale ? rest : path

  if (subject === '/glasses-guide') return localized('/glasses-guide')
  if (subject.startsWith('/glasses-guide/')) return localized('/glasses-guide/[slug]')
  if (subject.startsWith('/style/') && !subject.startsWith('/style-explorer')) {
    return localized('/style/[faceShape]')
  }
  if (subject === '/blog') return localized('/blog')
  if (subject.startsWith('/blog/tag/')) return localized('/blog/tag/[tag]')
  if (subject.startsWith('/blog/')) return localized('/blog/[slug]')
  if (subject.startsWith('/face-shapes/compare/')) return localized('/face-shapes/compare/[comparison]')
  if (subject.startsWith('/face-shapes/')) return localized('/face-shapes/[faceShape]')
  if (subject.startsWith('/sunglasses-for/')) return localized('/sunglasses-for/[faceShape]')
  if (subject.startsWith('/hairstyles-for/')) return localized('/hairstyles-for/[faceShape]')
  if (subject.startsWith('/brand/')) return localized('/brand/[brand]')
  if (subject === '/try-on/glasses/compare' || subject.startsWith('/try-on/glasses/compare/')) {
    return localized('/try-on/glasses/compare')
  }
  if (subject.startsWith('/try-on/')) return localized('/try-on/[type]')
  if (subject.startsWith('/store/')) return localized('/store/[merchantSlug]')
  if (subject.startsWith('/c/') && subject.split('/').filter(Boolean).length >= 3) {
    return localized('/c/[merchantSlug]/[experienceSlug]')
  }
  return 'OTHER'
}

export function isHtmlOrRscKind(kind: RequestKind): boolean {
  return kind === 'HTML_DOCUMENT' || kind === 'RSC' || kind === 'NEXT_PREFETCH'
}

function headerGet(headers: Headers | { get(name: string): string | null }, name: string): string | null {
  return headers.get(name)
}

export function cfHints(request: Request): { colo: string; country: string; botManagement?: CfBotHints } {
  const cf = (request as Request & {
    cf?: {
      colo?: string
      country?: string
      botManagement?: CfBotHints
    }
  }).cf
  return {
    colo: cf?.colo || '',
    country: cf?.country || '',
    botManagement: cf?.botManagement,
  }
}

export function buildSafeTelemetryRecord(input: {
  request: Request
  response: Response
  routeClass: string
  latencyMs: number
}): SafeTelemetryRecord {
  const url = new URL(input.request.url)
  const pathname = clip(cleanPath(url.pathname), PATH_MAX)
  const method = clip(input.request.method.toUpperCase(), 8)
  const locale = extractLocale(pathname) || ''
  const routeFamily = normalizeRouteFamily(pathname)
  const kind = detectRequestKind({
    method,
    pathname: url.pathname,
    searchParams: url.searchParams,
    headers: input.request.headers,
  })
  const bot = classifyBot(input.request.headers.get('user-agent') || '', cfHints(input.request).botManagement)
  const cf = cfHints(input.request)
  const contentType = mimeTypeOnly(headerGet(input.response.headers, 'content-type'))
  const vercelCache = normalizeVercelCache(headerGet(input.response.headers, 'x-vercel-cache'))
  const rawMatchedPath = headerGet(input.response.headers, 'x-matched-path') || ''
  const matchedPath = clip(rawMatchedPath.split('?')[0] || '', HEADER_MAX)

  const blobs = [
    pathname,
    method,
    clip(input.routeClass, 32),
    bot.category,
    bot.userAgentFamily,
    clip(cf.colo, 16),
    clip(cf.country, 8),
    contentType,
    vercelCache,
    matchedPath,
    kind,
    locale,
    routeFamily,
    bot.source,
  ]

  const doubles = [
    input.response.status,
    Math.max(0, input.latencyMs),
    parseContentLength(headerGet(input.response.headers, 'content-length')),
    parseAgeSeconds(headerGet(input.response.headers, 'age')),
    url.search ? 1 : 0,
    url.searchParams.has('_rsc') ? 1 : 0,
    url.searchParams.has('sourcePage') ? 1 : 0,
  ]

  return {
    indexes: [clip(routeFamily, INDEX_MAX)],
    blobs,
    doubles,
  }
}

export function telemetryRecordContainsForbiddenData(
  record: SafeTelemetryRecord,
  originalUrl: string,
  originalHeaders: { get(name: string): string | null },
): string[] {
  const serialized = JSON.stringify(record)
  const errors: string[] = []
  const authorization = originalHeaders.get('authorization')
  const cookie = originalHeaders.get('cookie')
  const search = new URL(originalUrl).search
  if (authorization && serialized.includes(authorization)) errors.push('authorization')
  if (cookie && serialized.includes(cookie)) errors.push('cookie')
  if (search && search.length > 1) {
    const params = new URL(originalUrl).searchParams
    for (const value of params.values()) {
      if (value && serialized.includes(value)) errors.push(`query-value:${value}`)
    }
  }
  if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(serialized)) errors.push('ipv4')
  if (originalHeaders.get('cf-connecting-ip') && serialized.includes(originalHeaders.get('cf-connecting-ip') || '')) {
    errors.push('cf-connecting-ip')
  }
  return errors
}

export function shouldRecordIsrTelemetry(input: {
  env: IsrTelemetryEnv
  method: string
  backend: string
  kind: RequestKind
  sampleKey: string
}): boolean {
  if (!parseBooleanEnv(input.env.ISR_TELEMETRY_ENABLED, false)) return false
  if (!input.env.ISR_TELEMETRY) return false
  if (input.backend !== 'vercel') return false
  if (input.method !== 'GET' && input.method !== 'HEAD') return false
  const htmlRate = parseSampleRate(input.env.ISR_HTML_TELEMETRY_SAMPLE_RATE, 1)
  const otherRate = parseSampleRate(input.env.ISR_TELEMETRY_SAMPLE_RATE, 0.05)
  const rate = isHtmlOrRscKind(input.kind) ? htmlRate : otherRate
  return shouldSample(input.sampleKey, rate)
}

export function writeIsrTelemetrySafely(input: {
  env: IsrTelemetryEnv
  request: Request
  response: Response
  backend: string
  routeClass: string
  latencyMs: number
}): void {
  try {
    const method = input.request.method.toUpperCase()
    const url = new URL(input.request.url)
    const kind = detectRequestKind({
      method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      headers: input.request.headers,
    })
    if (!shouldRecordIsrTelemetry({
      env: input.env,
      method,
      backend: input.backend,
      kind,
      sampleKey: `${method}:${cleanPath(url.pathname)}:${kind}`,
    })) {
      return
    }
    const record = buildSafeTelemetryRecord({
      request: input.request,
      response: input.response,
      routeClass: input.routeClass,
      latencyMs: input.latencyMs,
    })
    input.env.ISR_TELEMETRY?.writeDataPoint(record)
  } catch {
    // telemetry failure = ignored
  }
}

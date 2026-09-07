/**
 * Repository-owned contract for the existing Cloudflare D1 HTML Cache Rule.
 *
 * This module is intentionally side-effect free. It describes and validates
 * the rule, but it never changes Cloudflare production configuration.
 *
 * Vercel remains the sole producer of Next HTML, RSC/Flight, and
 * /_next/static/* assets. D1 is only allowed to cache anonymous document HTML
 * for the three explicitly approved localized SEO families.
 */

export const D1_CACHE_RULE_NAME = 'VisuTry D1 - SEO HTML Cache Shield' as const
export const D1_CACHE_RULE_ID = '95eee5c32435422686aa759e231b8b13' as const
export const D1_PRODUCTION_HOST = 'www.visutry.com' as const
export const D1_CACHE_RULE_EDGE_TTL_SECONDS = 60 * 60

export const D1_LOCALES = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
export const D1_ROUTE_FAMILIES = ['/glasses-guide', '/style', '/sunglasses-for'] as const

type D1Locale = (typeof D1_LOCALES)[number]
type D1RouteFamily = (typeof D1_ROUTE_FAMILIES)[number]

export interface D1CacheRuleRepresentation {
  name: typeof D1_CACHE_RULE_NAME
  id: typeof D1_CACHE_RULE_ID
  expression: string
  action: 'set_cache_settings'
  actionParameters: {
    cache: true
    browserTtl: { mode: 'bypass' }
    edgeTtl: { mode: 'override_origin'; default: number }
    vary: { default: 'normalize' }
  }
}

const d1PathClause = (locale: D1Locale, family: D1RouteFamily) => {
  const base = `/${locale}${family}`
  return `(http.request.uri.path eq "${base}" or starts_with(http.request.uri.path, "${base}/"))`
}

const d1FamilyExpression = D1_LOCALES.flatMap((locale) =>
  D1_ROUTE_FAMILIES.map((family) => d1PathClause(locale, family)),
).join('\n  or ')

/**
 * Cloudflare Rules language expression for the governed production rule.
 *
 * `has_key` is deliberate: any Cookie or Authorization header is private
 * traffic, even when it does not contain the application's known session
 * cookie name. Accept/Purpose/Sec-Purpose checks are explicit because origin
 * Vary is not a substitute for an edge cache bypass contract.
 */
export const D1_CACHE_RULE_EXPRESSION = `(http.host eq "${D1_PRODUCTION_HOST}"
and http.request.method in {"GET" "HEAD"}
and http.request.uri.query eq ""
and not has_key(http.request.headers, "authorization")
and not has_key(http.request.headers, "cookie")
and not has_key(http.request.headers, "rsc")
and not has_key(http.request.headers, "next-router-prefetch")
and not has_key(http.request.headers, "next-router-state-tree")
and not has_key(http.request.headers, "next-url")
and not any(lower(http.request.headers["accept"][*])[*] contains "text/x-component")
and not any(lower(http.request.headers["purpose"][*])[*] contains "prefetch")
and not any(lower(http.request.headers["purpose"][*])[*] contains "prerender")
and not any(lower(http.request.headers["sec-purpose"][*])[*] contains "prefetch")
and not any(lower(http.request.headers["sec-purpose"][*])[*] contains "prerender")
and (
  ${d1FamilyExpression}
))`

export const D1_CACHE_RULE_REPRESENTATION: D1CacheRuleRepresentation = {
  name: D1_CACHE_RULE_NAME,
  id: D1_CACHE_RULE_ID,
  expression: D1_CACHE_RULE_EXPRESSION,
  action: 'set_cache_settings',
  actionParameters: {
    cache: true,
    browserTtl: { mode: 'bypass' },
    edgeTtl: { mode: 'override_origin', default: D1_CACHE_RULE_EDGE_TTL_SECONDS },
    vary: { default: 'normalize' },
  },
}

const pathMatchesFamily = (path: string, family: D1RouteFamily) =>
  D1_LOCALES.some((locale) => {
    const base = `/${locale}${family}`
    return path === base || path.startsWith(`${base}/`)
  })

const headerContains = (request: Request, name: string, value: string) =>
  request.headers.get(name)?.toLowerCase().includes(value) ?? false

/**
 * Pure local model of the D1 eligibility contract, used by regression tests
 * and deployment review tooling. It is not a Worker middleware and does not
 * change request behavior.
 */
export function isD1CacheEligible(request: Request): boolean {
  const url = new URL(request.url)

  if (url.hostname !== D1_PRODUCTION_HOST) return false
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (url.search !== '') return false

  for (const header of [
    'authorization',
    'cookie',
    'rsc',
    'next-router-prefetch',
    'next-router-state-tree',
    'next-url',
  ]) {
    if (request.headers.has(header)) return false
  }

  if (headerContains(request, 'accept', 'text/x-component')) return false
  if (headerContains(request, 'purpose', 'prefetch')) return false
  if (headerContains(request, 'purpose', 'prerender')) return false
  if (headerContains(request, 'sec-purpose', 'prefetch')) return false
  if (headerContains(request, 'sec-purpose', 'prerender')) return false

  return D1_ROUTE_FAMILIES.some((family) => pathMatchesFamily(url.pathname, family))
}

/**
 * Prefixes are the smallest safe invalidation scope for D1's current route
 * families. They cover only the localized HTML families, never /_next/static,
 * APIs, sitemap files, or unrelated public assets.
 */
export const D1_CACHE_PURGE_PREFIXES = D1_LOCALES.flatMap((locale) =>
  D1_ROUTE_FAMILIES.map((family) => `https://${D1_PRODUCTION_HOST}/${locale}${family}/`),
)

/** Exact family roots are separately purged because a trailing-slash prefix
 * does not include the family root itself. */
export const D1_CACHE_PURGE_FILES = D1_LOCALES.flatMap((locale) =>
  D1_ROUTE_FAMILIES.map((family) => `https://${D1_PRODUCTION_HOST}/${locale}${family}`),
)

export function d1CachePurgePlan() {
  return {
    mechanism: 'Cloudflare zone purge_cache with exact files and trailing-slash prefixes',
    files: D1_CACHE_PURGE_FILES,
    prefixes: D1_CACHE_PURGE_PREFIXES,
    count: D1_CACHE_PURGE_FILES.length + D1_CACHE_PURGE_PREFIXES.length,
    excludes: ['/_next/static/*', '/sitemaps/*', '/api/*', 'Store/Campaign routes'],
  } as const
}

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

// 7200 seconds is the conservative plan-safe backstop while the zone plan is
// not independently proven. Do not lower this to 3600 without plan evidence.
export const D1_CACHE_RULE_EDGE_TTL_SECONDS = 2 * 60 * 60
export const D1_EXPECTED_RULE_ORDER = 1 as const

export const D1_LOCALES = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
export const D1_ROUTE_FAMILIES = ['/glasses-guide', '/style', '/sunglasses-for'] as const

type D1Locale = (typeof D1_LOCALES)[number]
type D1RouteFamily = (typeof D1_ROUTE_FAMILIES)[number]

export interface D1CacheRuleApiRule {
  ref: 'visutry-d1-seo-html-cache-shield'
  description: typeof D1_CACHE_RULE_NAME
  expression: string
  action: 'set_cache_settings'
  action_parameters: {
    cache: true
    edge_ttl: { mode: 'override_origin'; default: number }
    browser_ttl: { mode: 'bypass_by_default' }
  }
  enabled: true
}

export interface D1VercelVerificationConfig {
  apiToken: string
  projectId: string
  teamId: string
  deploymentId: string
  expectedGitSha: string
  productionAlias: string
}

export interface D1VercelDeploymentProof {
  id: string
  projectId: string
  teamId: string
  target: string | null
  readyState: string | null
  gitSha: string | null
  aliases: readonly string[]
}

export interface D1CloudflarePurgePayload {
  success?: boolean
}

export interface D1LiveRuleSnapshot {
  id: string
  expression: string
  action: string
  action_parameters: Record<string, unknown>
  enabled: boolean
  order: number
}

export interface D1RuleDriftReport {
  matches: boolean
  mismatches: string[]
  expected: D1LiveRuleSnapshot
  actual: D1LiveRuleSnapshot | null
}

const d1CacheRuleActionParameters = {
  cache: true,
  edge_ttl: { mode: 'override_origin', default: D1_CACHE_RULE_EDGE_TTL_SECONDS },
  browser_ttl: { mode: 'bypass_by_default' },
} as const

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
 * cookie name. Header-map truncation is also a bypass because the contract
 * cannot safely prove that private headers were observed.
 */
export const D1_CACHE_RULE_EXPRESSION = `(http.host eq "${D1_PRODUCTION_HOST}"
and http.request.method in {"GET" "HEAD"}
and http.request.uri.query eq ""
and not http.request.headers.truncated
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

/** Exact Rulesets API rule shape; it contains no invented `vary` structure. */
export const D1_CACHE_RULE_API_RULE: D1CacheRuleApiRule = {
  ref: 'visutry-d1-seo-html-cache-shield',
  description: D1_CACHE_RULE_NAME,
  expression: D1_CACHE_RULE_EXPRESSION,
  action: 'set_cache_settings',
  action_parameters: d1CacheRuleActionParameters,
  enabled: true,
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
export function isD1CacheEligible(request: Request, context: { headersTruncated?: boolean } = {}): boolean {
  const url = new URL(request.url)

  if (url.hostname !== D1_PRODUCTION_HOST) return false
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (url.search !== '') return false
  if (context.headersTruncated === true) return false

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
 * Cloudflare prefix purge accepts host/path values without scheme, query, or
 * wildcard. Each prefix covers both the family root and its detail pages.
 */
export const D1_CACHE_PURGE_PREFIXES = D1_LOCALES.flatMap((locale) =>
  D1_ROUTE_FAMILIES.map((family) => `${D1_PRODUCTION_HOST}/${locale}${family}`),
)

export function d1CachePurgeRequestBody() {
  return { prefixes: [...D1_CACHE_PURGE_PREFIXES] } as const
}

export function d1CachePurgePlan() {
  return {
    purgeType: 'prefixes',
    prefixCount: D1_CACHE_PURGE_PREFIXES.length,
    prefixes: D1_CACHE_PURGE_PREFIXES,
    excludes: ['/_next/static/*', '/sitemaps/*', '/api/*', 'Store/Campaign routes'],
  } as const
}

export function isCloudflarePurgeSuccessful(status: number, payload: D1CloudflarePurgePayload): boolean {
  return status >= 200 && status < 300 && payload.success === true
}

export function readVercelVerificationConfig(
  env: Record<string, string | undefined>,
): D1VercelVerificationConfig {
  const values = {
    apiToken: env.VERCEL_API_TOKEN,
    projectId: env.VERCEL_PROJECT_ID,
    teamId: env.VERCEL_TEAM_ID,
    deploymentId: env.VERCEL_PRODUCTION_DEPLOYMENT_ID,
    expectedGitSha: env.VERCEL_PRODUCTION_SHA,
    productionAlias: env.VERCEL_PRODUCTION_ALIAS ?? D1_PRODUCTION_HOST,
  }
  const missing = Object.entries(values)
    .filter(([key, value]) => key !== 'productionAlias' && !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`missing Vercel verification configuration: ${missing.join(', ')}`)
  }
  return values as D1VercelVerificationConfig
}

export function isVercelProductionDeploymentProofValid(
  proof: D1VercelDeploymentProof,
  config: Pick<D1VercelVerificationConfig, 'projectId' | 'teamId' | 'deploymentId' | 'expectedGitSha' | 'productionAlias'>,
): boolean {
  return proof.id === config.deploymentId
    && proof.projectId === config.projectId
    && proof.teamId === config.teamId
    && proof.target === 'production'
    && proof.readyState === 'READY'
    && proof.gitSha === config.expectedGitSha
    && proof.aliases.includes(config.productionAlias)
}

export function compareD1LiveRule(actual: D1LiveRuleSnapshot | null): D1RuleDriftReport {
  const expected: D1LiveRuleSnapshot = {
    id: D1_CACHE_RULE_ID,
    expression: D1_CACHE_RULE_EXPRESSION,
    action: 'set_cache_settings',
    action_parameters: d1CacheRuleActionParameters,
    enabled: true,
    order: D1_EXPECTED_RULE_ORDER,
  }
  if (!actual) {
    return { matches: false, mismatches: ['live D1 rule not found'], expected, actual: null }
  }
  const mismatches = (['id', 'expression', 'action', 'action_parameters', 'enabled', 'order'] as const)
    .filter((field) => JSON.stringify(actual[field]) !== JSON.stringify(expected[field]))
  return { matches: mismatches.length === 0, mismatches, expected, actual }
}

/**
 * Production Worker Routes for www.visutry.com.
 *
 * Vercel is the sole Next frontend owner (B4_NEXT_FRONTEND_OWNER === 'vercel').
 * This generator emits ONLY approved NON-Next capabilities: non-Next public static
 * assets, control files, and read-only edge APIs. It never emits Next HTML routes
 * and never emits `/_next/static/*` — those are FORBIDDEN (see
 * B4_FORBIDDEN_PRODUCTION_ROUTE_PATTERNS). A future full migration of the entire
 * Next frontend (including /_next/static) to Cloudflare is the only thing that may
 * change this. `npm run deploy:cloudflare` uses `--env staging` only.
 *
 * Cloudflare route syntax (not regex):
 * - `*` matches zero or more of any character
 * - no infix wildcards, no query parameters in the pattern
 * - path `*` only at the end
 * - more specific patterns win
 * - `path*` also matches `path/child` (known greedy behavior) — never use
 *   `/:locale/store*` because it would capture Store detail
 *
 * Custom Domain is forbidden: it would send every non-asset path through the
 * Worker, including Layer 3.
 */

export {
  B4_LOCALES,
  B4_NEXT_FRONTEND_OWNER,
} from './b4-production-public-slice'

import {
  B4_CONTROL_FILES_EXACT,
  B4_DEPLOY_PUBLIC_ASSET_EXACT,
  B4_DEPLOY_PUBLIC_ASSET_PREFIXES,
  B4_FIRST_SLICE_APIS,
  B4_LOCALES,
  B4_NEXT_FRONTEND_OWNER,
} from './b4-production-public-slice'
import fs from 'node:fs'
import path from 'node:path'

export const B4_PRODUCTION_PUBLIC_HOST = 'www.visutry.com'
export const B4_PRODUCTION_ZONE = 'visutry.com'
export const B4_PRODUCTION_WORKER_NAME = 'visutry-cf-production'
export const B4_PRODUCTION_FALLBACK_ORIGIN = 'https://visutry.vercel.app'
export const B4_REQUIRED_REQUEST_LIMIT_FAIL_OPEN = true
export const B4_VERCEL_DNS_EXAMPLE_HOSTS = ['cname.vercel-dns.com', 'cname.vercel-dns-0.com'] as const
export const B4_PRODUCTION_DNS_INSPECT_PATH = 'cloudflare-router/b4-production-dns.inspect.json'

export type B4RoutePriority = 'P0' | 'P1' | 'P2'
export type B4RouteLayer = 'layer1-static-asset' | 'layer2-worker'
export type B4RouteFeasibility = 'A' | 'B' | 'C' | 'D'
export type B4ActivationGate = 'none' | 'same-commit-asset-parity'

export interface B4ProductionDnsInspect {
  domain: string
  resolved: boolean
  inspectedAt: string | null
  command: string
  recordType: 'CNAME' | 'A' | 'AAAA' | null
  target: string | null
  examplesThatMustNotBeAssumed: string[]
  source?: string
  apexAlias?: string | null
  publicARecordsObserved?: string[]
  note?: string
}

export interface B4ProductionWorkerRoute {
  pattern: string
  layer: B4RouteLayer
  expectedExecution: 'static-asset' | 'worker'
  workerQuota: boolean | 'asset-miss-only'
  reason: string
  excludedConflicts: string[]
  rollbackClass: 'delete-route'
  priority: B4RoutePriority
  feasibility: B4RouteFeasibility
  activationGate: B4ActivationGate
  requestLimitFailOpen: true
}

/**
 * Patterns that MUST NEVER appear in a production Worker route payload while
 * Vercel owns the Next frontend (B4_NEXT_FRONTEND_OWNER === 'vercel').
 *
 * `/_next/static/*` is the hard block: serving a CLOUDFLARE_BUILD=1 client graph
 * from this shared namespace breaks Vercel-owned HTML (ChunkLoadError 2026-08-19).
 * Next HTML host/locale patterns are forbidden for the same reason — CF HTML would
 * reference a peer client graph. This is NOT a soft same-commit-parity gate; it is
 * FORBIDDEN unless the entire Next frontend migrates to Cloudflare as one build.
 */
export const B4_FORBIDDEN_PRODUCTION_ROUTE_PATTERNS = [
  `${B4_PRODUCTION_PUBLIC_HOST}/_next/static/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/_next/static*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/_next/*`,
] as const

/** Path fragments that identify a forbidden Next client-graph route pattern. */
export const B4_FORBIDDEN_ROUTE_FRAGMENTS = ['/_next/static', '/_next/'] as const

function hostPattern(pathPattern: string): string {
  return `${B4_PRODUCTION_PUBLIC_HOST}${pathPattern}`
}

function prefixToWildcard(prefix: string): string {
  const directory = prefix.endsWith('/') ? prefix : `${prefix}/`
  return `${directory}*`
}

/**
 * True if a Worker route pattern would put the Next client artifact graph
 * (`/_next/static/*`) on Cloudflare. Such patterns are forbidden in production.
 */
export function isForbiddenNextClientGraphRoute(pattern: string): boolean {
  return B4_FORBIDDEN_ROUTE_FRAGMENTS.some((fragment) => pattern.includes(fragment))
}

/**
 * Production Worker Routes for www.visutry.com.
 *
 * Vercel is the sole Next frontend owner, so this generator emits ONLY approved
 * NON-Next capabilities: non-Next public static assets (favicon, /images, /home,
 * /experience-heroes, /blog-covers, /assets), control files (robots/llms), and the
 * approved read-only edge APIs (health + glasses catalog). It intentionally emits
 * NO Next HTML routes, NO locale homes, NO marketing/SEO HTML, NO Next sitemaps,
 * and NO `/_next/static/*`. `assertSafeB4ProductionRoutes` fails if any forbidden
 * Next client-graph or Next HTML route ever reappears.
 */
export function generateB4ProductionWorkerRoutes(): B4ProductionWorkerRoute[] {
  const routes: B4ProductionWorkerRoute[] = []
  const seen = new Set<string>()

  const push = (
    route: Omit<B4ProductionWorkerRoute, 'activationGate' | 'requestLimitFailOpen'> & {
      activationGate?: B4ActivationGate
    },
  ) => {
    if (seen.has(route.pattern)) return
    // Hard guard: never emit a Next client-graph route into the production payload.
    if (isForbiddenNextClientGraphRoute(route.pattern)) {
      throw new Error(
        `Refusing to generate forbidden production Worker route ${route.pattern}: ` +
          `Next /_next/static is owned by Vercel (B4_NEXT_FRONTEND_OWNER=${B4_NEXT_FRONTEND_OWNER}).`,
      )
    }
    seen.add(route.pattern)
    routes.push({
      ...route,
      activationGate: route.activationGate || 'none',
      requestLimitFailOpen: true,
    })
  }

  for (const prefix of B4_DEPLOY_PUBLIC_ASSET_PREFIXES) {
    push({
      pattern: hostPattern(prefixToWildcard(prefix)),
      layer: 'layer1-static-asset',
      expectedExecution: 'static-asset',
      workerQuota: 'asset-miss-only',
      reason: 'non-Next public files in .open-next/assets (not part of the Next client graph)',
      excludedConflicts: [],
      rollbackClass: 'delete-route',
      priority: 'P0',
      feasibility: 'B',
    })
  }

  for (const path of [...B4_DEPLOY_PUBLIC_ASSET_EXACT, ...B4_CONTROL_FILES_EXACT]) {
    push({
      pattern: hostPattern(path),
      layer: 'layer1-static-asset',
      expectedExecution: 'static-asset',
      workerQuota: 'asset-miss-only',
      reason: 'exact non-Next control/public asset in .open-next/assets',
      excludedConflicts: [],
      rollbackClass: 'delete-route',
      priority: 'P0',
      feasibility: 'A',
    })
  }

  for (const path of B4_FIRST_SLICE_APIS) {
    push({
      pattern: hostPattern(path),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: 'approved GET/HEAD non-Next public API; exact so /api/glasses/frames cannot match',
      excludedConflicts: ['/api/glasses/frames', '/api/auth/*', '/api/glasses/*'],
      rollbackClass: 'delete-route',
      priority: 'P0',
      feasibility: 'A',
    })
  }

  return routes
}

/**
 * Cloudflare Worker route matching (documented semantics, not a regex engine).
 * Query string is part of the URL; patterns without a trailing * do not match queries.
 */
export function cloudflareRouteMatches(pattern: string, requestUrl: string): boolean {
  const url = new URL(requestUrl)
  let rest = pattern
  let scheme: 'http' | 'https' | 'both' = 'both'
  if (rest.startsWith('https://')) {
    scheme = 'https'
    rest = rest.slice('https://'.length)
  } else if (rest.startsWith('http://')) {
    scheme = 'http'
    rest = rest.slice('http://'.length)
  }
  if (scheme !== 'both' && url.protocol !== `${scheme}:`) return false

  const slash = rest.indexOf('/')
  const hostPattern = slash === -1 ? rest : rest.slice(0, slash)
  const pathPattern = slash === -1 ? '' : rest.slice(slash)
  if (!matchHost(hostPattern, url.hostname)) return false

  const pathAndQuery = `${url.pathname}${url.search}`
  if (pathPattern === '') {
    return url.pathname === '/' && url.search === ''
  }
  if (pathPattern.endsWith('*')) {
    const prefix = pathPattern.slice(0, -1)
    return pathAndQuery.startsWith(prefix)
  }
  return pathAndQuery === pathPattern
}

function matchHost(pattern: string, hostname: string): boolean {
  const host = hostname.toLowerCase()
  const expected = pattern.toLowerCase()
  if (expected.startsWith('*.')) {
    const suffix = expected.slice(1)
    return host.endsWith(suffix) && host !== expected.slice(2)
  }
  if (expected.startsWith('*')) {
    return host.endsWith(expected.slice(1)) || host === expected.slice(1)
  }
  return host === expected
}

export function matchingB4ProductionRoutes(requestUrl: string, routes = generateB4ProductionWorkerRoutes()): B4ProductionWorkerRoute[] {
  return routes
    .filter((route) => cloudflareRouteMatches(route.pattern, requestUrl))
    .sort((a, b) => b.pattern.length - a.pattern.length)
}

export function wwwWorkerRouteMatch(
  pathname: string,
  search = '',
  routes = generateB4ProductionWorkerRoutes(),
): B4ProductionWorkerRoute | null {
  const url = `https://${B4_PRODUCTION_PUBLIC_HOST}${pathname}${search}`
  return matchingB4ProductionRoutes(url, routes)[0] || null
}

export function routesForPriority(
  priority: B4RoutePriority,
  routes = generateB4ProductionWorkerRoutes(),
  options?: { includeParityGatedHashedStatic?: boolean },
): B4ProductionWorkerRoute[] {
  const allowed: B4RoutePriority[] = priority === 'P0' ? ['P0'] : priority === 'P1' ? ['P0', 'P1'] : ['P0', 'P1', 'P2']
  return routes.filter((route) => {
    if (!allowed.includes(route.priority)) return false
    if (route.activationGate === 'same-commit-asset-parity' && !options?.includeParityGatedHashedStatic) return false
    return true
  })
}

export function proposedWranglerProductionRoutes(
  priority: B4RoutePriority = 'P2',
  options?: { includeParityGatedHashedStatic?: boolean },
) {
  return routesForPriority(priority, generateB4ProductionWorkerRoutes(), options).map((route) => ({
    pattern: route.pattern,
    zone_name: B4_PRODUCTION_ZONE,
  }))
}

export function proposedCloudflareRouteApiPayload(
  priority: B4RoutePriority = 'P2',
  options?: { includeParityGatedHashedStatic?: boolean },
) {
  return routesForPriority(priority, generateB4ProductionWorkerRoutes(), options).map((route) => ({
    pattern: route.pattern,
    script: B4_PRODUCTION_WORKER_NAME,
    request_limit_fail_open: B4_REQUIRED_REQUEST_LIMIT_FAIL_OPEN,
  }))
}

export function readProductionWwwDnsInspect(inspectJson?: string): B4ProductionDnsInspect {
  const raw = inspectJson ?? fs.readFileSync(path.join(__dirname, 'b4-production-dns.inspect.json'), 'utf8')
  return JSON.parse(raw) as B4ProductionDnsInspect
}

export function requireFrozenWwwDnsTarget(inspect = readProductionWwwDnsInspect()): { recordType: 'CNAME' | 'A' | 'AAAA'; target: string } {
  if (!inspect.resolved || !inspect.recordType || !inspect.target) {
    throw new Error(
      `www DNS target is not frozen. Run \`${inspect.command}\` in Phase A and write the actual record to ${B4_PRODUCTION_DNS_INSPECT_PATH}.`,
    )
  }
  const assumed = B4_VERCEL_DNS_EXAMPLE_HOSTS.some((example) => example === inspect.target)
  if (assumed && inspect.inspectedAt == null) {
    throw new Error(`www DNS target ${inspect.target} looks like a docs example; freeze the inspect output first`)
  }
  return { recordType: inspect.recordType, target: inspect.target }
}

export function assertFailOpenActivation(
  payload = proposedCloudflareRouteApiPayload('P2', { includeParityGatedHashedStatic: true }),
): string[] {
  return payload
    .filter((row) => row.request_limit_fail_open !== true)
    .map((row) => `${row.pattern} missing request_limit_fail_open=true`)
}

export interface B4AttachedCloudflareRoute {
  pattern: string
  script?: string | null
  request_limit_fail_open?: boolean
}

export function assertRemoteFailOpenActivation(options: {
  attached: B4AttachedCloudflareRoute[]
  expectedPatterns?: string[]
  workerName?: string
}): string[] {
  const errors: string[] = []
  const expected = options.expectedPatterns ?? routesForPriority('P0').map((route) => route.pattern)
  const expectedSet = new Set(expected)
  const workerName = options.workerName ?? B4_PRODUCTION_WORKER_NAME
  if (options.attached.length === 0) {
    return ['no remote Cloudflare routes were read; local intent is not Phase C PASS']
  }

  const wwwAttached = options.attached.filter((row) => row.pattern.includes(B4_PRODUCTION_PUBLIC_HOST))
  for (const remote of wwwAttached) {
    if (!expectedSet.has(remote.pattern)) {
      errors.push(`unexpected www route attached remotely: ${remote.pattern}`)
    }
  }

  const byPattern = new Map(wwwAttached.map((row) => [row.pattern, row]))
  for (const pattern of expected) {
    const remote = byPattern.get(pattern)
    if (!remote) {
      errors.push(`expected route not attached remotely: ${pattern}`)
      continue
    }
    if (remote.request_limit_fail_open !== true) {
      errors.push(`${pattern} remote request_limit_fail_open=${String(remote.request_limit_fail_open)}`)
    }
    if (remote.script !== workerName) {
      errors.push(`${pattern} attached to ${String(remote.script ?? 'null')}, expected ${workerName}`)
    }
  }
  return errors
}

export const B4_FORBIDDEN_WRANGLER_SHAPES = [
  'www.visutry.com/*',
  '*visutry.com/*',
  'visutry.com/*',
  'custom_domain',
] as const

export const B4_NEGATIVE_PATHS = [
  // Next frontend (HTML / RSC / client graph) is owned by Vercel and must never
  // match a production Worker route.
  '/',
  '/en',
  '/id',
  '/en/store',
  '/store',
  '/en/pricing',
  '/en/brand/warby-parker',
  '/en/blog',
  '/blog',
  '/en/blog/how-to-choose-glasses-for-your-face',
  '/en/glasses-guide',
  '/en/glasses-guide/best-rectangle-glasses-for-round-face',
  '/en/face-shapes/oval',
  '/en/style/round-face',
  '/en/try-on/glasses',
  '/en/face-analysis',
  '/en/face-shape-detector',
  '/_next/static/chunks/app.js',
  '/_next/static/css/app.css',
  '/sitemap.xml',
  '/sitemaps/core.xml',
  '/api/auth/session',
  '/api/auth/callback/auth0',
  '/auth/signin',
  '/api/glasses/frames',
  '/api/frames',
  '/_next/image',
  '/en/store/ello-sunglasses',
  '/en/store/luna-optical',
  '/en/c/foo/bar',
  '/en/c/luna-optical/petite-fit',
  '/en/category/foo',
  '/en/try/foo',
  '/en/try/round-glasses',
  '/en/discover',
  '/en/style-explorer',
  '/en/dashboard',
  '/en/merchant',
  '/en/payments',
  '/en/user/someone',
  '/en/share/abc',
  '/admin',
  '/admin/dashboard',
  '/sitemaps/dynamic.xml',
  '/api/unknown-capability',
  '/api/payment/create-session',
  '/api/upload',
  '/api/cron/cleanup-expired-tasks',
  '/api/admin/frames',
  '/api/mcp',
  '/api/merchant/workspaces',
  '/api/face-analysis/submit',
  '/api/store/sessions',
  '/api/try-on/submit',
  '/api/agent/v1/merchant',
] as const

export const B4_POSITIVE_PATHS = [
  // Only approved NON-Next capabilities may match a production Worker route.
  '/api/health',
  '/api/glasses/brands',
  '/api/glasses/categories',
  '/api/glasses/face-shapes',
  '/robots.txt',
  '/llms.txt',
  '/favicon.ico',
  '/images/seo/core/common-face-shapes-guide.webp',
  '/home/hero.webp',
  '/experience-heroes/demo.webp',
  '/blog-covers/cover.jpg',
  '/assets/logo.png',
] as const

export function assertSafeB4ProductionRoutes(routes = generateB4ProductionWorkerRoutes()): string[] {
  const errors: string[] = []
  for (const route of routes) {
    if (route.pattern.includes('custom_domain')) errors.push(`custom_domain in ${route.pattern}`)
    if (route.pattern === 'www.visutry.com/*' || route.pattern.endsWith('.com/*') && route.pattern.split('/').length <= 2) {
      errors.push(`catch-all ${route.pattern}`)
    }
    if (route.pattern.includes('/store*')) errors.push(`greedy store wildcard ${route.pattern}`)
    if (route.pattern.includes('/style*') && !route.pattern.includes('/style/')) {
      errors.push(`greedy style wildcard ${route.pattern}`)
    }
    if (route.pattern.includes('/api/glasses*') && !route.pattern.includes('/api/glasses/')) {
      errors.push(`greedy glasses API wildcard ${route.pattern}`)
    }
    if (route.pattern.includes('/try/*') || route.pattern.endsWith('/try*')) {
      errors.push(`try-dynamic capture ${route.pattern}`)
    }
    if (route.requestLimitFailOpen !== true) {
      errors.push(`${route.pattern} is not request-limit fail-open`)
    }
    // HARD BLOCK: the Next client artifact graph (/_next/*) is owned by Vercel and
    // must never appear as a production Worker route (not even parity-gated).
    if (isForbiddenNextClientGraphRoute(route.pattern)) {
      errors.push(`${route.pattern} is a FORBIDDEN Next client-graph route (Vercel owns /_next/static)`)
    }
    for (const forbidden of B4_FORBIDDEN_PRODUCTION_ROUTE_PATTERNS) {
      if (route.pattern === forbidden) {
        errors.push(`${route.pattern} is an explicitly forbidden production route`)
      }
    }
    if (
      route.layer === 'layer1-static-asset'
      && route.pattern.endsWith('*')
      && !route.pattern.endsWith('/*')
    ) {
      errors.push(`greedy static wildcard ${route.pattern}; use a directory /* pattern`)
    }
  }

  errors.push(...assertFailOpenActivation())

  const inspect = readProductionWwwDnsInspect()
  if (inspect.resolved && !inspect.inspectedAt) {
    errors.push('resolved www DNS inspect is missing inspectedAt')
  }
  if (!inspect.resolved && inspect.target) {
    errors.push('unresolved www DNS inspect must not hardcode a target')
  }
  if (!inspect.resolved) {
    try {
      requireFrozenWwwDnsTarget(inspect)
      errors.push('unresolved www DNS inspect must not yield a frozen target')
    } catch {
      // expected
    }
  }

  for (const path of B4_NEGATIVE_PATHS) {
    const match = wwwWorkerRouteMatch(path, '', routes)
    if (match) errors.push(`${path} matched ${match.pattern}`)
  }

  for (const locale of B4_LOCALES) {
    const detail = wwwWorkerRouteMatch(`/${locale}/store/ello-sunglasses`, '', routes)
    if (detail) errors.push(`/${locale}/store/:slug matched ${detail.pattern}`)
    const campaign = wwwWorkerRouteMatch(`/${locale}/c/merchant/campaign`, '', routes)
    if (campaign) errors.push(`/${locale}/c/* matched ${campaign.pattern}`)
    const explorer = wwwWorkerRouteMatch(`/${locale}/style-explorer`, '', routes)
    if (explorer) errors.push(`/${locale}/style-explorer matched ${explorer.pattern}`)
    const trySlug = wwwWorkerRouteMatch(`/${locale}/try/round-glasses`, '', routes)
    if (trySlug) errors.push(`/${locale}/try/:slug matched ${trySlug.pattern}`)
  }

  return errors
}

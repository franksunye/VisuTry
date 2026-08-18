/**
 * B4.2B proposed production Worker Routes for www.visutry.com.
 *
 * NOT activated. Do not copy these patterns into wrangler.jsonc until the
 * B4.2C cutover. `npm run deploy:cloudflare` uses `--env staging` only.
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
} from './b4-production-public-slice'

import {
  B4_CONTROL_FILES_EXACT,
  B4_DEPLOY_PUBLIC_ASSET_EXACT,
  B4_DEPLOY_PUBLIC_ASSET_PREFIXES,
  B4_FIRST_SLICE_APIS,
  B4_HASHED_IMMUTABLE_PREFIXES,
  B4_LOCALES,
  B4_LOCALIZED_EXACT_PAGES,
  B4_STATIC_SITEMAP_EXACT,
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

const SAFE_HTML_WILDCARDS: Array<{ stem: string; priority: B4RoutePriority; reason: string; excludedConflicts: string[] }> = [
  {
    stem: '/blog',
    priority: 'P2',
    reason: 'blog index, posts, and tags are first-slice HTML / locale-less 308s',
    excludedConflicts: [],
  },
  {
    stem: '/brand',
    priority: 'P2',
    reason: 'curated brand pages; unknown brand 404s on CF HTML, not Store/Campaign',
    excludedConflicts: [],
  },
  {
    stem: '/glasses-guide',
    priority: 'P2',
    reason: 'glasses-guide hub and slugs',
    excludedConflicts: ['/glasses-for-face-shape is a different stem'],
  },
  {
    stem: '/face-shapes',
    priority: 'P2',
    reason: 'face-shapes hub, shape pages, and compare pages',
    excludedConflicts: ['/face-shape-detector and /face-analysis are exact routes'],
  },
  {
    stem: '/sunglasses-for',
    priority: 'P2',
    reason: 'covers /sunglasses-for-face-shape and /sunglasses-for/:faceShape',
    excludedConflicts: [],
  },
  {
    stem: '/hairstyles-for',
    priority: 'P2',
    reason: 'covers /hairstyles-for-face-shape and /hairstyles-for/:faceShape',
    excludedConflicts: [],
  },
  {
    stem: '/try-on',
    priority: 'P1',
    reason: 'try-on landings; does not match /try/:slug because the stem is try-on',
    excludedConflicts: ['/:locale/try/*', '/try/*'],
  },
]

function hostPattern(pathPattern: string): string {
  return `${B4_PRODUCTION_PUBLIC_HOST}${pathPattern}`
}

function prefixToWildcard(prefix: string): string {
  const directory = prefix.endsWith('/') ? prefix : `${prefix}/`
  return `${directory}*`
}

function coveredByHtmlWildcard(path: string): boolean {
  return SAFE_HTML_WILDCARDS.some(({ stem }) => path === stem || path.startsWith(`${stem}/`) || path.startsWith(stem))
}

function exactMarketingPages(): string[] {
  return B4_LOCALIZED_EXACT_PAGES.filter((path) => path !== '/store' && !coveredByHtmlWildcard(path))
}

export function generateB4ProductionWorkerRoutes(): B4ProductionWorkerRoute[] {
  const routes: B4ProductionWorkerRoute[] = []
  const seen = new Set<string>()

  const push = (
    route: Omit<B4ProductionWorkerRoute, 'activationGate' | 'requestLimitFailOpen'> & {
      activationGate?: B4ActivationGate
    },
  ) => {
    if (seen.has(route.pattern)) return
    seen.add(route.pattern)
    routes.push({
      ...route,
      activationGate: route.activationGate || 'none',
      requestLimitFailOpen: true,
    })
  }

  for (const prefix of B4_HASHED_IMMUTABLE_PREFIXES) {
    push({
      pattern: hostPattern(prefixToWildcard(prefix)),
      layer: 'layer1-static-asset',
      expectedExecution: 'static-asset',
      workerQuota: 'asset-miss-only',
      reason: 'hashed OpenNext Static Assets; production route is parity-gated because Vercel and CLOUDFLARE_BUILD=1 emit independent webpack graphs. Pattern is `/_next/static/*`, not `/_next/static*`.',
      excludedConflicts: ['/_next/image stays unrouted', 'do not publish until same-commit Vercel files ⊆ CF assets'],
      rollbackClass: 'delete-route',
      priority: 'P0',
      feasibility: 'B',
      activationGate: 'same-commit-asset-parity',
    })
  }

  for (const prefix of B4_DEPLOY_PUBLIC_ASSET_PREFIXES) {
    push({
      pattern: hostPattern(prefixToWildcard(prefix)),
      layer: 'layer1-static-asset',
      expectedExecution: 'static-asset',
      workerQuota: 'asset-miss-only',
      reason: 'non-hashed public files in .open-next/assets',
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
      reason: 'exact control/public asset in .open-next/assets',
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
      reason: 'approved GET/HEAD public API; exact so /api/glasses/frames cannot match',
      excludedConflicts: ['/api/glasses/frames', '/api/auth/*', '/api/glasses/*'],
      rollbackClass: 'delete-route',
      priority: 'P0',
      feasibility: 'A',
    })
  }

  push({
    pattern: B4_PRODUCTION_PUBLIC_HOST,
    layer: 'layer2-worker',
    expectedExecution: 'worker',
    workerQuota: true,
    reason: 'root locale detection; implied path / only (Cloudflare: example.com matches / and nothing else)',
    excludedConflicts: ['www.visutry.com/* catch-all is forbidden'],
    rollbackClass: 'delete-route',
    priority: 'P1',
    feasibility: 'A',
  })

  for (const path of B4_STATIC_SITEMAP_EXACT) {
    push({
      pattern: hostPattern(path),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: 'static sitemaps are OpenNext Worker cache, not Static Assets',
      excludedConflicts: ['/sitemaps/dynamic.xml'],
      rollbackClass: 'delete-route',
      priority: 'P1',
      feasibility: 'A',
    })
  }

  const htmlExact = ['/store', ...exactMarketingPages()]

  for (const locale of B4_LOCALES) {
    push({
      pattern: hostPattern(`/${locale}`),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: 'locale home; never use /:locale* which would capture Layer 3',
      excludedConflicts: [`/${locale}/store/:slug`, `/${locale}/discover`, `/${locale}/c/*`],
      rollbackClass: 'delete-route',
      priority: 'P1',
      feasibility: 'A',
    })

    for (const path of htmlExact) {
      push({
        pattern: hostPattern(`/${locale}${path}`),
        layer: 'layer2-worker',
        expectedExecution: 'worker',
        workerQuota: true,
        reason: path === '/store'
          ? 'Store hub only. Cloudflare path* is greedy; store* would capture /store/:slug'
          : 'approved first-slice marketing/SEO HTML',
        excludedConflicts: path === '/store' ? [`/${locale}/store/:merchantSlug`] : [],
        rollbackClass: 'delete-route',
        priority: 'P1',
        feasibility: 'A',
      })
    }

    for (const wildcard of SAFE_HTML_WILDCARDS) {
      push({
        pattern: hostPattern(`/${locale}${wildcard.stem}*`),
        layer: 'layer2-worker',
        expectedExecution: 'worker',
        workerQuota: true,
        reason: wildcard.reason,
        excludedConflicts: wildcard.excludedConflicts,
        rollbackClass: 'delete-route',
        priority: wildcard.priority,
        feasibility: 'B',
      })
    }

    push({
      pattern: hostPattern(`/${locale}/style/*`),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: 'style/:faceShape only. style* would capture /style-explorer',
      excludedConflicts: [`/${locale}/style-explorer`],
      rollbackClass: 'delete-route',
      priority: 'P2',
      feasibility: 'B',
    })
  }

  for (const path of htmlExact) {
    push({
      pattern: hostPattern(path),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: path === '/store'
        ? 'locale-less store hub 308; not /store/:slug'
        : 'locale-less first-slice 308',
      excludedConflicts: path === '/store' ? ['/store/:merchantSlug'] : [],
      rollbackClass: 'delete-route',
      priority: 'P1',
      feasibility: 'A',
    })
  }

  for (const wildcard of SAFE_HTML_WILDCARDS) {
    push({
      pattern: hostPattern(`${wildcard.stem}*`),
      layer: 'layer2-worker',
      expectedExecution: 'worker',
      workerQuota: true,
      reason: `locale-less ${wildcard.reason}`,
      excludedConflicts: wildcard.excludedConflicts,
      rollbackClass: 'delete-route',
      priority: wildcard.priority,
      feasibility: 'B',
    })
  }

  push({
    pattern: hostPattern('/style/*'),
    layer: 'layer2-worker',
    expectedExecution: 'worker',
    workerQuota: true,
    reason: 'locale-less /style/:faceShape 308s; not /style-explorer',
    excludedConflicts: ['/style-explorer'],
    rollbackClass: 'delete-route',
    priority: 'P2',
    feasibility: 'B',
  })

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
  '/',
  '/en',
  '/id',
  '/en/store',
  '/en/pricing',
  '/en/brand/warby-parker',
  '/en/blog',
  '/en/blog/how-to-choose-glasses-for-your-face',
  '/en/glasses-guide',
  '/en/face-shapes/oval',
  '/en/style/round-face',
  '/en/try-on/glasses',
  '/en/face-shape-detector',
  '/api/health',
  '/api/glasses/brands',
  '/robots.txt',
  '/llms.txt',
  '/_next/static/chunks/app.js',
  '/images/seo/core/common-face-shapes-guide.webp',
  '/sitemap.xml',
  '/sitemaps/core.xml',
  '/blog',
  '/store',
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
    if (route.pattern.includes('/_next/static') && route.activationGate !== 'same-commit-asset-parity') {
      errors.push(`${route.pattern} must stay behind same-commit-asset-parity`)
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

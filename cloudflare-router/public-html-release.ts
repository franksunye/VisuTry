import {
  PUBLIC_HTML_OFFLOAD_PURGE_URLS,
  PUBLIC_HTML_OFFLOAD_ROUTES,
} from './public-html-offload'
import {
  assertSafeProductionRouteConfig,
  PRODUCTION_ROUTE_COUNT,
  type ParsedProductionRouteConfig,
} from './worker-routes-governance'
import { proposedWranglerProductionRoutes } from './b4-production-routes'

export const PUBLIC_HTML_RELEASE_MODE_VALUES = ['auto', 'force'] as const
export type PublicHtmlReleaseMode = (typeof PUBLIC_HTML_RELEASE_MODE_VALUES)[number]

export const PUBLIC_HTML_RELEASE_ROUTE_COUNT = PUBLIC_HTML_OFFLOAD_ROUTES.length
export const PUBLIC_HTML_RELEASE_EXPECTED_ROUTE_COUNT = 7
export const PUBLIC_HTML_RELEASE_EXPECTED_WORKER_ROUTE_COUNT = PRODUCTION_ROUTE_COUNT
export const PUBLIC_HTML_RELEASE_USER_AGENT = 'VisuTry-Production-Release/1.0'

export const CLOUDFLARE_ARTIFACT_CHANGE_RULES = [
  'cloudflare-router/**',
  'wrangler.production-traffic-layer.jsonc',
  'scripts/prepare-cloudflare-assets.mjs',
  'public/**',
  'package.json',
  'package-lock.json',
] as const

export interface CloudflareDeployDecision {
  deployRequired: boolean
  mode: PublicHtmlReleaseMode
  matchingFiles: string[]
  reasons: string[]
}

export interface PublicHtmlCacheObservation {
  url: string
  status: number
  contentType: string
  firstCacheStatus: string
  finalCacheStatus: string
  attempts: number
  cfCacheStatus: string | null
  outcome: 'PASS' | 'SECURITY_CHALLENGE_SKIP'
  securitySignal?: 'cf-mitigated: challenge'
}

export interface PublicHtmlWarmOptions {
  maxAttempts?: number
  delayMs?: number
  sleep?: (milliseconds: number) => Promise<void>
  allowCloudflareChallenge?: boolean
}

export function validateCurrentMainSha(target: string, currentMain: string): void {
  if (!/^[0-9a-f]{40}$/i.test(target)) throw new Error('target release SHA must be a full 40-character Git SHA')
  if (target !== currentMain) {
    throw new Error(`release SHA ${target} is not the current origin/main SHA ${currentMain}`)
  }
}

function normalizePath(file: string): string {
  return file.replace(/\\/g, '/')
}

function isCloudflareArtifactChange(file: string): boolean {
  const normalized = normalizePath(file)
  return normalized.startsWith('cloudflare-router/')
    || normalized === 'wrangler.production-traffic-layer.jsonc'
    || normalized === 'scripts/prepare-cloudflare-assets.mjs'
    || normalized.startsWith('public/')
    || normalized === 'package.json'
    || normalized === 'package-lock.json'
}

export function classifyCloudflareDeployment(
  changedFiles: readonly string[],
  mode: PublicHtmlReleaseMode = 'auto',
  comparisonAvailable = true,
): CloudflareDeployDecision {
  if (!PUBLIC_HTML_RELEASE_MODE_VALUES.includes(mode)) {
    throw new Error(`unsupported Cloudflare deployment mode: ${mode}`)
  }
  if (!comparisonAvailable) {
    return {
      deployRequired: true,
      mode,
      matchingFiles: [],
      reasons: ['changed-file comparison is unavailable; failing closed'],
    }
  }

  const matchingFiles = [...new Set(changedFiles.map(normalizePath).filter(isCloudflareArtifactChange))].sort()
  const detected = matchingFiles.length > 0
  if (mode === 'force') {
    return {
      deployRequired: true,
      mode,
      matchingFiles,
      reasons: ['manual force override requested', ...(detected ? ['artifact-affecting files also changed'] : [])],
    }
  }
  return {
    deployRequired: detected,
    mode,
    matchingFiles,
    reasons: detected
      ? ['artifact-affecting files changed']
      : ['changed files do not affect the Cloudflare production artifact'],
  }
}

export function releaseContractErrors(config: ParsedProductionRouteConfig): string[] {
  const errors = [...assertSafeProductionRouteConfig(config)]
  if (PUBLIC_HTML_RELEASE_ROUTE_COUNT !== PUBLIC_HTML_RELEASE_EXPECTED_ROUTE_COUNT) {
    errors.push(`public HTML offload URL count is ${PUBLIC_HTML_RELEASE_ROUTE_COUNT}, expected ${PUBLIC_HTML_RELEASE_EXPECTED_ROUTE_COUNT}`)
  }
  if (PUBLIC_HTML_OFFLOAD_PURGE_URLS.length !== PUBLIC_HTML_RELEASE_EXPECTED_ROUTE_COUNT) {
    errors.push(`public HTML purge URL count is ${PUBLIC_HTML_OFFLOAD_PURGE_URLS.length}, expected ${PUBLIC_HTML_RELEASE_EXPECTED_ROUTE_COUNT}`)
  }
  if (config.routes.some((route) => route.pattern === 'www.visutry.com/*')) {
    errors.push('production route contract contains a broad host wildcard')
  }
  if (config.routes.some((route) => route.pattern.includes('/_next/'))) {
    errors.push('production route contract contains a forbidden Next asset route')
  }

  const actualPatterns = new Set(config.routes.map((route) => route.pattern))
  const expectedPatterns = new Set(proposedWranglerProductionRoutes('P0').map((route) => route.pattern))
  const missingPatterns = [...expectedPatterns].filter((pattern) => !actualPatterns.has(pattern)).sort()
  const extraPatterns = [...actualPatterns].filter((pattern) => !expectedPatterns.has(pattern)).sort()
  if (missingPatterns.length > 0 || extraPatterns.length > 0) {
    errors.push(`production route data-plane drift: missing=${missingPatterns.join(',') || 'none'} extra=${extraPatterns.join(',') || 'none'}`)
  }

  const expectedHtmlPatterns = new Set(PUBLIC_HTML_OFFLOAD_ROUTES.map(({ path }) => `www.visutry.com${path}`))
  const actualHtmlPatterns = new Set(config.routes
    .map((route) => route.pattern)
    .filter((pattern) => expectedHtmlPatterns.has(pattern)))
  if (actualHtmlPatterns.size !== expectedHtmlPatterns.size) {
    errors.push(`public HTML route data-plane drift: expected ${expectedHtmlPatterns.size}, found ${actualHtmlPatterns.size}`)
  }
  return errors
}

export function publicHtmlReleasePurgeRequestBody() {
  return { files: [...PUBLIC_HTML_OFFLOAD_PURGE_URLS] } as const
}

function normalizedUrlPath(value: string): string {
  const url = new URL(value)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  return `${url.origin}${path}`
}

function canonicalHref(body: string): string | null {
  const linkTags = body.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    if (!/\brel=["']canonical["']/i.test(tag)) continue
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1]
    if (href) return href
  }
  return null
}

export function validatePublicHtmlDocument(path: string, response: Response, body: string): string[] {
  const errors: string[] = []
  const contentType = response.headers.get('content-type') ?? ''
  if (response.status !== 200) errors.push(`HTTP ${response.status}, expected 200`)
  if (!/text\/html/i.test(contentType)) errors.push(`content-type ${contentType || '<missing>'} is not text/html`)
  if (body.length < 100 || !/<html\b/i.test(body) || !/<head\b/i.test(body)) errors.push('response is not a normal HTML document')
  if (/application error|internal server error|upstream unavailable/i.test(body)) errors.push('response contains an error marker')

  const canonical = canonicalHref(body)
  const expected = normalizedUrlPath(`https://www.visutry.com${path}`)
  if (!canonical || normalizedUrlPath(new URL(canonical, expected).toString()) !== expected) {
    errors.push(`canonical does not point to ${expected}`)
  }
  return errors
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Cloudflare documents `cf-mitigated: challenge` as the deterministic signal
 * that a response is a Challenge Page. A status code alone is never enough to
 * classify a GitHub Runner response as an expected security challenge.
 */
export function isCloudflareChallengeResponse(response: Response): boolean {
  return response.headers.get('cf-mitigated')?.toLowerCase() === 'challenge'
}

export async function warmAndVerifyPublicHtml(
  urls: readonly string[] = PUBLIC_HTML_OFFLOAD_PURGE_URLS,
  fetchImpl: typeof fetch = fetch,
  options: PublicHtmlWarmOptions = {},
): Promise<PublicHtmlCacheObservation[]> {
  const maxAttempts = options.maxAttempts ?? 3
  const delayMs = options.delayMs ?? 1000
  const wait = options.sleep ?? sleep
  const allowCloudflareChallenge = options.allowCloudflareChallenge ?? false
  if (maxAttempts < 1) throw new Error('warm retry policy requires at least one attempt')

  const observations: PublicHtmlCacheObservation[] = []
  for (const url of urls) {
    const path = new URL(url).pathname
    let firstCacheStatus = ''
    let last: PublicHtmlCacheObservation | null = null
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': PUBLIC_HTML_RELEASE_USER_AGENT,
        },
        redirect: 'manual',
      })
      if (isCloudflareChallengeResponse(response)) {
        if (!allowCloudflareChallenge) {
          throw new Error(`${url}: Cloudflare Challenge Page detected (cf-mitigated: challenge)`)
        }
        const observation: PublicHtmlCacheObservation = {
          url,
          status: response.status,
          contentType: response.headers.get('content-type') ?? '',
          firstCacheStatus: 'CHALLENGE',
          finalCacheStatus: 'CHALLENGE',
          attempts: attempt,
          cfCacheStatus: response.headers.get('cf-cache-status'),
          outcome: 'SECURITY_CHALLENGE_SKIP',
          securitySignal: 'cf-mitigated: challenge',
        }
        last = observation
        observations.push(observation)
        break
      }

      const body = await response.text()
      const documentErrors = validatePublicHtmlDocument(path, response, body)
      if (documentErrors.length > 0) throw new Error(`${url}: ${documentErrors.join('; ')}`)

      const edgeCacheStatus = response.headers.get('x-visutry-edge-cache') ?? ''
      if (!['HIT', 'MISS'].includes(edgeCacheStatus)) {
        throw new Error(`${url}: missing or invalid x-visutry-edge-cache status: ${edgeCacheStatus || '<missing>'}`)
      }
      if (!firstCacheStatus) firstCacheStatus = edgeCacheStatus
      last = {
        url,
        status: response.status,
        contentType: response.headers.get('content-type') ?? '',
        firstCacheStatus,
        finalCacheStatus: edgeCacheStatus,
        attempts: attempt,
        cfCacheStatus: response.headers.get('cf-cache-status'),
        outcome: 'PASS',
      }
      if (edgeCacheStatus === 'HIT') {
        observations.push(last)
        break
      }
      if (attempt < maxAttempts) await wait(delayMs)
    }
    if (!last || (last.outcome !== 'SECURITY_CHALLENGE_SKIP' && last.finalCacheStatus !== 'HIT')) {
      throw new Error(`${url}: no cache HIT observed within ${maxAttempts} attempts`)
    }
  }
  return observations
}

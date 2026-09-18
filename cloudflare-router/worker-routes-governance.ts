import fs from 'node:fs'
import path from 'node:path'
import stripJsonComments from 'strip-json-comments'

export const PRODUCTION_TRAFFIC_LAYER_CONFIG = 'wrangler.production-traffic-layer.jsonc'
export const PRODUCTION_ROUTE_COUNT = 14
export const PRODUCTION_WORKER_NAME = 'visutry-cf-production'
export const PRODUCTION_ZONE_NAME = 'visutry.com'
export const PRODUCTION_HOST_PREFIX = 'www.visutry.com/'
export const PRODUCTION_WORKER_ENTRYPOINT = 'cloudflare-router/app-host-worker.ts'
export const PRODUCTION_ROUTES_API_PATH = '/workers/routes'

export interface ManagedWorkerRoute {
  pattern: string
  zone_name: string
}

export interface ParsedProductionRouteConfig {
  main: string
  workerName: string
  routes: ManagedWorkerRoute[]
}

export interface LiveWorkerRoute {
  id?: string
  pattern: string
  script?: string | null
  script_name?: string | null
}

export interface WorkerRouteDriftReport {
  matches: boolean
  localRouteCount: number
  remoteRouteCount: number
  missingLocally: string[]
  missingRemotely: string[]
  changedTargets: string[]
  duplicateLocalPatterns: string[]
  duplicateRemotePatterns: string[]
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function routeKey(route: ManagedWorkerRoute): string {
  return `${route.zone_name}|${route.pattern}`
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function duplicatePatterns(routes: ManagedWorkerRoute[]): string[] {
  const counts = new Map<string, number>()
  for (const route of routes) counts.set(route.pattern, (counts.get(route.pattern) ?? 0) + 1)
  return sortedUnique([...counts.entries()].filter(([, count]) => count > 1).map(([pattern]) => pattern))
}

function managedRouteFromConfig(value: unknown, index: number): ManagedWorkerRoute {
  if (!isRecord(value) || typeof value.pattern !== 'string' || typeof value.zone_name !== 'string') {
    throw new Error(`production route at index ${index} must contain pattern and zone_name`)
  }
  return { pattern: value.pattern, zone_name: value.zone_name }
}

/** Parse the deployment JSONC using the same comment syntax accepted by Wrangler. */
export function parseProductionTrafficLayerConfig(source: string): ParsedProductionRouteConfig {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonComments(source)) as unknown
  } catch (error) {
    throw new Error(`could not parse ${PRODUCTION_TRAFFIC_LAYER_CONFIG}: ${String(error)}`)
  }

  if (!isRecord(parsed)) throw new Error('production traffic-layer config must be an object')
  const env = isRecord(parsed.env) ? parsed.env : null
  const production = env && isRecord(env.production) ? env.production : null
  if (!production) throw new Error('production traffic-layer config is missing env.production')
  if (typeof parsed.main !== 'string') throw new Error('production traffic-layer config is missing main')
  if (typeof production.name !== 'string') throw new Error('env.production.name must be a string')
  if (!Array.isArray(production.routes)) throw new Error('env.production.routes must be an array')

  return {
    main: parsed.main,
    workerName: production.name,
    routes: production.routes.map(managedRouteFromConfig),
  }
}

export function readProductionTrafficLayerConfig(
  configPath = path.resolve(process.cwd(), PRODUCTION_TRAFFIC_LAYER_CONFIG),
): ParsedProductionRouteConfig {
  return parseProductionTrafficLayerConfig(fs.readFileSync(configPath, 'utf8'))
}

function liveRouteToManagedRoute(route: LiveWorkerRoute): ManagedWorkerRoute {
  return { pattern: route.pattern, zone_name: PRODUCTION_ZONE_NAME }
}

function liveRouteTarget(route: LiveWorkerRoute): string | null {
  if (typeof route.script === 'string') return route.script
  if (typeof route.script_name === 'string') return route.script_name
  return null
}

export function assertSafeProductionRouteConfig(config: ParsedProductionRouteConfig): string[] {
  const errors: string[] = []
  if (config.main !== PRODUCTION_WORKER_ENTRYPOINT) {
    errors.push(`production entrypoint is ${config.main}, expected ${PRODUCTION_WORKER_ENTRYPOINT}`)
  }
  if (config.workerName !== PRODUCTION_WORKER_NAME) {
    errors.push(`production Worker is ${config.workerName}, expected ${PRODUCTION_WORKER_NAME}`)
  }
  if (config.routes.length !== PRODUCTION_ROUTE_COUNT) {
    errors.push(`local route count is ${config.routes.length}, expected ${PRODUCTION_ROUTE_COUNT}`)
  }
  for (const route of config.routes) {
    if (route.zone_name !== PRODUCTION_ZONE_NAME) {
      errors.push(`${route.pattern} uses zone ${route.zone_name}, expected ${PRODUCTION_ZONE_NAME}`)
    }
    if (route.pattern === 'www.visutry.com/*' || route.pattern === 'www.visutry.com/_next/*') {
      errors.push(`${route.pattern} is a forbidden broad production route`)
    }
    if (route.pattern.includes('/_next/')) {
      errors.push(`${route.pattern} would give the Next client graph a second producer`)
    }
    if (route.pattern.endsWith('/html*') || route.pattern === 'www.visutry.com/*') {
      errors.push(`${route.pattern} is not an approved non-Next capability route`)
    }
  }
  for (const pattern of duplicatePatterns(config.routes)) {
    errors.push(`duplicate local route pattern: ${pattern}`)
  }
  return errors
}

export function compareWorkerRoutes(
  localRoutes: ManagedWorkerRoute[],
  remoteRoutes: LiveWorkerRoute[],
  expectedWorkerName: string,
): WorkerRouteDriftReport {
  const local = localRoutes.map((route) => ({ route, key: routeKey(route) }))
  const remote = remoteRoutes.map((route) => ({ route: liveRouteToManagedRoute(route), source: route }))
  const localKeys = new Set(local.map(({ key }) => key))
  const remoteKeys = new Set(remote.map(({ route }) => routeKey(route)))

  const missingLocally = sortedUnique(remote.filter(({ route }) => !localKeys.has(routeKey(route))).map(({ route }) => routeKey(route)))
  const missingRemotely = sortedUnique(local.filter(({ key }) => !remoteKeys.has(key)).map(({ key }) => key))
  const changedTargets = sortedUnique(
    remote
      .filter(({ route }) => localKeys.has(routeKey(route)))
      .filter(({ source }) => liveRouteTarget(source) !== expectedWorkerName)
      .map(({ route, source }) => `${routeKey(route)} -> ${liveRouteTarget(source) ?? 'unassigned'}`),
  )

  return {
    matches: missingLocally.length === 0
      && missingRemotely.length === 0
      && changedTargets.length === 0
      && duplicatePatterns(localRoutes).length === 0
      && duplicatePatterns(remote.map(({ route }) => route)).length === 0,
    localRouteCount: localRoutes.length,
    remoteRouteCount: remoteRoutes.length,
    missingLocally,
    missingRemotely,
    changedTargets,
    duplicateLocalPatterns: duplicatePatterns(localRoutes),
    duplicateRemotePatterns: duplicatePatterns(remote.map(({ route }) => route)),
  }
}

export async function fetchLiveWorkerRoutes(
  zoneId: string,
  apiToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LiveWorkerRoute[]> {
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}${PRODUCTION_ROUTES_API_PATH}`, {
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
  })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`Cloudflare Worker Routes API returned non-JSON HTTP ${response.status}`)
  }
  if (!response.ok) throw new Error(`Cloudflare Worker Routes API failed with HTTP ${response.status}`)
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.result)) {
    throw new Error('Cloudflare Worker Routes API returned an invalid result')
  }
  const routes = payload.result
  if (!routes.every((route) => isRecord(route) && typeof route.pattern === 'string')) {
    throw new Error('Cloudflare Worker Routes API returned a route without a pattern')
  }
  return routes as unknown as LiveWorkerRoute[]
}

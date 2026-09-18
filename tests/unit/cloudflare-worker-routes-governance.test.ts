/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'
import {
  assertSafeProductionRouteConfig,
  compareWorkerRoutes,
  fetchLiveWorkerRoutes,
  parseProductionTrafficLayerConfig,
  PRODUCTION_ROUTE_COUNT,
  PRODUCTION_HOST_PREFIX,
  PRODUCTION_WORKER_ENTRYPOINT,
  PRODUCTION_WORKER_NAME,
  PRODUCTION_ZONE_NAME,
  type LiveWorkerRoute,
} from '../../cloudflare-router/worker-routes-governance'
import { proposedWranglerProductionRoutes } from '../../cloudflare-router/b4-production-routes'

const ROOT = path.join(__dirname, '../..')
const configSource = fs.readFileSync(path.join(ROOT, 'wrangler.production-traffic-layer.jsonc'), 'utf8')

describe('Cloudflare production Worker Routes ownership', () => {
  const config = parseProductionTrafficLayerConfig(configSource)

  it('declares exactly the current 14-route production contract', () => {
    expect(config.main).toBe(PRODUCTION_WORKER_ENTRYPOINT)
    expect(config.workerName).toBe(PRODUCTION_WORKER_NAME)
    expect(config.routes).toHaveLength(PRODUCTION_ROUTE_COUNT)
    expect(new Set(config.routes.map((route) => route.pattern)).size).toBe(PRODUCTION_ROUTE_COUNT)
    expect(config.routes.every((route) => route.zone_name === PRODUCTION_ZONE_NAME)).toBe(true)
    expect(config.routes.map((route) => route.pattern).sort()).toEqual(
      proposedWranglerProductionRoutes('P0').map((route) => route.pattern).sort(),
    )
  })

  it('rejects broad routes, Next client assets, and duplicate patterns', () => {
    const unsafe = {
      ...config,
      routes: [
        ...config.routes,
        { pattern: 'www.visutry.com/*', zone_name: PRODUCTION_ZONE_NAME },
        { pattern: 'www.visutry.com/_next/static/*', zone_name: PRODUCTION_ZONE_NAME },
        config.routes[0],
      ],
    }
    const errors = assertSafeProductionRouteConfig(unsafe)
    expect(errors.some((error) => error.includes('broad production route'))).toBe(true)
    expect(errors.some((error) => error.includes('Next client graph'))).toBe(true)
    expect(errors.some((error) => error.includes('duplicate local route pattern'))).toBe(true)
  })

  it('normalizes route ordering and verifies every remote route targets production Worker', () => {
    const remote: LiveWorkerRoute[] = config.routes
      .slice()
      .reverse()
      .map((route, index) => ({ id: `route-${index}`, ...route, script: PRODUCTION_WORKER_NAME }))
    expect(compareWorkerRoutes(config.routes, remote, PRODUCTION_WORKER_NAME)).toMatchObject({
      matches: true,
      localRouteCount: 14,
      remoteRouteCount: 14,
      missingLocally: [],
      missingRemotely: [],
      changedTargets: [],
    })
  })

  it('fails closed for a missing, extra, or retargeted live route', () => {
    const remote: LiveWorkerRoute[] = config.routes
      .slice(0, -1)
      .map((route) => ({ ...route, script: PRODUCTION_WORKER_NAME }))
    remote.push({ pattern: 'www.visutry.com/unreviewed/*', script: PRODUCTION_WORKER_NAME })
    remote[0] = { ...remote[0], script: 'another-worker' }
    const report = compareWorkerRoutes(config.routes, remote, PRODUCTION_WORKER_NAME)
    expect(report.matches).toBe(false)
    expect(report.missingLocally).toContain(`${PRODUCTION_ZONE_NAME}|www.visutry.com/unreviewed/*`)
    expect(report.missingRemotely).toContain(`${PRODUCTION_ZONE_NAME}|${config.routes[config.routes.length - 1].pattern}`)
    expect(report.changedTargets).toContain(`${PRODUCTION_ZONE_NAME}|${config.routes[0].pattern} -> another-worker`)
  })

  it('does not treat a missing script target as a production match', () => {
    const remote: LiveWorkerRoute[] = config.routes.map((route) => ({ ...route, script: PRODUCTION_WORKER_NAME }))
    remote[0] = { ...remote[0], script: null }
    const report = compareWorkerRoutes(config.routes, remote, PRODUCTION_WORKER_NAME)
    expect(report.matches).toBe(false)
    expect(report.changedTargets[0]).toContain('unassigned')
  })

  it('fails closed when the live host route set contains a duplicate pattern', () => {
    const remote: LiveWorkerRoute[] = config.routes.map((route) => ({ ...route, script: PRODUCTION_WORKER_NAME }))
    remote.push({ pattern: `${PRODUCTION_HOST_PREFIX}duplicate`, script: PRODUCTION_WORKER_NAME })
    remote.push({ pattern: `${PRODUCTION_HOST_PREFIX}duplicate`, script: PRODUCTION_WORKER_NAME })
    const report = compareWorkerRoutes(config.routes, remote, PRODUCTION_WORKER_NAME)
    expect(report.matches).toBe(false)
    expect(report.duplicateRemotePatterns).toEqual([`${PRODUCTION_HOST_PREFIX}duplicate`])
  })

  it('reads the zone-scoped Worker Routes API as a read-only route inventory', async () => {
    const fakeFetch: typeof fetch = async (input, init) => {
      expect(String(input)).toBe('https://api.cloudflare.com/client/v4/zones/zone-123/workers/routes')
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
      return new Response(JSON.stringify({
        success: true,
        result: [{ pattern: config.routes[0].pattern, script: PRODUCTION_WORKER_NAME }],
      }), { status: 200 })
    }
    await expect(fetchLiveWorkerRoutes('zone-123', 'test-token', fakeFetch)).resolves.toEqual([
      { pattern: config.routes[0].pattern, script: PRODUCTION_WORKER_NAME },
    ])
  })
})

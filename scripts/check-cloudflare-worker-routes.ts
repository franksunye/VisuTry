import path from 'node:path'
import {
  assertSafeProductionRouteConfig,
  compareWorkerRoutes,
  fetchLiveWorkerRoutes,
  PRODUCTION_HOST_PREFIX,
  readProductionTrafficLayerConfig,
} from '../cloudflare-router/worker-routes-governance'

async function main() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) {
    throw new Error('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required; no route check was performed')
  }

  const config = readProductionTrafficLayerConfig(path.resolve(process.cwd(), 'wrangler.production-traffic-layer.jsonc'))
  const localErrors = assertSafeProductionRouteConfig(config)
  if (localErrors.length > 0) throw new Error(`unsafe local production route config: ${localErrors.join('; ')}`)

  const remoteRoutes = (await fetchLiveWorkerRoutes(zoneId, apiToken))
    .filter((route) => route.pattern.startsWith(PRODUCTION_HOST_PREFIX))
  const report = compareWorkerRoutes(config.routes, remoteRoutes, config.workerName)
  console.log(JSON.stringify({
    event: 'cloudflare_worker_routes_drift_check',
    productionMutation: false,
    config: 'wrangler.production-traffic-layer.jsonc',
    entrypoint: config.main,
    worker: config.workerName,
    ...report,
  }, null, 2))

  if (!report.matches) {
    throw new Error('Cloudflare production Worker Routes drift detected; deployment is not approved')
  }
  console.log('PASS: local and remote production Worker Routes are identical')
}

main().catch((error: unknown) => {
  console.error(`Cloudflare Worker Routes governance: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})

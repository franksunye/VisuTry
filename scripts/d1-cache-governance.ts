import {
  D1_CACHE_RULE_EDGE_TTL_SECONDS,
  D1_CACHE_RULE_EXPRESSION,
  D1_CACHE_RULE_NAME,
  d1CachePurgePlan,
} from '../cloudflare-router/d1-cache-governance'

const args = new Set(process.argv.slice(2))

function fail(message: string): never {
  console.error(`D1 cache governance: ${message}`)
  process.exit(1)
}

function printPlan() {
  const plan = d1CachePurgePlan()
  console.log(JSON.stringify({
    event: 'd1_cache_governance_plan',
    rule: D1_CACHE_RULE_NAME,
    edgeTtlSeconds: D1_CACHE_RULE_EDGE_TTL_SECONDS,
    purge: plan,
    productionMutation: false,
  }, null, 2))
  console.log('\nPROPOSED CLOUDFLARE CACHE RULE EXPRESSION:\n')
  console.log(D1_CACHE_RULE_EXPRESSION)
}

async function purgeAfterPromotion() {
  if (process.env.D1_CACHE_PURGE_APPROVED !== '1') {
    fail('refusing purge: set D1_CACHE_PURGE_APPROVED=1 only after Vercel production promotion is proven')
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const deploymentSha = process.env.VERCEL_PRODUCTION_SHA
  const deploymentId = process.env.VERCEL_PRODUCTION_DEPLOYMENT_ID

  if (!zoneId || !apiToken) fail('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required')
  if (!deploymentSha || !deploymentId) {
    fail('VERCEL_PRODUCTION_SHA and VERCEL_PRODUCTION_DEPLOYMENT_ID are required promotion evidence')
  }

  const plan = d1CachePurgePlan()
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: plan.files, prefixes: plan.prefixes }),
  })
  const payload = await response.json() as { success?: boolean; result?: { id?: string }; errors?: unknown[] }

  const evidence = {
    event: 'd1_cache_purge',
    timestamp: new Date().toISOString(),
    mechanism: 'Cloudflare zone purge_cache with exact files and trailing-slash prefixes',
    rule: D1_CACHE_RULE_NAME,
    scopeCount: plan.count,
    deploymentSha,
    deploymentId,
    httpStatus: response.status,
    cloudflareRequestId: payload.result?.id ?? null,
    success: response.ok && payload.success === true,
  }
  console.log(JSON.stringify(evidence))

  if (!response.ok || payload.success !== true) fail('Cloudflare prefix purge failed; D1 cache state is not assumed coherent')
}

async function main() {
  if (args.has('--purge')) {
    await purgeAfterPromotion()
  } else {
    printPlan()
  }
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error))
})

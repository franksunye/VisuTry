import {
  D1_CACHE_RULE_API_RULE,
  D1_CACHE_RULE_EDGE_TTL_SECONDS,
  D1_CACHE_RULE_EXPRESSION,
  D1_CACHE_RULE_ID,
  D1_CACHE_RULE_NAME,
  D1_CLOUDFLARE_CACHE_RULE_ENTRYPOINT_PATH,
  D1_EXPECTED_RULE_ORDER,
  compareD1LiveRule,
  d1CachePurgePlan,
  d1CachePurgeRequestBody,
  extractD1LiveRuleFromEntrypoint,
  isCloudflarePurgeSuccessful,
} from '../cloudflare-router/d1-cache-governance'
import {
  fetchVercelProductionDeploymentProof,
  readVercelVerificationConfig,
} from '../cloudflare-router/vercel-production-proof'

const args = new Set(process.argv.slice(2))

function fail(message: string): never {
  console.error(`D1 cache governance: ${message}`)
  process.exit(1)
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    fail(`unexpected non-JSON response from ${response.url}`)
  }
}

function printPlan() {
  const plan = d1CachePurgePlan()
  console.log(JSON.stringify({
    event: 'd1_cache_governance_plan',
    rule: D1_CACHE_RULE_NAME,
    edgeTtlSeconds: D1_CACHE_RULE_EDGE_TTL_SECONDS,
    apiRule: D1_CACHE_RULE_API_RULE,
    purge: plan,
    productionMutation: false,
  }, null, 2))
  console.log('\nPROPOSED CLOUDFLARE CACHE RULE EXPRESSION:\n')
  console.log(D1_CACHE_RULE_EXPRESSION)
}

function cloudflareHeaders(apiToken: string) {
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }
}

async function verifyVercelProduction() {
  const config = readVercelVerificationConfig(process.env)
  const proof = await fetchVercelProductionDeploymentProof(config)
  console.log(JSON.stringify({
    event: 'vercel_production_deployment_verification',
    productionMutation: false,
    deploymentId: config.deploymentId,
    projectId: proof.projectId,
    teamId: proof.teamId,
    target: proof.target,
    readyState: proof.readyState,
    gitSha: proof.gitSha,
    expectedGitSha: config.expectedGitSha,
    productionAlias: config.productionAlias,
    aliasPresent: proof.aliases.includes(config.productionAlias),
    verified: true,
  }))
}

async function purgeAfterPromotion() {
  if (process.env.D1_CACHE_PURGE_APPROVED !== '1') {
    fail('refusing purge: set D1_CACHE_PURGE_APPROVED=1 only after Vercel verification passes')
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) fail('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required')

  // This verification is repeated immediately before the purge. Repository
  // dispatch payloads are inputs, not trusted promotion proof.
  const vercelConfig = readVercelVerificationConfig(process.env)
  await fetchVercelProductionDeploymentProof(vercelConfig)

  const plan = d1CachePurgePlan()
  const requestBody = d1CachePurgeRequestBody()
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: cloudflareHeaders(apiToken),
    body: JSON.stringify(requestBody),
  })
  const payload = await readJson(response) as { success?: boolean; result?: { id?: string } }
  const successful = isCloudflarePurgeSuccessful(response.status, payload)

  console.log(JSON.stringify({
    event: 'd1_cache_purge',
    timestamp: new Date().toISOString(),
    purgeType: plan.purgeType,
    prefixCount: plan.prefixCount,
    rule: D1_CACHE_RULE_NAME,
    httpStatus: response.status,
    cloudflareRequestId: payload.result?.id ?? null,
    success: successful,
  }))

  if (!successful) fail('Cloudflare prefix purge failed; D1 cache state is not assumed coherent')
}

async function checkLiveRule() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) fail('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required for --check-live')

  const entrypointPath = D1_CLOUDFLARE_CACHE_RULE_ENTRYPOINT_PATH.replace('{zone_id}', zoneId)
  const response = await fetch(`https://api.cloudflare.com/client/v4${entrypointPath}`, {
    headers: cloudflareHeaders(apiToken),
  })
  if (!response.ok) fail(`Cloudflare ruleset lookup failed with HTTP ${response.status}`)
  const payload = await readJson(response)
  const liveRule = extractD1LiveRuleFromEntrypoint(payload)

  const report = compareD1LiveRule(liveRule)
  console.log(JSON.stringify({
    event: 'd1_cache_rule_drift_check',
    productionMutation: false,
    ruleId: D1_CACHE_RULE_ID,
    expectedOrder: D1_EXPECTED_RULE_ORDER,
    ...report,
  }, null, 2))
  if (!report.matches) fail(`D1 live rule drift detected: ${report.mismatches.join(', ')}`)
}

async function main() {
  const modes = ['--purge', '--check-live', '--verify-vercel'].filter((mode) => args.has(mode))
  if (modes.length > 1) fail(`choose one mode: ${modes.join(', ')}`)
  if (args.has('--purge')) return purgeAfterPromotion()
  if (args.has('--check-live')) return checkLiveRule()
  if (args.has('--verify-vercel')) return verifyVercelProduction()
  printPlan()
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error))
})

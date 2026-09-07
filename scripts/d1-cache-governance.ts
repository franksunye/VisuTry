import {
  D1_CACHE_RULE_API_RULE,
  D1_CACHE_RULE_EDGE_TTL_SECONDS,
  D1_CACHE_RULE_EXPRESSION,
  D1_CACHE_RULE_ID,
  D1_CACHE_RULE_NAME,
  D1_CLOUDFLARE_CACHE_RULE_ENTRYPOINT_PATH,
  D1_EXPECTED_RULE_ORDER,
  D1VercelDeploymentProof,
  D1VercelVerificationConfig,
  compareD1LiveRule,
  d1CachePurgePlan,
  d1CachePurgeRequestBody,
  extractD1LiveRuleFromEntrypoint,
  isCloudflarePurgeSuccessful,
  isVercelProductionDeploymentProofValid,
  readVercelVerificationConfig,
} from '../cloudflare-router/d1-cache-governance'

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

function normalizeAliases(payload: unknown): string[] {
  const values = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && 'aliases' in payload && Array.isArray(payload.aliases))
      ? payload.aliases
      : []
  return values.flatMap((value) => {
    if (typeof value === 'string') return [value]
    if (value && typeof value === 'object' && 'alias' in value && typeof value.alias === 'string') {
      return [value.alias]
    }
    return []
  })
}

function deploymentProofFromApi(deployment: Record<string, unknown>, aliases: string[]): D1VercelDeploymentProof {
  const meta = deployment.meta && typeof deployment.meta === 'object'
    ? deployment.meta as Record<string, unknown>
    : {}
  const gitSource = deployment.gitSource && typeof deployment.gitSource === 'object'
    ? deployment.gitSource as Record<string, unknown>
    : {}
  return {
    id: typeof deployment.id === 'string' ? deployment.id : '',
    projectId: typeof deployment.projectId === 'string' ? deployment.projectId : '',
    teamId: typeof deployment.teamId === 'string' ? deployment.teamId : '',
    target: typeof deployment.target === 'string' ? deployment.target : null,
    readyState: typeof deployment.readyState === 'string' ? deployment.readyState : null,
    gitSha: typeof meta.githubCommitSha === 'string'
      ? meta.githubCommitSha
      : typeof gitSource.sha === 'string' ? gitSource.sha : null,
    aliases,
  }
}

async function fetchVercelProductionDeploymentProof(config: D1VercelVerificationConfig) {
  const teamQuery = `?teamId=${encodeURIComponent(config.teamId)}`
  const headers = { Authorization: `Bearer ${config.apiToken}` }
  const deploymentResponse = await fetch(
    `https://api.vercel.com/v13/deployments/${encodeURIComponent(config.deploymentId)}${teamQuery}`,
    { headers },
  )
  if (!deploymentResponse.ok) fail(`Vercel deployment lookup failed with HTTP ${deploymentResponse.status}`)
  const deploymentPayload = await readJson(deploymentResponse)
  if (!deploymentPayload || typeof deploymentPayload !== 'object') fail('Vercel deployment response was not an object')

  const aliasesResponse = await fetch(
    `https://api.vercel.com/v2/deployments/${encodeURIComponent(config.deploymentId)}/aliases${teamQuery}`,
    { headers },
  )
  if (!aliasesResponse.ok) fail(`Vercel deployment alias lookup failed with HTTP ${aliasesResponse.status}`)
  const aliasesPayload = await readJson(aliasesResponse)
  const aliases = normalizeAliases(aliasesPayload)
  const proof = deploymentProofFromApi(deploymentPayload as Record<string, unknown>, aliases)
  const valid = isVercelProductionDeploymentProofValid(proof, config)

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
    verified: valid,
  }))

  if (!valid) fail('Vercel deployment proof did not establish the expected production deployment')
  return proof
}

async function verifyVercelProduction() {
  const config = readVercelVerificationConfig(process.env)
  await fetchVercelProductionDeploymentProof(config)
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

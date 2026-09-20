import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  fetchVercelProductionDeploymentProof,
  readVercelVerificationConfig,
} from '../cloudflare-router/vercel-production-proof'
import {
  classifyCloudflareDeployment,
  publicHtmlReleasePurgeRequestBody,
  releaseContractErrors,
  validateCurrentMainSha,
  warmAndVerifyPublicHtml,
  type PublicHtmlReleaseMode,
} from '../cloudflare-router/public-html-release'
import { PUBLIC_HTML_OFFLOAD_PURGE_URLS } from '../cloudflare-router/public-html-offload'
import {
  compareWorkerRoutes,
  fetchLiveWorkerRoutes,
  readProductionTrafficLayerConfig,
} from '../cloudflare-router/worker-routes-governance'

const ROOT = process.cwd()
const CONFIG_PATH = path.join(ROOT, 'wrangler.production-traffic-layer.jsonc')

function fail(message: string): never {
  console.error(`Public HTML release: ${message}`)
  process.exit(1)
}

function targetSha(): string {
  const value = process.env.RELEASE_GIT_SHA ?? process.env.VERCEL_PRODUCTION_SHA ?? ''
  if (!/^[0-9a-f]{40}$/i.test(value)) fail('RELEASE_GIT_SHA must be a full 40-character Git SHA')
  return value
}

function runGit(command: string, args: string[]): string {
  return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function git(command: string, args: string[]): string {
  try {
    return runGit(command, args)
  } catch (error) {
    fail(`could not run ${command} ${args.join(' ')}: ${String(error)}`)
  }
}

export function changedFilesForTarget(target: string): string[] {
  try {
    const parent = runGit('git', ['rev-parse', `${target}^1`])
    return runGit('git', ['diff', '--name-only', parent, target])
      .split('\n')
      .map((file) => file.trim())
      .filter(Boolean)
  } catch {
    return runGit('git', ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', target])
      .split('\n')
      .map((file) => file.trim())
      .filter(Boolean)
  }
}

function verifyMainSha() {
  const target = targetSha()
  const currentMain = git('git', ['rev-parse', 'refs/remotes/origin/main'])
  try {
    runGit('git', ['cat-file', '-e', `${target}^{commit}`])
    runGit('git', ['merge-base', '--is-ancestor', target, 'refs/remotes/origin/main'])
    validateCurrentMainSha(target, currentMain)
  } catch (error) {
    fail(`release SHA is not the verified current main commit: ${String(error)}`)
  }
  console.log(JSON.stringify({
    event: 'public_html_release_main_sha_verified',
    productionMutation: false,
    releaseSha: target,
    originMainSha: currentMain,
  }))
  return target
}

function mode(): PublicHtmlReleaseMode {
  const raw = process.env.CLOUDFLARE_DEPLOY_MODE ?? 'auto'
  if (raw !== 'auto' && raw !== 'force') {
    fail(`CLOUDFLARE_DEPLOY_MODE must be auto or force; received ${raw}`)
  }
  return raw
}

function loadPlan() {
  const target = targetSha()
  const changedFiles = changedFilesForTarget(target)
  const decision = classifyCloudflareDeployment(changedFiles, mode())
  const config = readProductionTrafficLayerConfig(CONFIG_PATH)
  const contractErrors = releaseContractErrors(config)
  return { target, changedFiles, decision, config, contractErrors }
}

function printPlan() {
  const plan = loadPlan()
  const deploymentId = process.env.VERCEL_PRODUCTION_DEPLOYMENT_ID ?? null
  const expectedAlias = process.env.VERCEL_PRODUCTION_ALIAS ?? 'www.visutry.com'
  console.log(JSON.stringify({
    event: 'public_html_release_plan',
    productionMutation: false,
    releaseSha: plan.target,
    vercelDeploymentId: deploymentId,
    expectedProductionAlias: expectedAlias,
    publicHtmlUrls: PUBLIC_HTML_OFFLOAD_PURGE_URLS,
    cloudflareDeployRequired: plan.decision.deployRequired,
    cloudflareDeployMode: plan.decision.mode,
    cloudflareDecisionReasons: plan.decision.reasons,
    matchingChangedFiles: plan.decision.matchingFiles,
    changedFiles: plan.changedFiles,
    expectedWorkerRouteCount: plan.config.routes.length,
    intendedActions: [
      'independently verify Vercel Production deployment',
      ...(plan.decision.deployRequired ? ['deploy the Cloudflare production traffic layer'] : []),
      'verify the production Worker Route contract',
      'purge the exact seven Public HTML URLs',
      'warm each URL and require an eventual x-visutry-edge-cache HIT',
      'run the existing Production Smoke checks',
    ],
    contractErrors: plan.contractErrors,
  }, null, 2))
  if (plan.contractErrors.length > 0) fail(`local production contract is unsafe: ${plan.contractErrors.join('; ')}`)
}

async function verifyVercel() {
  verifyMainSha()
  const config = readVercelVerificationConfig(process.env)
  const proof = await fetchVercelProductionDeploymentProof(config)
  console.log(JSON.stringify({
    event: 'public_html_release_vercel_verified',
    productionMutation: false,
    deploymentId: proof.id,
    projectId: proof.projectId,
    teamId: proof.teamId,
    target: proof.target,
    readyState: proof.readyState,
    gitSha: proof.gitSha,
    productionAlias: config.productionAlias,
    aliasPresent: proof.aliases.includes(config.productionAlias),
    verified: true,
  }))
}

function detectCloudflareDeploy() {
  const plan = loadPlan()
  console.log(JSON.stringify({
    event: 'public_html_release_cloudflare_decision',
    productionMutation: false,
    releaseSha: plan.target,
    deployRequired: plan.decision.deployRequired,
    mode: plan.decision.mode,
    matchingFiles: plan.decision.matchingFiles,
    reasons: plan.decision.reasons,
    changedFiles: plan.changedFiles,
  }))
  if (plan.contractErrors.length > 0) fail(`local production contract is unsafe: ${plan.contractErrors.join('; ')}`)
}

async function verifyRoutes() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) fail('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required for route verification')
  const config = readProductionTrafficLayerConfig(CONFIG_PATH)
  const contractErrors = releaseContractErrors(config)
  if (contractErrors.length > 0) fail(`local production contract is unsafe: ${contractErrors.join('; ')}`)
  const remote = await fetchLiveWorkerRoutes(zoneId, apiToken)
  const report = compareWorkerRoutes(config.routes, remote, config.workerName)
  console.log(JSON.stringify({
    event: 'public_html_release_worker_routes_verified',
    productionMutation: false,
    expectedWorker: config.workerName,
    expectedRouteCount: config.routes.length,
    actualRouteCount: remote.length,
    drift: report,
    verified: report.matches,
  }, null, 2))
  if (!report.matches) fail('Cloudflare production Worker Route contract drift detected')
}

async function purge() {
  if (process.env.PUBLIC_HTML_RELEASE_PURGE_APPROVED !== '1') {
    fail('refusing purge: set PUBLIC_HTML_RELEASE_PURGE_APPROVED=1 only after Vercel verification passes')
  }
  verifyMainSha()
  const vercelConfig = readVercelVerificationConfig(process.env)
  await fetchVercelProductionDeploymentProof(vercelConfig)
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) fail('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are required for purge')

  const body = publicHtmlReleasePurgeRequestBody()
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let payload: { success?: boolean; result?: { id?: string } }
  try {
    payload = await response.json() as { success?: boolean; result?: { id?: string } }
  } catch {
    fail(`Cloudflare purge returned non-JSON HTTP ${response.status}`)
  }
  const success = response.status >= 200 && response.status < 300 && payload.success === true
  console.log(JSON.stringify({
    event: 'public_html_release_exact_url_purge',
    timestamp: new Date().toISOString(),
    productionMutation: true,
    purgeType: 'files',
    urlCount: body.files.length,
    paths: body.files.map((url) => new URL(url).pathname),
    cloudflareRequestId: payload.result?.id ?? null,
    httpStatus: response.status,
    success,
  }))
  if (!success) fail('Cloudflare exact URL purge failed')
}

async function warm() {
  const allowCloudflareChallenge = process.env.PUBLIC_HTML_RELEASE_ALLOW_SECURITY_CHALLENGE === '1'
  const observations = await warmAndVerifyPublicHtml(PUBLIC_HTML_OFFLOAD_PURGE_URLS, fetch, {
    allowCloudflareChallenge,
  })
  const securityExpectedSkips = observations.filter((observation) => observation.outcome === 'SECURITY_EXPECTED_SKIP')
  console.log(JSON.stringify({
    event: 'public_html_release_cache_verified',
    productionMutation: true,
    urlCount: observations.length,
    githubRunnerProbe: securityExpectedSkips.length > 0 ? 'SECURITY_EXPECTED_SKIP' : 'PASS',
    authoritative: securityExpectedSkips.length === 0,
    trustedLocalHitEvidenceRequired: securityExpectedSkips.length > 0,
    securityExpectedSkipCount: securityExpectedSkips.length,
    observations,
  }, null, 2))
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const modes = ['--plan', '--verify-main', '--verify-vercel', '--detect-cloudflare-deploy', '--verify-routes', '--purge', '--warm']
    .filter((candidate) => args.has(candidate))
  if (modes.length > 1) fail(`choose one mode: ${modes.join(', ')}`)
  if (args.has('--plan') || modes.length === 0) return printPlan()
  if (args.has('--verify-main')) return verifyMainSha()
  if (args.has('--verify-vercel')) return verifyVercel()
  if (args.has('--detect-cloudflare-deploy')) return detectCloudflareDeploy()
  if (args.has('--verify-routes')) return verifyRoutes()
  if (args.has('--purge')) return purge()
  return warm()
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)))

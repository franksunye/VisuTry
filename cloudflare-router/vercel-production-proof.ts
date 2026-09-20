/**
 * Shared, side-effect-free Vercel Production proof contract.
 *
 * Inputs supplied by a workflow dispatch or webhook are lookup values only.
 * Callers must use fetchVercelProductionDeploymentProof() to independently
 * read the deployment and alias records before opening any production gate.
 */

export interface VercelVerificationConfig {
  apiToken: string
  projectId: string
  teamId: string
  deploymentId: string
  expectedGitSha: string
  productionAlias: string
}

export interface VercelDeploymentProof {
  id: string
  projectId: string
  teamId: string
  originUrl: string
  target: string | null
  readyState: string | null
  gitSha: string | null
  aliases: readonly string[]
}

/** Accept only the deployment hostname returned by Vercel as a direct origin. */
export function normalizeVercelDeploymentOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const url = new URL(value.startsWith('https://') ? value : `https://${value}`)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')) return null
    if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return null
    return url.origin
  } catch {
    return null
  }
}

export function readVercelVerificationConfig(
  env: Record<string, string | undefined>,
): VercelVerificationConfig {
  const values = {
    apiToken: env.VERCEL_API_TOKEN,
    projectId: env.VERCEL_PROJECT_ID,
    teamId: env.VERCEL_TEAM_ID,
    deploymentId: env.VERCEL_PRODUCTION_DEPLOYMENT_ID,
    expectedGitSha: env.VERCEL_PRODUCTION_SHA,
    productionAlias: env.VERCEL_PRODUCTION_ALIAS ?? 'www.visutry.com',
  }
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`missing Vercel verification configuration: ${missing.join(', ')}`)
  }
  return values as VercelVerificationConfig
}

export function isVercelProductionDeploymentProofValid(
  proof: VercelDeploymentProof,
  config: Pick<VercelVerificationConfig, 'projectId' | 'teamId' | 'deploymentId' | 'expectedGitSha' | 'productionAlias'>,
): boolean {
  return proof.id === config.deploymentId
    && proof.projectId === config.projectId
    && proof.teamId === config.teamId
    && proof.originUrl !== ''
    && proof.target === 'production'
    && proof.readyState === 'READY'
    && proof.gitSha === config.expectedGitSha
    && proof.aliases.includes(config.productionAlias)
}

export function normalizeVercelAliases(payload: unknown): string[] {
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

export function deploymentProofFromApi(
  deployment: Record<string, unknown>,
  aliases: string[],
): VercelDeploymentProof {
  const meta = deployment.meta && typeof deployment.meta === 'object'
    ? deployment.meta as Record<string, unknown>
    : {}
  const gitSource = deployment.gitSource && typeof deployment.gitSource === 'object'
    ? deployment.gitSource as Record<string, unknown>
    : {}
  return {
    id: typeof deployment.id === 'string' ? deployment.id : '',
    projectId: typeof deployment.projectId === 'string' ? deployment.projectId : '',
    teamId: typeof deployment.teamId === 'string'
      ? deployment.teamId
      : typeof deployment.ownerId === 'string' ? deployment.ownerId : '',
    originUrl: normalizeVercelDeploymentOrigin(deployment.url) ?? '',
    target: typeof deployment.target === 'string' ? deployment.target : null,
    readyState: typeof deployment.readyState === 'string' ? deployment.readyState : null,
    gitSha: typeof meta.githubCommitSha === 'string'
      ? meta.githubCommitSha
      : typeof gitSource.sha === 'string' ? gitSource.sha : null,
    aliases,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new Error(`Vercel API returned non-JSON HTTP ${response.status}`)
  }
}

/** Independently fetches the deployment and production alias proof from Vercel. */
export async function fetchVercelProductionDeploymentProof(
  config: VercelVerificationConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<VercelDeploymentProof> {
  const teamQuery = `?teamId=${encodeURIComponent(config.teamId)}`
  const headers = { Authorization: `Bearer ${config.apiToken}` }
  const deploymentResponse = await fetchImpl(
    `https://api.vercel.com/v13/deployments/${encodeURIComponent(config.deploymentId)}${teamQuery}`,
    { headers },
  )
  if (!deploymentResponse.ok) {
    throw new Error(`Vercel deployment lookup failed with HTTP ${deploymentResponse.status}`)
  }
  const deploymentPayload = await readJson(deploymentResponse)
  if (!deploymentPayload || typeof deploymentPayload !== 'object') {
    throw new Error('Vercel deployment response was not an object')
  }

  const aliasesResponse = await fetchImpl(
    `https://api.vercel.com/v2/deployments/${encodeURIComponent(config.deploymentId)}/aliases${teamQuery}`,
    { headers },
  )
  if (!aliasesResponse.ok) {
    throw new Error(`Vercel deployment alias lookup failed with HTTP ${aliasesResponse.status}`)
  }
  const aliases = normalizeVercelAliases(await readJson(aliasesResponse))
  const proof = deploymentProofFromApi(deploymentPayload as Record<string, unknown>, aliases)
  if (!isVercelProductionDeploymentProofValid(proof, config)) {
    throw new Error('Vercel deployment proof did not establish the expected production deployment')
  }
  return proof
}

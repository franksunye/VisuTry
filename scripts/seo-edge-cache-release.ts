import {
  fetchVercelProductionDeploymentProof,
  readVercelVerificationConfig,
} from '../cloudflare-router/vercel-production-proof'
import {
  SEO_EDGE_CACHE_TARGETS,
  seoEdgeExactPurgeBody,
  validateSeoEdgeOriginDocument,
} from '../cloudflare-router/seo-edge-cache-release'

async function verifyProductionOrigin(): Promise<void> {
  const config = readVercelVerificationConfig(process.env)
  const proof = await fetchVercelProductionDeploymentProof(config)
  for (const target of SEO_EDGE_CACHE_TARGETS) {
    const response = await fetch(`${proof.originUrl}${target.path}`, {
      redirect: 'manual',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'VisuTry-SEO-Edge-Release/1.0',
      },
    })
    const html = await response.text()
    const errors = validateSeoEdgeOriginDocument(target, response, html)
    if (errors.length > 0) {
      throw new Error(`origin ${target.path} failed: ${errors.join('; ')}`)
    }
    console.log(JSON.stringify({
      event: 'seo_edge_origin_verified',
      deploymentId: proof.id,
      gitSha: proof.gitSha,
      path: target.path,
      status: response.status,
      title: target.title,
    }))
  }
}

async function exactPurge(): Promise<void> {
  if (process.env.SEO_EDGE_PURGE_APPROVED !== '1') {
    throw new Error('SEO_EDGE_PURGE_APPROVED gate is closed')
  }
  // Recheck origin and deployment alias immediately before production mutation.
  await verifyProductionOrigin()
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!zoneId || !apiToken) throw new Error('Cloudflare zone ID and scoped API token are required')
  const body = seoEdgeExactPurgeBody()
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  let result: { success?: boolean; result?: { id?: string } }
  try {
    result = await response.json() as { success?: boolean; result?: { id?: string } }
  } catch {
    throw new Error(`Cloudflare returned non-JSON HTTP ${response.status}`)
  }
  const success = response.ok && result.success === true
  console.log(JSON.stringify({
    event: 'seo_edge_exact_url_purge',
    success,
    httpStatus: response.status,
    urls: body.files,
    purgeId: result.result?.id ?? null,
  }))
  if (!success) throw new Error('Cloudflare exact URL purge failed')
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? '--plan'
  if (process.argv.length > 3) throw new Error('choose one mode only')
  if (mode === '--plan') {
    console.log(JSON.stringify({
      event: 'seo_edge_purge_plan',
      productionMutation: false,
      action: 'Cloudflare purge by exact files',
      urls: seoEdgeExactPurgeBody().files,
      precondition: 'independently verified READY Vercel production and matching HTML',
    }, null, 2))
    return
  }
  if (mode === '--verify') return verifyProductionOrigin()
  if (mode === '--purge') return exactPurge()
  throw new Error(`unsupported mode ${mode}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

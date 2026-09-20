/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'
import {
  classifyCloudflareDeployment,
  publicHtmlReleasePurgeRequestBody,
  releaseContractErrors,
  validateCurrentMainSha,
  warmAndVerifyPublicHtml,
} from '../../cloudflare-router/public-html-release'
import { PUBLIC_HTML_OFFLOAD_PURGE_URLS } from '../../cloudflare-router/public-html-offload'
import {
  parseProductionTrafficLayerConfig,
  PRODUCTION_ROUTE_COUNT,
} from '../../cloudflare-router/worker-routes-governance'
import {
  fetchVercelProductionDeploymentProof,
  isVercelProductionDeploymentProofValid,
} from '../../cloudflare-router/vercel-production-proof'

const ROOT = path.join(__dirname, '../..')

function htmlResponse(pathname: string, status = 200, edgeCache = 'MISS') {
  return new Response(
    `<html><head><link rel="canonical" href="https://www.visutry.com${pathname}"></head><body>${'x'.repeat(120)}</body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-visutry-edge-cache': edgeCache,
        'cf-cache-status': edgeCache === 'HIT' ? 'HIT' : 'DYNAMIC',
      },
    },
  )
}

describe('Public HTML release control plane', () => {
  it('uses the seven current Public HTML URLs as the only purge source of truth', () => {
    const body = publicHtmlReleasePurgeRequestBody()
    expect(body.files).toEqual(PUBLIC_HTML_OFFLOAD_PURGE_URLS)
    expect(body.files).toHaveLength(7)
    expect(JSON.stringify(body)).not.toContain('purge_everything')
    expect(body.files.every((url) => new URL(url).hostname === 'www.visutry.com')).toBe(true)
  })

  it('keeps the release workflow manual-only and plan mode non-mutating', () => {
    const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/public-html-release.yml'), 'utf8')
    const releaseScript = fs.readFileSync(path.join(ROOT, 'scripts/public-html-release.ts'), 'utf8')
    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).not.toMatch(/^  push:/m)
    expect(workflow).not.toMatch(/^  schedule:/m)
    expect(workflow).not.toContain('repository_dispatch')
    expect(workflow).toContain('permissions:\n  contents: read')
    expect(workflow).toContain('cancel-in-progress: false')

    const planBody = releaseScript.slice(
      releaseScript.indexOf('function printPlan()'),
      releaseScript.indexOf('async function verifyVercel()'),
    )
    expect(planBody).not.toContain('fetch(')
    expect(planBody).not.toContain('PUBLIC_HTML_RELEASE_PURGE_APPROVED')
    expect(releaseScript).toContain("if (args.has('--plan') || modes.length === 0) return printPlan()")
  })

  it('requires a Cloudflare deploy only for artifact-affecting changes', () => {
    expect(classifyCloudflareDeployment(['src/app/[locale]/(public)/page.tsx'])).toMatchObject({
      deployRequired: false,
      matchingFiles: [],
    })
    expect(classifyCloudflareDeployment(['src/modules/merchant/catalog.ts', 'docs/operations/release.md'])).toMatchObject({
      deployRequired: false,
      matchingFiles: [],
    })
    expect(classifyCloudflareDeployment(['cloudflare-router/app-host-worker.ts'])).toMatchObject({
      deployRequired: true,
      matchingFiles: ['cloudflare-router/app-host-worker.ts'],
    })
    expect(classifyCloudflareDeployment(['public/images/logo.svg'])).toMatchObject({
      deployRequired: true,
      matchingFiles: ['public/images/logo.svg'],
    })
    expect(classifyCloudflareDeployment(['wrangler.production-traffic-layer.jsonc'])).toMatchObject({
      deployRequired: true,
    })
  })

  it('fails closed when changed-file comparison is unavailable', () => {
    expect(classifyCloudflareDeployment([], 'auto', false)).toMatchObject({
      deployRequired: true,
      reasons: ['changed-file comparison is unavailable; failing closed'],
    })
  })

  it('requires exact current main equality for a release target', () => {
    const sha = 'a'.repeat(40)
    expect(() => validateCurrentMainSha(sha, sha)).not.toThrow()
    expect(() => validateCurrentMainSha('not-a-sha', sha)).toThrow('full 40-character Git SHA')
    expect(() => validateCurrentMainSha(sha, 'b'.repeat(40))).toThrow('not the current origin/main SHA')
  })

  it('supports only auto and force overrides and rejects skip', () => {
    expect(classifyCloudflareDeployment(['src/app/page.tsx'], 'force')).toMatchObject({
      deployRequired: true,
    })
    expect(() => classifyCloudflareDeployment(['cloudflare-router/app-host-worker.ts'], 'skip' as never))
      .toThrow('unsupported Cloudflare deployment mode: skip')
  })

  it('keeps the frozen 19-route Worker contract and seven-route HTML contract', () => {
    const source = fs.readFileSync(path.join(ROOT, 'wrangler.production-traffic-layer.jsonc'), 'utf8')
    const config = parseProductionTrafficLayerConfig(source)
    expect(config.routes).toHaveLength(PRODUCTION_ROUTE_COUNT)
    expect(config.routes.some((route) => route.pattern === 'www.visutry.com/*')).toBe(false)
    expect(config.routes.some((route) => route.pattern.includes('/_next/'))).toBe(false)
    expect(releaseContractErrors(config)).toEqual([])
  })

  it('retries a MISS and accepts an eventual HIT for every URL', async () => {
    const calls = new Map<string, number>()
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input)
      const count = (calls.get(url) ?? 0) + 1
      calls.set(url, count)
      const pathname = new URL(url).pathname
      return htmlResponse(pathname, 200, count === 1 ? 'MISS' : 'HIT')
    }
    const observations = await warmAndVerifyPublicHtml(PUBLIC_HTML_OFFLOAD_PURGE_URLS, fetchMock, {
      maxAttempts: 3,
      delayMs: 0,
      sleep: async () => undefined,
    })
    expect(observations).toHaveLength(7)
    expect(observations.every((observation) => observation.firstCacheStatus === 'MISS')).toBe(true)
    expect(observations.every((observation) => observation.finalCacheStatus === 'HIT')).toBe(true)
    expect(observations.every((observation) => observation.attempts === 2)).toBe(true)
  })

  it('accepts a first-attempt HIT without requiring a fragile MISS', async () => {
    const fetchMock: typeof fetch = async (input) => htmlResponse(new URL(String(input)).pathname, 200, 'HIT')
    const observations = await warmAndVerifyPublicHtml([PUBLIC_HTML_OFFLOAD_PURGE_URLS[0]], fetchMock, {
      delayMs: 0,
      sleep: async () => undefined,
    })
    expect(observations[0]).toMatchObject({ firstCacheStatus: 'HIT', finalCacheStatus: 'HIT', attempts: 1 })
  })

  it('fails on non-200 HTML responses and on a missing eventual HIT', async () => {
    const badStatusFetch: typeof fetch = async (input) => htmlResponse(new URL(String(input)).pathname, 503, 'MISS')
    await expect(warmAndVerifyPublicHtml([PUBLIC_HTML_OFFLOAD_PURGE_URLS[0]], badStatusFetch, {
      delayMs: 0,
      sleep: async () => undefined,
    })).rejects.toThrow('HTTP 503')

    const missFetch: typeof fetch = async (input) => htmlResponse(new URL(String(input)).pathname, 200, 'MISS')
    await expect(warmAndVerifyPublicHtml([PUBLIC_HTML_OFFLOAD_PURGE_URLS[0]], missFetch, {
      maxAttempts: 2,
      delayMs: 0,
      sleep: async () => undefined,
    })).rejects.toThrow('no cache HIT observed')
  })

  it('independently verifies the Vercel deployment and alias through both API reads', async () => {
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input)
      if (url.includes('/aliases')) {
        return new Response(JSON.stringify([{ alias: 'www.visutry.com' }]), { status: 200 })
      }
      return new Response(JSON.stringify({
        id: 'dpl_release',
        projectId: 'prj_visutry',
        teamId: 'team_visutry',
        target: 'production',
        readyState: 'READY',
        meta: { githubCommitSha: 'a'.repeat(40) },
      }), { status: 200 })
    }
    const config = {
      apiToken: 'test-token',
      projectId: 'prj_visutry',
      teamId: 'team_visutry',
      deploymentId: 'dpl_release',
      expectedGitSha: 'a'.repeat(40),
      productionAlias: 'www.visutry.com',
    }
    const proof = await fetchVercelProductionDeploymentProof(config, fetchMock)
    expect(isVercelProductionDeploymentProofValid(proof, config)).toBe(true)
  })
})

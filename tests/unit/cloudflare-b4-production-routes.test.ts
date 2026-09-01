/** @jest-environment node */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import {
  B4_FORBIDDEN_WRANGLER_SHAPES,
  B4_LOCALES,
  B4_NEGATIVE_PATHS,
  B4_POSITIVE_PATHS,
  B4_PRODUCTION_PUBLIC_HOST,
  B4_REQUIRED_REQUEST_LIMIT_FAIL_OPEN,
  assertFailOpenActivation,
  assertRemoteFailOpenActivation,
  assertSafeB4ProductionRoutes,
  cloudflareRouteMatches,
  generateB4ProductionWorkerRoutes,
  proposedCloudflareRouteApiPayload,
  proposedWranglerProductionRoutes,
  readProductionWwwDnsInspect,
  requireFrozenWwwDnsTarget,
  routesForPriority,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'
import {
  B4_VERCEL_NEXT_SNAPSHOT_DIR,
  compareHashedStaticManifests,
  hashedStaticParityGate,
  snapshotVercelNextBuild,
} from '../../cloudflare-router/b4-static-asset-parity'

function getRequest(pathname: string) {
  return {
    url: `https://${B4_PRODUCTION_PUBLIC_HOST}${pathname}`,
    method: 'GET',
    headers: { get() { return null } },
  } as unknown as Request
}

describe('B4.2B scoped production Worker Routes', () => {
  const routes = generateB4ProductionWorkerRoutes()

  it('does not wire production routes, custom_domain, or www catch-all into wrangler.jsonc', () => {
    const wrangler = fs.readFileSync(path.join(__dirname, '../../wrangler.jsonc'), 'utf8')
    expect(wrangler).toMatch(/"run_worker_first"\s*:\s*false/)
    expect(wrangler).not.toMatch(/"custom_domain"\s*:\s*true/)
    expect(wrangler).not.toMatch(/"pattern"\s*:/)
    expect(wrangler).not.toMatch(/www\.visutry\.com\/\*/)
    expect(wrangler).toMatch(/"name"\s*:\s*"visutry-cf-production"/)
    expect(wrangler).not.toMatch(/"routes"\s*:/)
    expect(wrangler).toMatch(/"workers_dev": true/)
    expect(wrangler).toMatch(/deploy:cloudflare remains staging-only|visutry-cf-staging/)
    const pkg = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
    expect(pkg).toMatch(/opennextjs-cloudflare deploy --env staging/)
    expect(pkg).toMatch(/opennextjs-cloudflare deploy --env production/)
  })

  it('generates a finite NON-Next scoped set with no catch-all and no Next client-graph route', () => {
    expect(routes.length).toBeGreaterThan(8)
    expect(routes.length).toBeLessThan(50)
    expect(routes.some((row) => row.pattern === `${B4_PRODUCTION_PUBLIC_HOST}/*`)).toBe(false)
    expect(assertSafeB4ProductionRoutes(routes)).toEqual([])
    for (const forbidden of B4_FORBIDDEN_WRANGLER_SHAPES) {
      expect(routes.some((row) => row.pattern.includes(forbidden) && forbidden !== 'custom_domain')).toBe(false)
    }
    // Vercel owns the Next frontend: no /_next/* and no Next HTML routes exist.
    expect(routes.some((row) => row.pattern.includes('/_next/'))).toBe(false)
    expect(proposedWranglerProductionRoutes('P0').every((row) => row.zone_name === 'visutry.com')).toBe(true)
    expect(proposedWranglerProductionRoutes('P0').some((row) => row.pattern.includes('/_next/static'))).toBe(false)
    expect(proposedCloudflareRouteApiPayload('P0').every((row) => row.request_limit_fail_open === true)).toBe(true)
    expect(assertFailOpenActivation()).toEqual([])
    expect(B4_REQUIRED_REQUEST_LIMIT_FAIL_OPEN).toBe(true)
  })

  it('matches approved NON-Next capabilities and never matches Next HTML for any locale', () => {
    for (const pathname of B4_POSITIVE_PATHS) {
      expect(wwwWorkerRouteMatch(pathname, '', routes)?.pattern).toBeTruthy()
    }
    for (const locale of B4_LOCALES) {
      // Next HTML (locale home, marketing pages) is Vercel-owned → no Worker route.
      expect(wwwWorkerRouteMatch(`/${locale}`, '', routes)).toBeNull()
      expect(wwwWorkerRouteMatch(`/${locale}/store`, '', routes)).toBeNull()
      expect(wwwWorkerRouteMatch(`/${locale}/blog`, '', routes)).toBeNull()
      expect(wwwWorkerRouteMatch(`/${locale}/try-on/glasses`, '', routes)).toBeNull()
    }
    expect(wwwWorkerRouteMatch('/api/health', '', routes)?.layer).toBe('layer2-worker')
    expect(wwwWorkerRouteMatch('/api/glasses/brands', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/images/x.webp', '', routes)?.layer).toBe('layer1-static-asset')
    // The Next client artifact graph must never match a Worker route.
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', routes)).toBeNull()
  })

  it('does not match Layer 3 / auth / image / Store detail / Campaign / writes', () => {
    for (const pathname of B4_NEGATIVE_PATHS) {
      expect(wwwWorkerRouteMatch(pathname, '', routes)).toBeNull()
    }
    expect(wwwWorkerRouteMatch('/en/store/ello-sunglasses', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/c/foo/bar', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/category/foo', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/try/foo', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/discover', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/style-explorer', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/auth/session', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/frames', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/_next/image', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/auth/signin', '', routes)).toBeNull()
  })

  it('hard-blocks /_next/static from every priority and gate (Vercel owns the client graph)', () => {
    const p0 = routesForPriority('P0', routes)
    expect(p0.every((row) => row.layer === 'layer1-static-asset' || row.pattern.includes('/api/'))).toBe(true)
    expect(p0.every((row) => row.activationGate === 'none')).toBe(true)
    expect(wwwWorkerRouteMatch('/en', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health', '', p0)?.priority).toBe('P0')
    // /_next/static is never generated at any priority or gate.
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', routes)).toBeNull()
    expect(
      wwwWorkerRouteMatch(
        '/_next/static/chunks/app.js',
        '',
        routesForPriority('P0', routes, { includeParityGatedHashedStatic: true }),
      ),
    ).toBeNull()
    expect(routes.some((row) => row.activationGate === 'same-commit-asset-parity')).toBe(false)
  })

  it('refuses to generate a forbidden /_next/static production route', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../cloudflare-router/b4-production-routes') as typeof import('../../cloudflare-router/b4-production-routes')
    expect(mod.isForbiddenNextClientGraphRoute('www.visutry.com/_next/static/*')).toBe(true)
    expect(mod.isForbiddenNextClientGraphRoute('www.visutry.com/images/*')).toBe(false)
    expect(mod.B4_FORBIDDEN_PRODUCTION_ROUTE_PATTERNS).toContain('www.visutry.com/_next/static/*')
    // assertSafe flags a hand-injected forbidden route.
    const poisoned = [
      ...routes,
      {
        ...routes[0],
        pattern: 'www.visutry.com/_next/static/*',
      },
    ]
    expect(
      assertSafeB4ProductionRoutes(poisoned).some((row) => row.includes('FORBIDDEN Next client-graph route')),
    ).toBe(true)
  })

  it('scopes static asset routes to directory /* and does not emit greedy path*', () => {
    expect(routes.some((row) => row.pattern === 'www.visutry.com/images*')).toBe(false)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/home*')).toBe(false)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/assets*')).toBe(false)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/_next/static*')).toBe(false)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/images/*')).toBe(true)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/home/*')).toBe(true)
    expect(routes.some((row) => row.pattern === 'www.visutry.com/assets/*')).toBe(true)
    expect(wwwWorkerRouteMatch('/images/seo/core/common-face-shapes-guide.webp', '', routes)?.pattern).toBe('www.visutry.com/images/*')
    expect(wwwWorkerRouteMatch('/imagery', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/homepage', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/imagesfoo', '', routes)).toBeNull()
    expect(cloudflareRouteMatches('www.visutry.com/images*', 'https://www.visutry.com/imagesfoo')).toBe(true)
    expect(cloudflareRouteMatches('www.visutry.com/home*', 'https://www.visutry.com/homepage')).toBe(true)
    expect(cloudflareRouteMatches('www.visutry.com/images/*', 'https://www.visutry.com/imagesfoo')).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/images/*', 'https://www.visutry.com/imagery')).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/home/*', 'https://www.visutry.com/homepage')).toBe(false)
    expect(
      assertSafeB4ProductionRoutes([
        {
          ...routes.find((row) => row.pattern === 'www.visutry.com/images/*')!,
          pattern: 'www.visutry.com/images*',
        },
      ]).some((row) => row.includes('greedy static wildcard')),
    ).toBe(true)
  })

  it('distinguishes brands vs frames and keeps Next HTML off the Worker', () => {
    expect(wwwWorkerRouteMatch('/en/store', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store/ello-sunglasses', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/brands', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/frames', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/try-on/glasses', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/try/round-glasses', '', routes)).toBeNull()
  })

  it('keeps route matches aligned with the B4 classifier for representative GET paths', () => {
    // Approved NON-Next capabilities: classifier says cloudflare AND a Worker route matches.
    for (const pathname of ['/api/health', '/robots.txt', '/images/x.webp', '/favicon.ico']) {
      expect(classifyB4ProductionPublicSlice(getRequest(pathname)).backend).toBe('cloudflare')
      expect(wwwWorkerRouteMatch(pathname, '', routes)).toBeTruthy()
    }
    // Next frontend + deferred/auth/image: classifier says vercel AND no Worker route.
    for (const pathname of ['/', '/en', '/en/store', '/en/brand/warby-parker', '/en/store/ello-sunglasses', '/en/c/foo/bar', '/api/glasses/brands', '/api/glasses/categories', '/api/glasses/face-shapes', '/api/glasses/frames', '/api/auth/session', '/_next/image', '/_next/static/chunks/app.js']) {
      expect(classifyB4ProductionPublicSlice(getRequest(pathname)).backend).toBe('vercel')
      expect(wwwWorkerRouteMatch(pathname, '', routes)).toBeNull()
    }
  })

  it('keeps the committed JSON manifest equal to the generator', () => {
    const jsonPath = path.join(__dirname, '../../cloudflare-router/b4-production-routes.json')
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
      activated: boolean
      customDomain: boolean
      wranglerProductionRoutesWired: boolean
      summary: { requestLimitFailOpenRequired: boolean; wwwDnsTargetFrozen: boolean }
      routes: ReturnType<typeof generateB4ProductionWorkerRoutes>
    }
    expect(parsed.activated).toBe(false)
    expect(parsed.customDomain).toBe(false)
    expect(parsed.wranglerProductionRoutesWired).toBe(false)
    expect(parsed.summary.requestLimitFailOpenRequired).toBe(true)
    expect(parsed.summary.wwwDnsTargetFrozen).toBe(true)
    expect(parsed.routes).toEqual(routes)
  })

  it('treats Cloudflare path* as greedy and therefore never emits store*', () => {
    expect(cloudflareRouteMatches('www.visutry.com/en/store*', 'https://www.visutry.com/en/store/ello-sunglasses')).toBe(true)
    expect(routes.some((row) => row.pattern.includes('/store*'))).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style*', 'https://www.visutry.com/en/style-explorer')).toBe(true)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style-explorer')).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style/round-face')).toBe(true)
  })

  it('does not match query strings on exact routes, so query traffic stays on Vercel', () => {
    expect(wwwWorkerRouteMatch('/en', '?utm_source=newsletter', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '?utm_campaign=spring', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health', '?x=1', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/brands', '?x=1', routes)).toBeNull()
    // Wildcard directory asset routes still match with a query string.
    expect(wwwWorkerRouteMatch('/images/x.webp', '?v=2', routes)?.pattern).toBe('www.visutry.com/images/*')
  })

  it('freezes the inspected Vercel www ALIAS, not a docs-example CNAME', () => {
    const inspect = readProductionWwwDnsInspect()
    expect(inspect.resolved).toBe(true)
    expect(inspect.recordType).toBe('CNAME')
    expect(inspect.target).toBe('cname.vercel-dns-017.com')
    expect(inspect.inspectedAt).toBeTruthy()
    expect(inspect.command).toBe('vercel domains inspect www.visutry.com')
    expect(inspect.examplesThatMustNotBeAssumed).toEqual(['cname.vercel-dns.com', 'cname.vercel-dns-0.com'])
    expect(inspect.target).not.toBe('cname.vercel-dns.com')
    expect(inspect.target).not.toBe('cname.vercel-dns-0.com')
    expect(requireFrozenWwwDnsTarget(inspect)).toEqual({
      recordType: 'CNAME',
      target: 'cname.vercel-dns-017.com',
    })
    const source = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/b4-production-routes.ts'), 'utf8')
    expect(source).not.toMatch(/B4_PRODUCTION_WWW_DNS_TARGET\s*=\s*'cname\.vercel-dns/)
  })

  it('fails the hashed-static parity gate when Vercel files are missing from Cloudflare assets', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b4-parity-'))
    const vercelStatic = path.join(root, 'vercel', 'static')
    const cfStatic = path.join(root, 'cf', '_next', 'static')
    fs.mkdirSync(path.join(vercelStatic, 'chunks'), { recursive: true })
    fs.mkdirSync(path.join(cfStatic, 'chunks'), { recursive: true })
    fs.writeFileSync(path.join(root, 'vercel', 'BUILD_ID'), 'vercel-id\n')
    fs.writeFileSync(
      path.join(root, 'vercel', '.b4-vercel-snapshot.json'),
      `${JSON.stringify({ kind: 'vercel-next-snapshot', gitSha: 'same-commit' })}\n`,
    )
    fs.writeFileSync(path.join(vercelStatic, 'chunks', 'app.js'), 'vercel')
    fs.writeFileSync(path.join(cfStatic, 'chunks', 'other.js'), 'cf')
    const compared = compareHashedStaticManifests(vercelStatic, cfStatic)
    expect(compared.missingOnCloudflare).toEqual(['chunks/app.js'])
    const skipped = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'missing-next'),
      cloudflareAssetsDir: path.join(root, 'cf'),
      gitSha: 'same-commit',
    })
    expect(skipped.status).toBe('skipped')
    const failed = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
      gitSha: 'same-commit',
    })
    expect(failed.status).toBe('fail')
    fs.writeFileSync(path.join(cfStatic, 'chunks', 'app.js'), 'cf')
    const passed = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
      gitSha: 'same-commit',
    })
    expect(passed.status).toBe('pass')
    const shaMismatch = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
      gitSha: 'other-commit',
    })
    expect(shaMismatch.status).toBe('fail')
    expect(shaMismatch.reason).toMatch(/snapshot gitSha same-commit != current other-commit/)
    fs.writeFileSync(path.join(root, 'vercel', '.b4-vercel-snapshot.json'), '{}\n')
    const missingSha = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
      gitSha: 'same-commit',
    })
    expect(missingSha.status).toBe('fail')
    expect(missingSha.reason).toMatch(/missing gitSha/)
  })

  it('does not treat a live .next tree as the Vercel artifact after Cloudflare overwrite', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b4-parity-live-'))
    const liveNext = path.join(root, '.next')
    const snapshotDir = path.join(root, B4_VERCEL_NEXT_SNAPSHOT_DIR)
    const cfAssets = path.join(root, '.open-next', 'assets')
    fs.mkdirSync(path.join(liveNext, 'static', 'chunks'), { recursive: true })
    fs.writeFileSync(path.join(liveNext, 'BUILD_ID'), 'vercel-id\n')
    fs.writeFileSync(path.join(liveNext, 'static', 'chunks', 'app.js'), 'vercel')
    snapshotVercelNextBuild({ sourceNextDir: liveNext, snapshotDir, gitSha: 'same-commit' })
    fs.writeFileSync(path.join(liveNext, 'BUILD_ID'), 'cloudflare-id\n')
    fs.writeFileSync(path.join(liveNext, 'static', 'chunks', 'app.js'), 'overwritten-by-cf')
    fs.unlinkSync(path.join(liveNext, 'static', 'chunks', 'app.js'))
    fs.writeFileSync(path.join(liveNext, 'static', 'chunks', 'cf-only.js'), 'cf')
    fs.mkdirSync(path.join(cfAssets, '_next', 'static', 'chunks'), { recursive: true })
    fs.writeFileSync(path.join(cfAssets, '_next', 'static', 'chunks', 'cf-only.js'), 'cf')
    const liveCompared = hashedStaticParityGate({
      vercelNextDir: liveNext,
      cloudflareAssetsDir: cfAssets,
      gitSha: 'same-commit',
    })
    expect(liveCompared.status).toBe('skipped')
    expect(liveCompared.reason).toMatch(/snapshot missing|Live \.next/)
    const defaultWithoutSnapshot = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'missing-snapshot'),
      cloudflareAssetsDir: cfAssets,
      gitSha: 'same-commit',
    })
    expect(defaultWithoutSnapshot.status).toBe('skipped')
    expect(defaultWithoutSnapshot.reason).toMatch(/snapshot missing/)
    const snapFailed = hashedStaticParityGate({
      vercelNextDir: snapshotDir,
      cloudflareAssetsDir: cfAssets,
      gitSha: 'same-commit',
    })
    expect(snapFailed.status).toBe('fail')
    expect(snapFailed.missingOnCloudflare).toEqual(['chunks/app.js'])
  })

  it('does not treat local fail-open intent as Phase C remote PASS', () => {
    expect(assertFailOpenActivation()).toEqual([])
    expect(assertRemoteFailOpenActivation({ attached: [] })[0]).toMatch(/no remote Cloudflare routes/)
    expect(assertRemoteFailOpenActivation({
      attached: [{ pattern: 'www.visutry.com/api/health', script: 'visutry-cf-production', request_limit_fail_open: false }],
      expectedPatterns: ['www.visutry.com/api/health'],
    }).some((row) => row.includes('request_limit_fail_open=false'))).toBe(true)
    expect(assertRemoteFailOpenActivation({
      attached: [{ pattern: 'www.visutry.com/api/health', script: 'visutry-cf-production', request_limit_fail_open: true }],
      expectedPatterns: ['www.visutry.com/api/health'],
    })).toEqual([])
    expect(assertRemoteFailOpenActivation({
      attached: [
        { pattern: 'www.visutry.com/api/health', script: 'visutry-cf-production', request_limit_fail_open: true },
        { pattern: 'www.visutry.com/*', script: 'visutry-cf-production', request_limit_fail_open: true },
      ],
      expectedPatterns: ['www.visutry.com/api/health'],
    }).some((row) => row.includes('unexpected www route attached remotely: www.visutry.com/*'))).toBe(true)
    expect(assertRemoteFailOpenActivation({
      attached: [{ pattern: 'www.visutry.com/api/health', request_limit_fail_open: true }],
      expectedPatterns: ['www.visutry.com/api/health'],
    }).some((row) => row.includes('attached to null, expected visutry-cf-production'))).toBe(true)
    expect(assertRemoteFailOpenActivation({
      attached: [{ pattern: 'www.visutry.com/api/health', script: null, request_limit_fail_open: true }],
      expectedPatterns: ['www.visutry.com/api/health'],
    }).some((row) => row.includes('attached to null, expected visutry-cf-production'))).toBe(true)
  })
})

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
  B4_VERCEL_DNS_EXAMPLE_HOSTS,
  assertFailOpenActivation,
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
  compareHashedStaticManifests,
  hashedStaticParityGate,
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
    expect(wrangler).not.toMatch(/www\.visutry\.com/)
    expect(wrangler).not.toMatch(/"env"[\s\S]*"production"/)
    expect(wrangler).toMatch(/"workers_dev": true/)
    expect(wrangler).toMatch(/deploy:cloudflare uses `--env staging` only|visutry-cf-staging/)
    const pkg = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
    expect(pkg).toMatch(/opennextjs-cloudflare deploy --env staging/)
    expect(pkg).not.toMatch(/deploy --env production/)
  })

  it('generates a finite scoped set with no catch-all and no greedy store/style/try wildcards', () => {
    expect(routes.length).toBeGreaterThan(20)
    expect(routes.length).toBeLessThan(1000)
    expect(routes.some((row) => row.pattern === `${B4_PRODUCTION_PUBLIC_HOST}/*`)).toBe(false)
    expect(assertSafeB4ProductionRoutes(routes)).toEqual([])
    for (const forbidden of B4_FORBIDDEN_WRANGLER_SHAPES) {
      expect(routes.some((row) => row.pattern.includes(forbidden) && forbidden !== 'custom_domain')).toBe(false)
    }
    expect(proposedWranglerProductionRoutes('P0').every((row) => row.zone_name === 'visutry.com')).toBe(true)
    expect(proposedWranglerProductionRoutes('P0').some((row) => row.pattern.includes('/_next/static'))).toBe(false)
    expect(proposedCloudflareRouteApiPayload('P0').every((row) => row.request_limit_fail_open === true)).toBe(true)
    expect(assertFailOpenActivation()).toEqual([])
    expect(B4_REQUIRED_REQUEST_LIMIT_FAIL_OPEN).toBe(true)
  })

  it('matches approved Layer 1 / Layer 2 families including all locales', () => {
    for (const pathname of B4_POSITIVE_PATHS) {
      expect(wwwWorkerRouteMatch(pathname, '', routes)?.pattern).toBeTruthy()
    }
    for (const locale of B4_LOCALES) {
      expect(wwwWorkerRouteMatch(`/${locale}`, '', routes)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/${locale}`)
      expect(wwwWorkerRouteMatch(`/${locale}/store`, '', routes)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/${locale}/store`)
      expect(wwwWorkerRouteMatch(`/${locale}/blog`, '', routes)?.pattern).toContain('/blog')
      expect(wwwWorkerRouteMatch(`/${locale}/try-on/glasses`, '', routes)?.pattern).toContain('/try-on')
    }
    expect(wwwWorkerRouteMatch('/api/health', '', routes)?.layer).toBe('layer2-worker')
    expect(wwwWorkerRouteMatch('/api/glasses/brands', '', routes)?.layer).toBe('layer2-worker')
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', routes)?.layer).toBe('layer1-static-asset')
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

  it('keeps P0 activation off hashed /_next/static until the same-commit parity gate passes', () => {
    const p0 = routesForPriority('P0', routes)
    expect(p0.every((row) => row.layer === 'layer1-static-asset' || row.pattern.includes('/api/'))).toBe(true)
    expect(p0.every((row) => row.activationGate === 'none')).toBe(true)
    expect(wwwWorkerRouteMatch('/en', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health', '', p0)?.priority).toBe('P0')
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', routes)?.activationGate).toBe('same-commit-asset-parity')
    expect(
      wwwWorkerRouteMatch(
        '/_next/static/chunks/app.js',
        '',
        routesForPriority('P0', routes, { includeParityGatedHashedStatic: true }),
      )?.pattern,
    ).toBe('www.visutry.com/_next/static*')
  })

  it('distinguishes store hub vs detail, brands vs frames, try-on vs try', () => {
    expect(wwwWorkerRouteMatch('/en/store', '', routes)?.pattern).toBe('www.visutry.com/en/store')
    expect(wwwWorkerRouteMatch('/en/store/ello-sunglasses', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/brands', '', routes)?.pattern).toBe('www.visutry.com/api/glasses/brands')
    expect(wwwWorkerRouteMatch('/api/glasses/frames', '', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/try-on/glasses', '', routes)?.pattern).toBe('www.visutry.com/en/try-on*')
    expect(wwwWorkerRouteMatch('/en/try/round-glasses', '', routes)).toBeNull()
  })

  it('keeps route matches aligned with the B4 classifier for representative GET paths', () => {
    for (const pathname of ['/en', '/en/store', '/en/brand/warby-parker', '/api/health', '/robots.txt']) {
      expect(classifyB4ProductionPublicSlice(getRequest(pathname)).backend).toBe('cloudflare')
      expect(wwwWorkerRouteMatch(pathname, '', routes)).toBeTruthy()
    }
    for (const pathname of ['/en/store/ello-sunglasses', '/en/c/foo/bar', '/api/glasses/frames', '/api/auth/session', '/_next/image']) {
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
    expect(parsed.summary.wwwDnsTargetFrozen).toBe(false)
    expect(parsed.routes).toEqual(routes)
  })

  it('treats Cloudflare path* as greedy and therefore never emits store*', () => {
    expect(cloudflareRouteMatches('www.visutry.com/en/store*', 'https://www.visutry.com/en/store/ello-sunglasses')).toBe(true)
    expect(routes.some((row) => row.pattern.includes('/store*'))).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style*', 'https://www.visutry.com/en/style-explorer')).toBe(true)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style-explorer')).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style/round-face')).toBe(true)
  })

  it('does not match query strings on exact routes, so UTM traffic stays on Vercel until a * pattern is used', () => {
    expect(wwwWorkerRouteMatch('/en', '?utm_source=newsletter', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '?utm_campaign=spring', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health', '?x=1', routes)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/blog', '?utm_source=x', routes)?.pattern).toBe('www.visutry.com/en/blog*')
  })

  it('refuses to freeze a docs-example Vercel CNAME as the production www origin', () => {
    const inspect = readProductionWwwDnsInspect()
    expect(inspect.resolved).toBe(false)
    expect(inspect.target).toBeNull()
    expect(inspect.command).toBe('vercel domains inspect www.visutry.com')
    expect(() => requireFrozenWwwDnsTarget(inspect)).toThrow(/not frozen/)
    expect(B4_VERCEL_DNS_EXAMPLE_HOSTS).toEqual(['cname.vercel-dns.com', 'cname.vercel-dns-0.com'])
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
    fs.writeFileSync(path.join(vercelStatic, 'chunks', 'app.js'), 'vercel')
    fs.writeFileSync(path.join(cfStatic, 'chunks', 'other.js'), 'cf')
    const compared = compareHashedStaticManifests(vercelStatic, cfStatic)
    expect(compared.missingOnCloudflare).toEqual(['chunks/app.js'])
    const skipped = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'missing-next'),
      cloudflareAssetsDir: path.join(root, 'cf'),
    })
    expect(skipped.status).toBe('skipped')
    const failed = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
    })
    expect(failed.status).toBe('fail')
    fs.writeFileSync(path.join(cfStatic, 'chunks', 'app.js'), 'cf')
    const passed = hashedStaticParityGate({
      vercelNextDir: path.join(root, 'vercel'),
      cloudflareAssetsDir: path.join(root, 'cf'),
    })
    expect(passed.status).toBe('pass')
  })
})

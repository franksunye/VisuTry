/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import {
  B4_FORBIDDEN_WRANGLER_SHAPES,
  B4_LOCALES,
  B4_NEGATIVE_PATHS,
  B4_POSITIVE_PATHS,
  B4_PRODUCTION_PUBLIC_HOST,
  assertSafeB4ProductionRoutes,
  cloudflareRouteMatches,
  generateB4ProductionWorkerRoutes,
  proposedWranglerProductionRoutes,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'

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

  it('keeps P0 limited to assets and exact public APIs', () => {
    const p0 = routes.filter((row) => row.priority === 'P0')
    expect(p0.every((row) => row.layer === 'layer1-static-asset' || row.pattern.includes('/api/'))).toBe(true)
    expect(wwwWorkerRouteMatch('/en', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '', p0)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health', '', p0)?.priority).toBe('P0')
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', p0)?.priority).toBe('P0')
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
      routes: ReturnType<typeof generateB4ProductionWorkerRoutes>
    }
    expect(parsed.activated).toBe(false)
    expect(parsed.customDomain).toBe(false)
    expect(parsed.wranglerProductionRoutesWired).toBe(false)
    expect(parsed.routes).toEqual(routes)
  })

  it('treats Cloudflare path* as greedy and therefore never emits store*', () => {
    expect(cloudflareRouteMatches('www.visutry.com/en/store*', 'https://www.visutry.com/en/store/ello-sunglasses')).toBe(true)
    expect(routes.some((row) => row.pattern.includes('/store*'))).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style*', 'https://www.visutry.com/en/style-explorer')).toBe(true)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style-explorer')).toBe(false)
    expect(cloudflareRouteMatches('www.visutry.com/en/style/*', 'https://www.visutry.com/en/style/round-face')).toBe(true)
  })
})

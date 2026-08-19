/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import {
  B4_CACHE_POLICIES,
  B4_OPENNEXT_ASSET_AUDIT,
  B4_PRODUCTION_PUBLIC_SLICE_MANIFEST,
  classifyB4ProductionPublicSlice,
  productionFallbackOrigin,
  productionPublicHost,
  shouldBypassPublicCache,
} from '../../cloudflare-router/b4-production-public-slice'
import { classify } from '../../cloudflare-router/worker'

function request(path: string, method = 'GET', headers?: Record<string, string>) {
  return {
    url: `https://www.visutry.com${path}`,
    method,
    headers: {
      get(name: string) {
        if (!headers) return null
        return headers[name.toLowerCase()] ?? headers[name] ?? null
      },
    },
  } as Request
}

describe('B4.2 first production public slice', () => {
  it('keeps the first slice public, GET/HEAD, and unauthenticated', () => {
    expect(B4_PRODUCTION_PUBLIC_SLICE_MANIFEST.some((row) => row.cutoverClass === 'first' && row.auth !== 'none')).toBe(false)
    expect(classifyB4ProductionPublicSlice(request('/en')).auth).toBe('none')
    expect(classifyB4ProductionPublicSlice(request('/api/auth/session'))).toMatchObject({ backend: 'vercel' })
    expect(classifyB4ProductionPublicSlice(request('/api/try-on/history'))).toMatchObject({ backend: 'vercel' })
    expect(classifyB4ProductionPublicSlice(request('/api/merchant/workspaces', 'POST'))).toMatchObject({ backend: 'vercel' })
  })

  it('routes ONLY the approved NON-Next static/public families and APIs to Cloudflare', () => {
    const cfReady: Array<[string, string]> = [
      ['GET', '/favicon.ico'],
      ['GET', '/robots.txt'],
      ['GET', '/llms.txt'],
      ['GET', '/images/seo/core/common-face-shapes-guide.webp'],
      ['GET', '/home/hero.webp'],
      ['GET', '/experience-heroes/demo.webp'],
      ['GET', '/blog-covers/cover.jpg'],
      ['GET', '/assets/logo.png'],
      ['GET', '/api/health'],
      ['GET', '/api/glasses/brands'],
      ['GET', '/api/glasses/categories'],
      ['GET', '/api/glasses/face-shapes'],
    ]
    for (const [method, path] of cfReady) {
      expect(classifyB4ProductionPublicSlice(request(path, method))).toMatchObject({
        backend: 'cloudflare',
        routeClass: 'cf-ready',
        cutoverClass: 'first',
      })
    }
  })

  it('routes ALL Next HTML, RSC, and /_next/static to Vercel (single Next frontend owner)', () => {
    const nextFrontend: string[] = [
      '/',
      '/en',
      '/id',
      '/en/face-shape-detector',
      '/en/blog',
      '/en/blog/how-to-choose-glasses-for-your-face',
      '/en/brand/warby-parker',
      '/en/store',
      '/en/glasses-guide/round-face-cat-eye',
      '/en/face-shapes/oval',
      '/en/style/round-face',
      '/en/try-on/glasses',
      '/en/face-analysis',
      '/face-shape-detector',
      '/brand/warby-parker',
      '/glasses-guide',
      '/_next/static/chunks/app.js',
      '/_next/static/css/app.css',
      '/sitemap.xml',
      '/sitemaps/core.xml',
    ]
    for (const path of nextFrontend) {
      expect(classifyB4ProductionPublicSlice(request(path))).toMatchObject({
        backend: 'vercel',
        routeClass: 'vercel-required',
      })
    }
  })

  it('routes RSC / Flight navigation to Vercel even for former CF HTML families', () => {
    // ?_rsc= query param
    expect(classifyB4ProductionPublicSlice(request('/en/glasses-guide/round-face-cat-eye?_rsc=abc123')))
      .toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    // RSC request headers on an otherwise CF-owned static path
    expect(
      classifyB4ProductionPublicSlice(request('/api/glasses/brands', 'GET', { rsc: '1' })),
    ).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    expect(
      classifyB4ProductionPublicSlice(request('/en', 'GET', { 'next-router-prefetch': '1' })),
    ).toMatchObject({ backend: 'vercel' })
    expect(
      classifyB4ProductionPublicSlice(request('/en', 'GET', { accept: 'text/x-component' })),
    ).toMatchObject({ backend: 'vercel' })
  })

  it('keeps Store/Campaign, closed programmatic SEO, and dynamic pages on Vercel', () => {
    const vercel: string[] = [
      '/en/store/luna-optical',
      '/en/c/luna-optical/petite-fit',
      '/en/category/aviator',
      '/en/try/some-frame-slug',
      '/en/discover',
      '/en/style-explorer',
      '/en/merchant',
      '/sitemaps/dynamic.xml',
      '/api/glasses/frames',
      '/api/frames',
      '/api/store/merchants/luna-optical',
    ]
    for (const path of vercel) {
      expect(classifyB4ProductionPublicSlice(request(path))).toMatchObject({ backend: 'vercel' })
    }
  })

  it('does not treat Cookie as identity for public classification', () => {
    const cookieRequest = request('/api/glasses/brands', 'GET', {
      cookie: 'next-auth.session-token=abc',
    })
    expect(classifyB4ProductionPublicSlice(cookieRequest)).toMatchObject({
      backend: 'cloudflare',
      routeClass: 'cf-ready',
    })
    expect(shouldBypassPublicCache(cookieRequest, classifyB4ProductionPublicSlice(cookieRequest))).toBe(false)
  })

  it('bypasses public cache for Authorization, `/`, and health', () => {
    expect(shouldBypassPublicCache(
      request('/en', 'GET', { authorization: 'Bearer x' }),
      classifyB4ProductionPublicSlice(request('/en', 'GET', { authorization: 'Bearer x' })),
    )).toBe(true)
    expect(shouldBypassPublicCache(request('/'), classifyB4ProductionPublicSlice(request('/')))).toBe(true)
    expect(shouldBypassPublicCache(request('/api/health'), classifyB4ProductionPublicSlice(request('/api/health')))).toBe(true)
  })

  it('sends unknown paths, unknown methods, and image optimization to Vercel', () => {
    expect(classifyB4ProductionPublicSlice(request('/api/unknown-capability'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'unknown-fallback',
    })
    expect(classifyB4ProductionPublicSlice(request('/en', 'POST'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'unknown-fallback',
    })
    expect(classifyB4ProductionPublicSlice(request('/_next/image'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
    })
    expect(classifyB4ProductionPublicSlice(request('/api/face-analysis/submit', 'POST'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
    })
  })

  it('does not expand the live B3.2 staging classifier', () => {
    expect(classify(request('/en/brand/warby-parker'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'unknown-fallback',
    })
    expect(classify(request('/api/auth/session'))).toMatchObject({
      backend: 'cloudflare',
      routeClass: 'cf-ready',
    })
    // Post-cutover: marketing HTML is Vercel-owned in the B4 classifier.
    expect(classifyB4ProductionPublicSlice(request('/en/brand/warby-parker'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
    })
    expect(classifyB4ProductionPublicSlice(request('/api/auth/session'))).toMatchObject({
      backend: 'vercel',
    })
  })

  it('keeps the review manifest unauthenticated for first-cutover rows', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../cloudflare-router/b4-production-public-slice.manifest.json') as {
      authenticatedTrafficIncluded: boolean
      productionTraffic: boolean
      routes: Array<{ cutoverClass: string; auth: string }>
    }
    expect(manifest.productionTraffic).toBe(false)
    expect(manifest.authenticatedTrafficIncluded).toBe(false)
    expect(manifest.routes.filter((row) => row.cutoverClass === 'first').every((row) => row.auth === 'none')).toBe(true)
  })

  it('records a loop-free Vercel fallback origin that is not www.visutry.com', () => {
    expect(productionPublicHost()).toBe('www.visutry.com')
    expect(productionFallbackOrigin()).toBe('https://visutry.vercel.app')
    expect(new URL(productionFallbackOrigin()).hostname).not.toBe(productionPublicHost())
  })

  it('never serves /_next/static from Cloudflare; non-Next public files stay static-asset', () => {
    expect(classifyB4ProductionPublicSlice(request('/_next/static/chunks/app.js'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
      invocation: 'vercel',
    })
    expect(classifyB4ProductionPublicSlice(request('/favicon.ico'))).toMatchObject({
      cacheClass: 'deploy-public-asset',
      invocation: 'static-asset',
      countsAgainstWorkerQuota: false,
    })
    expect(classifyB4ProductionPublicSlice(request('/images/hero.webp'))).toMatchObject({
      cacheClass: 'deploy-public-asset',
      invocation: 'static-asset',
    })
    expect(classifyB4ProductionPublicSlice(request('/home/hero.webp'))).toMatchObject({
      cacheClass: 'deploy-public-asset',
    })
    expect(classifyB4ProductionPublicSlice(request('/experience-heroes/demo.webp'))).toMatchObject({
      cacheClass: 'deploy-public-asset',
    })
    expect(classifyB4ProductionPublicSlice(request('/robots.txt'))).toMatchObject({
      cacheClass: 'control-files',
      invocation: 'static-asset',
      countsAgainstWorkerQuota: false,
    })
    expect(classifyB4ProductionPublicSlice(request('/llms.txt'))).toMatchObject({
      cacheClass: 'control-files',
      invocation: 'static-asset',
    })
    expect(B4_CACHE_POLICIES['hashed-immutable'].browserCacheControl).toContain('immutable')
    expect(B4_CACHE_POLICIES['deploy-public-asset'].browserCacheControl).not.toContain('immutable')
    expect(B4_CACHE_POLICIES['control-files'].browserCacheControl).not.toContain('immutable')
    expect(B4_CACHE_POLICIES['control-files'].purge).toMatch(/purge/i)
  })

  it('routes Next force-static HTML, sitemaps, and root to Vercel (not the CF Worker)', () => {
    for (const path of ['/en', '/en/blog', '/en/brand/warby-parker', '/sitemap.xml', '/sitemaps/core.xml', '/']) {
      expect(classifyB4ProductionPublicSlice(request(path))).toMatchObject({
        backend: 'vercel',
        invocation: 'vercel',
        cacheClass: 'none',
      })
    }
    // Approved non-Next API is the only remaining CF Worker invocation.
    expect(classifyB4ProductionPublicSlice(request('/api/health'))).toMatchObject({
      backend: 'cloudflare',
      invocation: 'worker',
      countsAgainstWorkerQuota: true,
    })
    expect(B4_OPENNEXT_ASSET_AUDIT.localeHomeHtmlInAssets).toBe(false)
    expect(B4_OPENNEXT_ASSET_AUDIT.seoHtmlInAssets).toBe(false)
    expect(B4_OPENNEXT_ASSET_AUDIT.blogHtmlInAssets).toBe(false)
    expect(B4_OPENNEXT_ASSET_AUDIT.brandHtmlInAssets).toBe(false)
    expect(B4_OPENNEXT_ASSET_AUDIT.sitemapFilesInAssets).toBe(false)
    expect(B4_OPENNEXT_ASSET_AUDIT.hashedStaticInAssets).toBe(true)
    expect(B4_OPENNEXT_ASSET_AUDIT.wranglerRunWorkerFirst).toBe(false)
  })

  it('proves locale/SEO HTML is absent from OpenNext Static Assets when the build is present', () => {
    const assetsRoot = path.join(__dirname, '../../.open-next/assets')
    if (!fs.existsSync(assetsRoot)) return
    expect(fs.existsSync(path.join(assetsRoot, 'en.html'))).toBe(false)
    expect(fs.existsSync(path.join(assetsRoot, 'en/index.html'))).toBe(false)
    expect(fs.existsSync(path.join(assetsRoot, 'en/blog/index.html'))).toBe(false)
    expect(fs.existsSync(path.join(assetsRoot, 'en/brand/warby-parker.html'))).toBe(false)
    expect(fs.existsSync(path.join(assetsRoot, 'sitemap.xml'))).toBe(false)
    expect(fs.existsSync(path.join(assetsRoot, 'robots.txt'))).toBe(true)
    expect(fs.existsSync(path.join(assetsRoot, 'llms.txt'))).toBe(true)
    expect(fs.existsSync(path.join(assetsRoot, 'favicon.ico'))).toBe(true)
    expect(fs.existsSync(path.join(assetsRoot, '_next/static'))).toBe(true)
  })

  it('keeps first-cutover manifest rows limited to NON-Next static assets and APIs', () => {
    const first = B4_PRODUCTION_PUBLIC_SLICE_MANIFEST.filter((row) => row.cutoverClass === 'first')
    // First-cutover CF rows are only non-Next static assets + approved APIs.
    expect(first.some((row) => row.cachePolicy === 'deploy-public-asset' && row.invocation === 'static-asset')).toBe(true)
    expect(first.some((row) => row.cachePolicy === 'control-files' && row.invocation === 'static-asset')).toBe(true)
    expect(first.every((row) => row.backend === 'cloudflare')).toBe(true)
    // Next HTML / RSC / /_next/static are NOT first-cutover CF rows anymore.
    expect(first.some((row) => row.cachePolicy === 'hashed-immutable')).toBe(false)
    expect(first.some((row) => row.cachePolicy === 'deploy-static-html')).toBe(false)
    expect(first.some((row) => row.cachePolicy === 'root-locale-detect')).toBe(false)
    // The /_next/static manifest row must be Vercel-owned.
    const staticRow = B4_PRODUCTION_PUBLIC_SLICE_MANIFEST.find((row) => row.route === '/_next/static/*')
    expect(staticRow?.backend).toBe('vercel')
    expect(first.every((row) => row.cachePolicy !== ('immutable-static' as typeof row.cachePolicy))).toBe(true)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../cloudflare-router/b4-production-public-slice.manifest.json') as {
      runWorkerFirst: boolean
      workersCachingQuotaOffload: boolean
      quotaModel: string
    }
    expect(manifest.runWorkerFirst).toBe(false)
    expect(manifest.workersCachingQuotaOffload).toBe(false)
    expect(manifest.quotaModel).toBe('static-assets-without-worker-invocation')
  })
})

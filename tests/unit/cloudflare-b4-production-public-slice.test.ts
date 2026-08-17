/** @jest-environment node */

import {
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

  it('routes the high-frequency static/public families to Cloudflare', () => {
    const cfReady: Array<[string, string]> = [
      ['GET', '/'],
      ['HEAD', '/en'],
      ['GET', '/id'],
      ['GET', '/en/face-shape-detector'],
      ['GET', '/en/blog'],
      ['GET', '/en/blog/how-to-choose-glasses-for-your-face'],
      ['GET', '/en/brand/warby-parker'],
      ['GET', '/en/store'],
      ['GET', '/en/glasses-guide/round-face-cat-eye'],
      ['GET', '/en/face-shapes/oval'],
      ['GET', '/en/style/round-face'],
      ['GET', '/en/try-on/glasses'],
      ['GET', '/face-shape-detector'],
      ['GET', '/brand/warby-parker'],
      ['GET', '/_next/static/chunks/app.js'],
      ['GET', '/favicon.ico'],
      ['GET', '/robots.txt'],
      ['GET', '/sitemap.xml'],
      ['GET', '/sitemaps/core.xml'],
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
    const cookieRequest = request('/en/brand/warby-parker', 'GET', {
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
    expect(classifyB4ProductionPublicSlice(request('/en/brand/warby-parker'))).toMatchObject({
      backend: 'cloudflare',
      routeClass: 'cf-ready',
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
})

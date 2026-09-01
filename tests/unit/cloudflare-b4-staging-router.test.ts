/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import {
  b4Layer,
  classifyStagingPublicSlice,
  fallbackRequest,
  rewriteFallbackLocation,
  routerLogFields,
  sanitizeRouteTemplate,
  withB4RouterHeaders,
} from '../../cloudflare-router/b4-staging-router'
import { classify } from '../../cloudflare-router/worker'

const EdgeRequest = (() => {
  const runtimeGlobals = globalThis as unknown as {
    setImmediate?: (...args: unknown[]) => unknown
  }
  runtimeGlobals.setImmediate ??= ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    return setTimeout(callback, 0, ...args)
  }) as unknown as (...args: unknown[]) => unknown
  const primitives = require('next/dist/compiled/@edge-runtime/primitives') as {
    Request: typeof Request
    Response: typeof Response
    Headers: typeof Headers
  }
  Object.assign(globalThis, {
    Request: primitives.Request,
    Response: primitives.Response,
    Headers: primitives.Headers,
  })
  return primitives.Request
})()

function request(path: string, method = 'GET', headers?: Record<string, string>) {
  return {
    url: `https://visutry-cf-staging.sunye.workers.dev${path}`,
    method,
    headers: {
      get(name: string) {
        if (!headers) return null
        return headers[name.toLowerCase()] ?? headers[name] ?? null
      },
    },
  } as Request
}

describe('B4.2A staging public slice router', () => {
  it('keeps wrangler asset-first: run_worker_first is false', () => {
    const wranglerPath = path.join(__dirname, '../../wrangler.jsonc')
    const text = fs.readFileSync(wranglerPath, 'utf8')
    expect(text).toMatch(/"run_worker_first"\s*:\s*false/)
    expect(text).not.toMatch(/"run_worker_first"\s*:\s*true/)
    expect(text).toMatch(/"not_found_handling"\s*:\s*"none"/)
    expect(text).toMatch(/"directory"\s*:\s*"\.open-next\/assets"/)
    expect(text).not.toMatch(/"custom_domain"\s*:\s*true/)
    expect(text).not.toMatch(/www\.visutry\.com\/\*/)
    expect(text).toMatch(/"PUBLIC_HOST": "www.visutry.com"/)
    expect(text).toMatch(/"VERCEL_ORIGIN": "https:\/\/visutry\.vercel\.app"/)
    expect(text).toMatch(/"workers_dev": true/)
  })

  it('classifies NON-Next Layer 1 families as static-asset (Worker should not see them when assets hit)', () => {
    for (const pathName of [
      '/favicon.ico',
      '/images/hero.webp',
      '/home/hero.webp',
      '/experience-heroes/demo.webp',
      '/blog-covers/cover.jpg',
      '/assets/logo.png',
      '/robots.txt',
      '/llms.txt',
    ]) {
      const decision = classifyStagingPublicSlice(request(pathName))
      expect(decision).toMatchObject({
        invocation: 'static-asset',
        countsAgainstWorkerQuota: false,
      })
      expect(b4Layer(decision)).toBe('layer1-static-asset')
    }
  })

  it('sends the Next client artifact graph (/_next/static) to Vercel, never Cloudflare', () => {
    for (const pathName of ['/_next/static/chunks/app.js', '/_next/static/css/app.css']) {
      const decision = classifyStagingPublicSlice(request(pathName))
      expect(decision.backend).toBe('vercel')
      expect(decision.routeClass).toBe('vercel-required')
      expect(b4Layer(decision)).toBe('layer3-vercel')
    }
  })

  it('classifies ONLY approved non-Next APIs as Cloudflare Worker (no Next HTML)', () => {
    const layer2: Array<[string, string, string]> = [['GET', '/api/health', 'health']]
    for (const [method, pathName, cacheClass] of layer2) {
      const decision = classifyStagingPublicSlice(request(pathName, method))
      expect(decision).toMatchObject({
        backend: 'cloudflare',
        routeClass: 'cf-ready',
        cacheClass,
        invocation: 'worker',
        countsAgainstWorkerQuota: true,
      })
      expect(b4Layer(decision)).toBe('layer2-worker')
    }
  })

  it('routes ALL Next HTML / redirects / sitemaps to Vercel (single Next frontend owner)', () => {
    const nextHtml: string[] = [
      '/',
      '/en',
      '/en/brand/warby-parker',
      '/en/blog',
      '/en/store',
      '/en/face-shapes/oval',
      '/en/glasses-guide/round-face-cat-eye',
      '/en/try-on/glasses',
      '/en/face-analysis',
      '/blog',
      '/sitemap.xml',
    ]
    for (const pathName of nextHtml) {
      const decision = classifyStagingPublicSlice(request(pathName))
      expect(decision.backend).toBe('vercel')
      expect(decision.routeClass).toBe('vercel-required')
      expect(b4Layer(decision)).toBe('layer3-vercel')
    }
  })

  it('keeps Layer 3 deferred, unknown, auth, writes, and image optimization on Vercel', () => {
    const layer3: Array<[string, string]> = [
      ['GET', '/api/glasses/brands'],
      ['GET', '/api/glasses/categories'],
      ['GET', '/api/glasses/face-shapes'],
      ['GET', '/en/store/luna-optical'],
      ['GET', '/en/c/luna-optical/petite-fit'],
      ['GET', '/en/category/test'],
      ['GET', '/en/try/test'],
      ['GET', '/sitemaps/dynamic.xml'],
      ['GET', '/_next/image'],
      ['GET', '/api/glasses/frames'],
      ['GET', '/api/unknown-capability'],
      ['POST', '/api/unknown-write'],
      ['POST', '/en'],
      ['GET', '/api/auth/session'],
      ['POST', '/api/merchant/workspaces'],
      ['POST', '/api/face-analysis/submit'],
    ]
    for (const [method, pathName] of layer3) {
      const decision = classifyStagingPublicSlice(request(pathName, method))
      expect(decision.backend).toBe('vercel')
      if (pathName.startsWith('/api/glasses/')) expect(decision.routeClass).toBe('vercel-required')
      expect(b4Layer(decision)).toBe('layer3-vercel')
      expect(decision.countsAgainstWorkerQuota).toBe(true)
    }
  })

  it('does not change the live B3.2 classify() graph', () => {
    expect(classify(request('/en/brand/warby-parker'))).toMatchObject({
      backend: 'vercel',
      routeClass: 'unknown-fallback',
    })
    expect(classify(request('/api/auth/session'))).toMatchObject({
      backend: 'cloudflare',
      routeClass: 'cf-ready',
    })
    // Post-cutover: the B4 classifier routes marketing HTML to Vercel too.
    expect(classifyStagingPublicSlice(request('/en/brand/warby-parker')).backend).toBe('vercel')
    expect(classifyStagingPublicSlice(request('/api/auth/session')).backend).toBe('vercel')
  })

  it('forwards host, query, Cookie, and Authorization to Vercel without trusting a loop host', async () => {
    const forwarded = fallbackRequest(
      new EdgeRequest('https://visutry-cf-staging.sunye.workers.dev/api/unknown-write?probe=1', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
          cookie: 'next-auth.session-token=test-cookie',
          'x-user-id': 'client-supplied-value',
        },
        body: JSON.stringify({ value: 'body-preserved' }),
      }),
      'https://visutry.vercel.app',
    )

    expect(forwarded.url).toBe('https://visutry.vercel.app/api/unknown-write?probe=1')
    expect(forwarded.method).toBe('POST')
    expect(forwarded.redirect).toBe('manual')
    expect(forwarded.headers.get('host')).toBe('visutry.vercel.app')
    expect(forwarded.headers.get('x-forwarded-host')).toBe('visutry-cf-staging.sunye.workers.dev')
    expect(forwarded.headers.get('x-forwarded-proto')).toBe('https')
    expect(forwarded.headers.get('authorization')).toBe('Bearer test-token')
    expect(forwarded.headers.get('cookie')).toBe('next-auth.session-token=test-cookie')
    await expect(forwarded.text()).resolves.toBe(JSON.stringify({ value: 'body-preserved' }))
  })

  it('rewrites vercel.app Location back to the public host and never logs secrets', () => {
    const productionOrigin = rewriteFallbackLocation(
      new Response(null, {
        status: 308,
        headers: { location: 'https://visutry.vercel.app/en/blog' },
      }),
      'https://visutry.vercel.app',
      'visutry-cf-staging.sunye.workers.dev',
    )
    expect(productionOrigin.headers.get('location')).toBe(
      'https://visutry-cf-staging.sunye.workers.dev/en/blog',
    )

    const previewLeak = rewriteFallbackLocation(
      new Response(null, {
        status: 308,
        headers: { location: 'https://visutry-pre.vercel.app//en' },
      }),
      'https://visutry-3v81kow8o-sunye.vercel.app',
      'visutry-cf-staging.sunye.workers.dev',
    )
    expect(previewLeak.headers.get('location')).toBe(
      'https://visutry-cf-staging.sunye.workers.dev/en',
    )

    const decision = classifyB4ProductionPublicSlice(request('/en/brand/warby-parker'))
    const log = routerLogFields(
      request('/en/brand/warby-parker', 'GET', { authorization: 'Bearer secret', cookie: 'session=1' }),
      decision,
      200,
      12,
    )
    const serialized = JSON.stringify(log)
    expect(serialized).not.toMatch(/Bearer secret|session=1|cookie|authorization/i)
    expect(log.route).toBe('/:locale/brand/:brand')
    // Marketing HTML is now Vercel-owned → Layer 3.
    expect(log.layer).toBe('layer3-vercel')
    expect(sanitizeRouteTemplate('/_next/static/chunks/app.js')).toBe('/_next/static/*')
  })

  it('annotates router headers and treats CF/Vercel failures as fail-closed (no retry)', () => {
    // Approved non-Next API stays a Cloudflare Worker route.
    const decision = classifyStagingPublicSlice(request('/api/health'))
    const headed = withB4RouterHeaders(new Response('ok', { status: 200 }), decision, 9)
    expect(headed.headers.get('x-visutry-router-layer')).toBe('layer2-worker')
    expect(headed.headers.get('x-visutry-router-backend')).toBe('cloudflare')

    const vercelDecision = classifyStagingPublicSlice(request('/api/unknown-write', 'POST'))
    expect(vercelDecision.backend).toBe('vercel')
    const fields = routerLogFields(request('/api/unknown-write', 'POST'), vercelDecision, 502, 4, 'TypeError')
    expect(fields.error).toBe('TypeError')
    expect(fields.layer).toBe('layer3-vercel')

    const workerSource = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/app-host-worker.ts'), 'utf8')
    expect(workerSource).not.toMatch(/retry|fallbackRequest\(.*\).*fallbackRequest/i)
    expect(workerSource.match(/await fetch\(fallbackRequest/g)).toHaveLength(1)
    expect(workerSource.match(/appWorker\.fetch/g)).toHaveLength(1)
    expect(workerSource.indexOf('handleApprovedEdgeApi')).toBeGreaterThan(-1)
    expect(workerSource.indexOf('handleApprovedEdgeApi')).toBeLessThan(workerSource.indexOf('appWorker.fetch'))
  })

  it('redacts secrets from Worker exception logs and resolves OpenNext default export', () => {
    const { sanitizeWorkerException, resolveOpenNextAppWorker } = require('../../cloudflare-router/b4-staging-router') as typeof import('../../cloudflare-router/b4-staging-router')
    const leaked = sanitizeWorkerException(new Error('connect postgresql://user:secret@host/db Bearer abc.def cookie=session=1'))
    expect(leaked.errorClass).toBe('Error')
    expect(leaked.errorDetail).toContain('[redacted-db]')
    expect(leaked.errorDetail).not.toMatch(/secret|abc\.def|session=1/i)

    const fetchFn = async () => new Response('ok')
    expect(resolveOpenNextAppWorker({ fetch: fetchFn }).fetch).toBe(fetchFn)
    expect(resolveOpenNextAppWorker({ default: { fetch: fetchFn } }).fetch).toBe(fetchFn)
    expect(() => resolveOpenNextAppWorker({})).toThrow(/missing fetch/)
  })
})

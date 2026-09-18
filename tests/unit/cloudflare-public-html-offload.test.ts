/** @jest-environment node */

import {
  handlePublicHtmlOffload,
  isCacheablePublicHtmlResponse,
  isPublicHtmlOffloadEligible,
  isPublicHtmlOffloadPath,
  PUBLIC_HTML_OFFLOAD_CACHE_CLASS,
  PUBLIC_HTML_OFFLOAD_PURGE_URLS,
} from '../../cloudflare-router/public-html-offload'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import {
  generateB4ProductionWorkerRoutes,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'

const TARGET = '/en/blog/ai-face-analysis-for-glasses-guide'

function request(path = TARGET, method = 'GET', headers: Record<string, string> = {}) {
  return new Request(`https://www.visutry.com${path}`, { method, headers })
}

function createCache() {
  const entries = new Map<string, Response>()
  const cache = {
    match: jest.fn(async (key: Request) => entries.get(key.url)),
    put: jest.fn(async (key: Request, response: Response) => {
      entries.set(key.url, response)
    }),
  }
  return { cache, entries }
}

async function runWithOrigin(
  origin: Response,
  input = request(),
) {
  const { cache } = createCache()
  const pending: Promise<unknown>[] = []
  const result = await handlePublicHtmlOffload(input, {
    cache,
    fetchOrigin: jest.fn(async () => origin.clone()),
    waitUntil: (promise) => pending.push(promise),
  })
  await Promise.all(pending)
  return { result, cache }
}

describe('public HTML offload allowlist and cache safety', () => {
  it('enables only the corrected exact English blog route', () => {
    expect(isPublicHtmlOffloadPath(TARGET)).toBe(true)
    expect(isPublicHtmlOffloadPath('/en/what-glasses-suit-my-face')).toBe(false)
    expect(isPublicHtmlOffloadPath('/en')).toBe(false)
    expect(isPublicHtmlOffloadPath('/en/brand/gentle-monster')).toBe(false)
    expect(isPublicHtmlOffloadPath('/en/face-shape-detector')).toBe(false)
    expect(isPublicHtmlOffloadPath('/en/face-analysis')).toBe(false)
    expect(isPublicHtmlOffloadPath('/en/try-on/glasses')).toBe(false)
    expect(isPublicHtmlOffloadPath('/id/blog/ai-face-analysis-for-glasses-guide')).toBe(false)
    expect(isPublicHtmlOffloadPath(`${TARGET}/`)).toBe(false)
    expect(isPublicHtmlOffloadPath('/_next/static/chunks/app.js')).toBe(false)
    expect(PUBLIC_HTML_OFFLOAD_PURGE_URLS).toEqual([`https://www.visutry.com${TARGET}`])
  })

  it('classifies the target as public HTML offload and all named neighbours to Vercel', () => {
    expect(classifyB4ProductionPublicSlice(request())).toMatchObject({
      backend: 'cloudflare',
      routeClass: 'public-html-offload',
      cacheClass: PUBLIC_HTML_OFFLOAD_CACHE_CLASS,
      invocation: 'worker',
    })
    expect(classifyB4ProductionPublicSlice(request(TARGET, 'GET', { cookie: 'session=1' }))).toMatchObject({
      backend: 'vercel',
      routeClass: 'public-html-offload',
      cacheClass: PUBLIC_HTML_OFFLOAD_CACHE_CLASS,
    })
    for (const path of [
      '/en/what-glasses-suit-my-face',
      '/en',
      '/en/brand/gentle-monster',
      '/en/face-shape-detector',
      '/en/face-analysis',
      '/en/try-on/glasses',
      '/id/blog/ai-face-analysis-for-glasses-guide',
      '/_next/static/chunks/app.js',
      '/_next/image',
    ]) {
      expect(classifyB4ProductionPublicSlice(request(path)).backend).toBe('vercel')
    }
    expect(classifyB4ProductionPublicSlice(request(`${TARGET}?_rsc=1`))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
    })
  })

  it('keeps the Worker route set exact with no wildcard HTML route', () => {
    const routes = generateB4ProductionWorkerRoutes()
    expect(routes).toHaveLength(13)
    expect(wwwWorkerRouteMatch(TARGET, '', routes)?.pattern).toBe(`www.visutry.com${TARGET}`)
    expect(wwwWorkerRouteMatch(`${TARGET}/child`, '', routes)).toBeNull()
    expect(routes.some((route) => route.pattern === 'www.visutry.com/*')).toBe(false)
    expect(routes.some((route) => route.pattern.includes('/_next/'))).toBe(false)
  })

  it('rejects RSC, _rsc, auth, preview, personalized, non-document, and query variants', () => {
    const unsafe = [
      request(TARGET, 'GET', { rsc: '1' }),
      request(`${TARGET}?_rsc=abc`),
      request(TARGET, 'GET', { authorization: 'Bearer token' }),
      request(TARGET, 'GET', { cookie: 'next-auth.session-token=token' }),
      request(TARGET, 'GET', { 'x-preview': '1' }),
      request(TARGET, 'GET', { 'x-personalized': '1' }),
      request(TARGET, 'GET', { 'sec-fetch-dest': 'empty' }),
      request(TARGET, 'GET', { accept: 'text/x-component' }),
      request(TARGET, 'POST'),
    ]
    for (const input of unsafe) expect(isPublicHtmlOffloadEligible(input)).toBe(false)
    expect(isPublicHtmlOffloadEligible(request())).toBe(true)
    expect(isPublicHtmlOffloadEligible(request(TARGET, 'HEAD'))).toBe(true)
  })

  it('fetches and stores a safe HTML response on MISS, then serves HIT without origin', async () => {
    const { cache } = createCache()
    const pending: Promise<unknown>[] = []
    const origin = jest.fn(async () => new Response('<html>ok</html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }))
    const first = await handlePublicHtmlOffload(request(), {
      cache,
      fetchOrigin: origin,
      waitUntil: (promise) => pending.push(promise),
    })
    expect(first.status).toBe('MISS')
    expect(first.response.headers.get('x-visutry-edge-cache')).toBe('MISS')
    await expect(first.response.text()).resolves.toBe('<html>ok</html>')
    await Promise.all(pending)
    expect(cache.put).toHaveBeenCalledTimes(1)

    const second = await handlePublicHtmlOffload(request(), {
      cache,
      fetchOrigin: origin,
    })
    expect(second.status).toBe('HIT')
    expect(second.response.headers.get('x-visutry-edge-cache')).toBe('HIT')
    await expect(second.response.text()).resolves.toBe('<html>ok</html>')
    expect(origin).toHaveBeenCalledTimes(1)
  })

  it('bypasses and never stores redirects, errors, JSON, or Set-Cookie responses', async () => {
    for (const originResponse of [
      new Response(null, { status: 302, headers: { location: '/en' } }),
      new Response('error', { status: 500, headers: { 'content-type': 'text/html' } }),
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      new Response('<html>private</html>', { status: 200, headers: { 'content-type': 'text/html', 'set-cookie': 'preview=1' } }),
    ]) {
      const { result, cache } = await runWithOrigin(originResponse)
      expect(result.status).toBe('BYPASS')
      expect(result.response.headers.get('x-visutry-edge-cache')).toBe('BYPASS')
      expect(cache.put).not.toHaveBeenCalled()
    }
  })

  it('fails open for unsafe requests and preserves the origin response', async () => {
    const { cache } = createCache()
    const origin = jest.fn(async () => new Response('<html>session</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }))
    const result = await handlePublicHtmlOffload(request(TARGET, 'GET', { cookie: 'session=1' }), {
      cache,
      fetchOrigin: origin,
    })
    expect(result.status).toBe('BYPASS')
    expect(result.response.headers.get('x-visutry-edge-cache')).toBe('BYPASS')
    expect(origin).toHaveBeenCalledTimes(1)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('defines the safe response boundary independently of the request path', () => {
    expect(isCacheablePublicHtmlResponse(new Response('<html />', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }))).toBe(true)
    expect(isCacheablePublicHtmlResponse(new Response('<html />', {
      status: 200,
      headers: { 'content-type': 'text/html', 'cache-control': 'private' },
    }))).toBe(false)
  })
})

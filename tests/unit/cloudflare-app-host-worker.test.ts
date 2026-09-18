/** @jest-environment node */

import worker from '../../cloudflare-router/app-host-worker'
import type { PublicHtmlOffloadCache } from '../../cloudflare-router/public-html-offload'

const TARGET = '/en/blog/ai-face-analysis-for-glasses-guide'

function memoryCache(): PublicHtmlOffloadCache {
  const entries = new Map<string, Response>()
  return {
    async match(key) {
      return entries.get(key.url)?.clone()
    },
    async put(key, response) {
      entries.set(key.url, response.clone())
    },
  }
}

function env(routerEnv = 'production') {
  return {
    ROUTER_ENV: routerEnv,
    VERCEL_ORIGIN: 'https://visutry.vercel.app',
    PUBLIC_HOST: 'www.visutry.com',
    ASSETS: { fetch: jest.fn(async () => new Response('asset', { status: 200 })) },
  }
}

describe('production traffic-layer exact public HTML offload', () => {
  const originalFetch = globalThis.fetch
  const originalCaches = (globalThis as unknown as { caches?: unknown }).caches

  afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalCaches === undefined) {
      delete (globalThis as unknown as { caches?: unknown }).caches
    } else {
      ;(globalThis as unknown as { caches?: unknown }).caches = originalCaches
    }
    jest.restoreAllMocks()
  })

  it('serves the corrected target as MISS then HIT without a second Vercel fetch', async () => {
    const cache = memoryCache()
    ;(globalThis as unknown as { caches: { default: PublicHtmlOffloadCache } }).caches = { default: cache }
    const origin = jest.fn(async () => new Response('<html><h1>origin</h1></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }))
    globalThis.fetch = origin as typeof fetch
    const waitUntilPromises: Promise<unknown>[] = []
    const context = {
      waitUntil: (promise: Promise<unknown>) => waitUntilPromises.push(promise),
      passThroughOnException: jest.fn(),
    }
    const productionEnv = env()

    const first = await worker.fetch(new Request(`https://www.visutry.com${TARGET}`), productionEnv, context)
    await Promise.all(waitUntilPromises)
    const second = await worker.fetch(new Request(`https://www.visutry.com${TARGET}`), productionEnv, context)

    expect(first.status).toBe(200)
    expect(first.headers.get('x-visutry-edge-cache')).toBe('MISS')
    expect(first.headers.get('x-visutry-router-backend')).toBe('cloudflare')
    expect(first.headers.get('x-visutry-router-class')).toBe('public-html-offload')
    expect(first.headers.get('x-visutry-router-layer')).toBe('layer2-worker')
    expect(second.headers.get('x-visutry-edge-cache')).toBe('HIT')
    await expect(second.text()).resolves.toContain('<h1>origin</h1>')
    expect(origin).toHaveBeenCalledTimes(1)
    expect(productionEnv.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('keeps other HTML on Vercel, bypasses unsafe target requests, and keeps staging on Vercel', async () => {
    const cache = memoryCache()
    ;(globalThis as unknown as { caches: { default: PublicHtmlOffloadCache } }).caches = { default: cache }
    const origin = jest.fn(async (input: Request) => new Response(`<html>${new URL(input.url).pathname}</html>`, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }))
    globalThis.fetch = origin as typeof fetch
    const context = { waitUntil: jest.fn(), passThroughOnException: jest.fn() }
    const productionEnv = env()

    const otherPage = await worker.fetch(new Request('https://www.visutry.com/en/face-shape-detector'), productionEnv, context)
    const unsafeTarget = await worker.fetch(new Request(`https://www.visutry.com${TARGET}`, {
      headers: { cookie: 'next-auth.session-token=present' },
    }), productionEnv, context)
    const stagingTarget = await worker.fetch(new Request(`https://www.visutry.com${TARGET}`), env('staging'), context)

    expect(otherPage.headers.get('x-visutry-router-backend')).toBe('vercel')
    expect(otherPage.headers.get('x-visutry-edge-cache')).toBeNull()
    expect(unsafeTarget.headers.get('x-visutry-router-backend')).toBe('vercel')
    expect(unsafeTarget.headers.get('x-visutry-edge-cache')).toBe('BYPASS')
    expect(stagingTarget.headers.get('x-visutry-router-backend')).toBe('vercel')
    expect(stagingTarget.headers.get('x-visutry-edge-cache')).toBeNull()
    expect(origin).toHaveBeenCalledTimes(3)
  })
})

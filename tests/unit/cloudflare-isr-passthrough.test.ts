import fs from 'fs'
import path from 'path'
import {
  buildSafeTelemetryRecord,
  telemetryRecordContainsForbiddenData,
} from '../../cloudflare-router/telemetry'
import {
  PASSTHROUGH_WORKER_NAME,
  STABLE_VERCEL_ORIGIN,
  classifyInstrumentedSeoPath,
  cloudflareRoutePatterns,
  isSafeVercelOrigin,
  parsePassthroughStage,
  passthroughOriginRequest,
  rewritePublicLocation,
  shouldInstrumentRequest,
} from '../../cloudflare-router/isr-passthrough'
import worker from '../../cloudflare-router/isr-passthrough-worker'

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

describe('ISR production Vercel pass-through matcher', () => {
  it('instruments locale glasses-guide GET/HEAD in Stage 1', () => {
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/glasses-guide/foo', stage: 1 })).toBe(true)
    expect(shouldInstrumentRequest({ method: 'HEAD', pathname: '/de/glasses-guide/foo', stage: 1 })).toBe(true)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/glasses-guide', stage: 1 })).toBe(true)
    expect(classifyInstrumentedSeoPath('/en/glasses-guide/foo', 1)).toMatchObject({
      instrumented: true,
      stage: 1,
      family: 'glasses-guide',
      locale: 'en',
    })
  })

  it('keeps style on Stage 2 only', () => {
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/style/round-face', stage: 1 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/style/round-face', stage: 2 })).toBe(true)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/blog/how-to', stage: 1 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/blog/how-to', stage: 2 })).toBe(true)
  })

  it('excludes APIs, Store, Campaign, and POST', () => {
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/api/foo', stage: 2 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/store/foo', stage: 2 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/c/foo/bar', stage: 2 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'POST', pathname: '/en/glasses-guide/foo', stage: 1 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/en/dashboard', stage: 2 })).toBe(false)
    expect(shouldInstrumentRequest({ method: 'GET', pathname: '/admin/users', stage: 2 })).toBe(false)
  })

  it('does not use catch-all locale or site-wide patterns', () => {
    const stage1 = cloudflareRoutePatterns(1)
    expect(stage1).toContain('www.visutry.com/en/glasses-guide')
    expect(stage1).toContain('www.visutry.com/en/glasses-guide/*')
    expect(stage1).toContain('www.visutry.com/de/glasses-guide/*')
    expect(stage1).not.toContain('www.visutry.com/*')
    expect(stage1.some((pattern) => pattern === 'www.visutry.com/en/*')).toBe(false)
    expect(stage1.some((pattern) => pattern.includes('/style/'))).toBe(false)
    expect(cloudflareRoutePatterns(2).some((pattern) => pattern.includes('/en/style/*'))).toBe(true)
  })

  it('accepts only stable vercel.app origins and rejects www / OpenNext', () => {
    expect(isSafeVercelOrigin(STABLE_VERCEL_ORIGIN)).toBe(true)
    expect(isSafeVercelOrigin('https://visutry-git-main-sunye.vercel.app')).toBe(true)
    expect(isSafeVercelOrigin('https://www.visutry.com')).toBe(false)
    expect(isSafeVercelOrigin('https://visutry.com')).toBe(false)
    expect(isSafeVercelOrigin('https://visutry-cf-production.sunye.workers.dev')).toBe(false)
    expect(parsePassthroughStage(undefined)).toBe(1)
    expect(parsePassthroughStage('2')).toBe(2)
  })
})

describe('ISR production Vercel pass-through request/response', () => {
  it('preserves query string including _rsc and only rewrites Host', () => {
    const forwarded = passthroughOriginRequest(
      new EdgeRequest(
        'https://www.visutry.com/en/glasses-guide/foo?_rsc=payload&sourcePage=homepage-cta&source_page=secret-source',
        {
          method: 'GET',
          headers: {
            accept: 'text/x-component',
            rsc: '1',
            'next-router-prefetch': '1',
            'user-agent': 'Mozilla/5.0 Chrome/126.0.0.0',
            authorization: 'Bearer secret-auth-token',
            cookie: 'next-auth.session-token=secret-cookie',
          },
        },
      ),
      STABLE_VERCEL_ORIGIN,
    )

    expect(forwarded.url).toBe(
      'https://visutry.vercel.app/en/glasses-guide/foo?_rsc=payload&sourcePage=homepage-cta&source_page=secret-source',
    )
    expect(forwarded.method).toBe('GET')
    expect(forwarded.headers.get('host')).toBe('visutry.vercel.app')
    expect(forwarded.headers.get('rsc')).toBe('1')
    expect(forwarded.headers.get('next-router-prefetch')).toBe('1')
    expect(forwarded.headers.get('accept')).toBe('text/x-component')
    expect(forwarded.headers.get('user-agent')).toBe('Mozilla/5.0 Chrome/126.0.0.0')
    expect(forwarded.headers.get('authorization')).toBe('Bearer secret-auth-token')
    expect(forwarded.headers.get('cookie')).toBe('next-auth.session-token=secret-cookie')
    expect(forwarded.redirect).toBe('manual')
  })

  it('does not persist query values, cookies, or authorization in telemetry', () => {
    const request = new EdgeRequest(
      'https://www.visutry.com/en/glasses-guide/foo?_rsc=payload&sourcePage=homepage-cta&source_page=secret-source&token=super-secret-token',
      {
        headers: {
          accept: 'text/html',
          authorization: 'Bearer secret-auth-token',
          cookie: 'next-auth.session-token=secret-cookie',
          'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'cf-connecting-ip': '203.0.113.44',
        },
      },
    )
    const response = new Response('ok', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-vercel-cache': 'PRERENDER',
        'x-matched-path': '/en/glasses-guide/[slug]',
      },
    })
    const record = buildSafeTelemetryRecord({
      request,
      response,
      routeClass: 'vercel-passthrough',
      latencyMs: 12,
    })
    expect(telemetryRecordContainsForbiddenData(record, request.url, request.headers)).toEqual([])
    const serialized = JSON.stringify(record)
    expect(serialized).not.toContain('payload')
    expect(serialized).not.toContain('homepage-cta')
    expect(serialized).not.toContain('secret-source')
    expect(serialized).not.toContain('super-secret-token')
    expect(serialized).not.toContain('secret-auth-token')
    expect(serialized).not.toContain('secret-cookie')
    expect(serialized).not.toContain('203.0.113.44')
  })

  it('rewrites absolute vercel.app Location back to the public host and leaves relative redirects', () => {
    const relative = rewritePublicLocation(
      new Response(null, { status: 308, headers: { location: '/en/glasses-guide' } }),
      STABLE_VERCEL_ORIGIN,
      'www.visutry.com',
    )
    expect(relative.status).toBe(308)
    expect(relative.headers.get('location')).toBe('/en/glasses-guide')

    const absolute = rewritePublicLocation(
      new Response(null, { status: 302, headers: { location: 'https://visutry.vercel.app/en/glasses-guide' } }),
      STABLE_VERCEL_ORIGIN,
      'www.visutry.com',
    )
    expect(absolute.status).toBe(302)
    expect(absolute.headers.get('location')).toBe('https://www.visutry.com/en/glasses-guide')
  })
})

describe('ISR production Vercel pass-through worker', () => {
  const env = {
    VERCEL_ORIGIN: STABLE_VERCEL_ORIGIN,
    PUBLIC_HOST: 'www.visutry.com',
    ISR_PASSTHROUGH_STAGE: '1',
    ISR_TELEMETRY_ENABLED: 'true',
  }

  it('forwards glasses-guide HTML to Vercel and preserves application semantics', async () => {
    const previousFetch = globalThis.fetch
    const fetchSpy = jest.fn().mockResolvedValue(new Response('<html>ok</html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch',
        'x-matched-path': '/en/glasses-guide/foo',
        'x-vercel-cache': 'PRERENDER',
      },
    }))
    globalThis.fetch = fetchSpy as typeof fetch
    try {
      const response = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/foo', { headers: { accept: 'text/html' } }),
        env,
      )

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const forwarded = fetchSpy.mock.calls[0]?.[0] as Request
      expect(forwarded.url).toBe('https://visutry.vercel.app/en/glasses-guide/foo')
      expect(new URL(forwarded.url).host).not.toBe('www.visutry.com')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
      expect(response.headers.get('vary')).toBe('RSC, Next-Router-State-Tree, Next-Router-Prefetch')
      expect(response.headers.get('x-matched-path')).toBe('/en/glasses-guide/foo')
      expect(response.headers.get('x-vercel-cache')).toBe('PRERENDER')
      expect(response.headers.get('x-visutry-router-backend')).toBeNull()
      expect(await response.text()).toBe('<html>ok</html>')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('preserves RSC query, 404, and redirects', async () => {
    const previousFetch = globalThis.fetch
    const fetchSpy = jest.fn()
      .mockResolvedValueOnce(new Response('rsc', {
        status: 200,
        headers: { 'content-type': 'text/x-component', 'x-vercel-cache': 'HIT' },
      }))
      .mockResolvedValueOnce(new Response('missing', {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8', 'x-matched-path': '/404' },
      }))
      .mockResolvedValueOnce(new Response('redirect', {
        status: 308,
        headers: { location: '/en/glasses-guide', 'cache-control': 'public, max-age=0, must-revalidate' },
      }))
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: 'https://visutry.vercel.app/en/glasses-guide/foo' },
      }))
    globalThis.fetch = fetchSpy as typeof fetch
    try {
      const rsc = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/foo?_rsc=payload', {
          headers: { rsc: '1', accept: 'text/x-component' },
        }),
        env,
      )
      expect(rsc.status).toBe(200)
      expect(rsc.headers.get('content-type')).toBe('text/x-component')
      expect((fetchSpy.mock.calls[0]?.[0] as Request).url).toContain('_rsc=payload')

      const missing = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/does-not-exist'),
        env,
      )
      expect(missing.status).toBe(404)
      expect(missing.headers.get('x-matched-path')).toBe('/404')

      const slash = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/'),
        env,
      )
      expect(slash.status).toBe(308)
      expect(slash.headers.get('location')).toBe('/en/glasses-guide')

      const found = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/foo'),
        env,
      )
      expect(found.status).toBe(302)
      expect(found.headers.get('location')).toBe('https://www.visutry.com/en/glasses-guide/foo')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('does not break the Vercel response when telemetry throws', async () => {
    const previousFetch = globalThis.fetch
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('body-ok', {
      status: 200,
      headers: { 'content-type': 'text/html', 'x-vercel-cache': 'MISS' },
    })) as typeof fetch
    try {
      const response = await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/foo', { headers: { accept: 'text/html' } }),
        {
          ...env,
          ISR_TELEMETRY: {
            writeDataPoint() {
              throw new Error('ae-offline')
            },
          },
        },
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe('body-ok')
      expect(response.headers.get('x-vercel-cache')).toBe('MISS')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('still fetches Vercel for excluded POST / API / Store paths if they hit the Worker', async () => {
    const previousFetch = globalThis.fetch
    const fetchSpy = jest.fn().mockResolvedValue(new Response('ok', { status: 405 }))
    globalThis.fetch = fetchSpy as typeof fetch
    try {
      await worker.fetch(
        new EdgeRequest('https://www.visutry.com/en/glasses-guide/foo', { method: 'POST', body: '{}' }),
        env,
      )
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect((fetchSpy.mock.calls[0]?.[0] as Request).url).toBe('https://visutry.vercel.app/en/glasses-guide/foo')
      expect((fetchSpy.mock.calls[0]?.[0] as Request).method).toBe('POST')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('never imports OpenNext and never lists www routes in wrangler', () => {
    const workerSource = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/isr-passthrough-worker.ts'), 'utf8')
    const wrangler = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/isr-passthrough.wrangler.jsonc'), 'utf8')
    expect(workerSource).not.toMatch(/open-next/)
    expect(workerSource).not.toMatch(/app-host-worker/)
    expect(wrangler).not.toMatch(/"name":\s*"visutry-cf-production"/)
    expect(wrangler).not.toMatch(/"service":/)
    expect(wrangler).not.toMatch(/"custom_domain"/)
    expect(wrangler).not.toMatch(/"routes"/)
    expect(wrangler).not.toMatch(/www\.visutry\.com\//)
    expect(wrangler).not.toMatch(/cacheEverything|cacheTtl/)
    expect(wrangler).toMatch(/"ISR_TELEMETRY_ENABLED": "false"/)
    expect(wrangler).toMatch(/visutry\.vercel\.app/)
    expect(PASSTHROUGH_WORKER_NAME).toBe('visutry-isr-passthrough')
  })
})

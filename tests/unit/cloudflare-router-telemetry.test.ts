import {
  buildSafeTelemetryRecord,
  classifyBot,
  classifyBotFromUserAgent,
  detectRequestKind,
  extractLocale,
  normalizeRouteFamily,
  normalizeVercelCache,
  shouldRecordIsrTelemetry,
  telemetryRecordContainsForbiddenData,
  writeIsrTelemetrySafely,
  type AnalyticsEngineBinding,
} from '../../cloudflare-router/telemetry'
import { classify } from '../../cloudflare-router/worker'
import router from '../../cloudflare-router/worker'

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

function headers(init?: Record<string, string>) {
  return {
    get(name: string) {
      if (!init) return null
      const match = Object.entries(init).find(([key]) => key.toLowerCase() === name.toLowerCase())
      return match?.[1] ?? null
    },
  }
}

describe('ISR edge telemetry helpers', () => {
  it('normalizes high-cardinality SEO paths onto route families', () => {
    expect(normalizeRouteFamily('/en/glasses-guide/best-rectangle-glasses-for-round-face'))
      .toBe('/[locale]/glasses-guide/[slug]')
    expect(normalizeRouteFamily('/de/glasses-guide/best-square-glasses-for-round-face'))
      .toBe('/[locale]/glasses-guide/[slug]')
    expect(normalizeRouteFamily('/en/glasses-guide')).toBe('/[locale]/glasses-guide')
    expect(normalizeRouteFamily('/en/style/round-face')).toBe('/[locale]/style/[faceShape]')
    expect(normalizeRouteFamily('/en/blog')).toBe('/[locale]/blog')
    expect(normalizeRouteFamily('/en/blog/how-to-choose-glasses-for-your-face')).toBe('/[locale]/blog/[slug]')
    expect(normalizeRouteFamily('/en/blog/tag/Face%20Shape')).toBe('/[locale]/blog/tag/[tag]')
    expect(normalizeRouteFamily('/en/face-shapes/oval')).toBe('/[locale]/face-shapes/[faceShape]')
    expect(normalizeRouteFamily('/en/sunglasses-for/round-face')).toBe('/[locale]/sunglasses-for/[faceShape]')
    expect(normalizeRouteFamily('/en/hairstyles-for/oval-face')).toBe('/[locale]/hairstyles-for/[faceShape]')
    expect(normalizeRouteFamily('/en/brand/warby-parker')).toBe('/[locale]/brand/[brand]')
    expect(normalizeRouteFamily('/en/try-on/glasses')).toBe('/[locale]/try-on/[type]')
    expect(normalizeRouteFamily('/en/store/ello-sunglasses')).toBe('/[locale]/store/[merchantSlug]')
    expect(normalizeRouteFamily('/en/c/luna-optical/petite-fit')).toBe('/[locale]/c/[merchantSlug]/[experienceSlug]')
    expect(normalizeRouteFamily('/en')).toBe('/[locale]')
    expect(normalizeRouteFamily('/_next/image')).toBe('/_next/image')
    expect(normalizeRouteFamily('/api/frames')).toBe('/api/*')
  })

  it('extracts locale only from the first path segment', () => {
    expect(extractLocale('/de/glasses-guide/x')).toBe('de')
    expect(extractLocale('/blog')).toBe(null)
  })

  it('classifies bots conservatively and does not call UA matches verified', () => {
    expect(classifyBotFromUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe('GOOGLEBOT')
    expect(classifyBotFromUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe('BINGBOT')
    expect(classifyBotFromUserAgent('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot')).toBe('OAI_SEARCHBOT')
    expect(classifyBotFromUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')).toBe('LIKELY_BROWSER')
    expect(classifyBot('Mozilla/5.0 AppleWebKit; compatible; Googlebot/2.1', null).source).toBe('UA_HEURISTIC')
    expect(classifyBot('Mozilla/5.0 AppleWebKit; compatible; Googlebot/2.1', { verifiedBot: true }).source).toBe('CF_VERIFIED')
  })

  it('detects HTML, RSC, and Next prefetch without storing query values', () => {
    expect(detectRequestKind({
      method: 'GET',
      pathname: '/en/glasses-guide/x',
      searchParams: new URLSearchParams(),
      headers: headers({ accept: 'text/html' }),
    })).toBe('HTML_DOCUMENT')

    expect(detectRequestKind({
      method: 'GET',
      pathname: '/en/style/round-face',
      searchParams: new URLSearchParams('_rsc=abc123'),
      headers: headers({ rsc: '1' }),
    })).toBe('RSC')

    expect(detectRequestKind({
      method: 'GET',
      pathname: '/en/blog/how-to-choose-glasses-for-your-face',
      searchParams: new URLSearchParams(),
      headers: headers({ 'next-router-prefetch': '1', accept: 'text/html' }),
    })).toBe('NEXT_PREFETCH')
  })

  it('does not persist secrets, cookies, query values, or IPs in the AE record', () => {
    const request = new EdgeRequest(
      'https://www.visutry.com/en/glasses-guide/best-rectangle-glasses-for-round-face?sourcePage=homepage-cta&token=super-secret-token&_rsc=payload',
      {
        method: 'GET',
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
        'content-length': '81234',
        age: '12',
      },
    })
    const record = buildSafeTelemetryRecord({
      request,
      response,
      routeClass: 'unknown-fallback',
      latencyMs: 42,
    })
    expect(telemetryRecordContainsForbiddenData(record, request.url, request.headers)).toEqual([])
    expect(record.blobs[0]).toBe('/en/glasses-guide/best-rectangle-glasses-for-round-face')
    expect(JSON.stringify(record)).not.toContain('super-secret-token')
    expect(JSON.stringify(record)).not.toContain('secret-auth-token')
    expect(JSON.stringify(record)).not.toContain('secret-cookie')
    expect(JSON.stringify(record)).not.toContain('203.0.113.44')
    expect(record.blobs[8]).toBe('PRERENDER')
    expect(record.doubles[4]).toBe(1)
    expect(record.doubles[5]).toBe(1)
    expect(record.doubles[6]).toBe(1)
    expect(normalizeVercelCache('prerender')).toBe('PRERENDER')
  })

  it('is off by default and only samples Vercel GET/HEAD', () => {
    const env = { ISR_TELEMETRY: { writeDataPoint() {} } }
    expect(shouldRecordIsrTelemetry({
      env,
      method: 'GET',
      backend: 'vercel',
      kind: 'HTML_DOCUMENT',
      sampleKey: 'GET:/en:HTML_DOCUMENT',
    })).toBe(false)

    expect(shouldRecordIsrTelemetry({
      env: { ...env, ISR_TELEMETRY_ENABLED: 'true' },
      method: 'GET',
      backend: 'cloudflare',
      kind: 'HTML_DOCUMENT',
      sampleKey: 'GET:/en:HTML_DOCUMENT',
    })).toBe(false)

    expect(shouldRecordIsrTelemetry({
      env: { ...env, ISR_TELEMETRY_ENABLED: 'true' },
      method: 'POST',
      backend: 'vercel',
      kind: 'API',
      sampleKey: 'POST:/api/x:API',
    })).toBe(false)

    expect(shouldRecordIsrTelemetry({
      env: { ...env, ISR_TELEMETRY_ENABLED: 'true', ISR_HTML_TELEMETRY_SAMPLE_RATE: '1' },
      method: 'GET',
      backend: 'vercel',
      kind: 'HTML_DOCUMENT',
      sampleKey: 'GET:/en/glasses-guide/x:HTML_DOCUMENT',
    })).toBe(true)
  })

  it('swallows Analytics Engine failures', () => {
    const binding: AnalyticsEngineBinding = {
      writeDataPoint() {
        throw new Error('analytics down')
      },
    }
    expect(() => writeIsrTelemetrySafely({
      env: { ISR_TELEMETRY: binding, ISR_TELEMETRY_ENABLED: 'true' },
      request: new EdgeRequest('https://www.visutry.com/en/style/round-face', {
        headers: { accept: 'text/html' },
      }),
      response: new Response('ok', { headers: { 'x-vercel-cache': 'MISS' } }),
      backend: 'vercel',
      routeClass: 'unknown-fallback',
      latencyMs: 10,
    })).not.toThrow()
  })
})

describe('capability router telemetry wiring', () => {
  it('still classifies locale SEO HTML as unknown-fallback → Vercel', () => {
    const request = { url: 'https://staging.example/en/glasses-guide/best-rectangle-glasses-for-round-face', method: 'GET' } as Request
    expect(classify(request)).toEqual({ backend: 'vercel', routeClass: 'unknown-fallback' })
    expect(classify({ url: 'https://staging.example/de/style/round-face', method: 'GET' } as Request))
      .toEqual({ backend: 'vercel', routeClass: 'unknown-fallback' })
  })

  it('does not change the upstream response when telemetry throws', async () => {
    const previousFetch = globalThis.fetch
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('body-ok', {
      status: 200,
      headers: { 'x-vercel-cache': 'PRERENDER', 'content-type': 'text/html' },
    })) as typeof fetch
    try {
      const response = await router.fetch(
        new EdgeRequest('https://staging.example/en/blog/how-to-choose-glasses-for-your-face', {
          headers: { accept: 'text/html' },
        }),
        {
          CF_APP: { fetch: jest.fn() },
          CF_ORIGIN: 'https://cf-app.example',
          VERCEL_ORIGIN: 'https://vercel.example',
          ROUTER_ENV: 'staging',
          ISR_TELEMETRY_ENABLED: 'true',
          ISR_TELEMETRY: {
            writeDataPoint() {
              throw new Error('ae-offline')
            },
          },
        },
      )
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('body-ok')
      expect(response.headers.get('x-vercel-cache')).toBe('PRERENDER')
      expect(response.headers.get('x-visutry-router-backend')).toBe('vercel')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('does not write telemetry when disabled', async () => {
    const previousFetch = globalThis.fetch
    const writeDataPoint = jest.fn()
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('ok', {
      headers: { 'x-vercel-cache': 'MISS' },
    })) as typeof fetch
    try {
      await router.fetch(
        new EdgeRequest('https://staging.example/en/glasses-guide/x', { headers: { accept: 'text/html' } }),
        {
          CF_APP: { fetch: jest.fn() },
          CF_ORIGIN: 'https://cf-app.example',
          VERCEL_ORIGIN: 'https://vercel.example',
          ROUTER_ENV: 'staging',
          ISR_TELEMETRY: { writeDataPoint },
        },
      )
      expect(writeDataPoint).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = previousFetch
    }
  })
})

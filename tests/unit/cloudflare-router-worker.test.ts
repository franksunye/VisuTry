import router, { classify, upstreamRequest } from '../../cloudflare-router/worker'

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

function request(path: string, method = 'GET') {
  return { url: `https://staging.example${path}`, method } as Request
}

describe('Cloudflare staging capability router', () => {
  it('keeps the complete Auth0 browser transaction on Cloudflare', () => {
    expect(classify(request('/api/auth/csrf'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signin/auth0'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signin/auth0', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/callback/auth0'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/callback/auth0', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signout', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
  })

  it('keeps unsupported capabilities on Vercel and defaults unknown routes there', () => {
    expect(classify(request('/api/payment/create-session', 'POST'))).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    expect(classify(request('/api/unknown-capability'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
    expect(classify(request('/api/merchant/workspaces', 'PUT'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
  })

  it('classifies the proven B3.2 capability boundary by path and method', () => {
    const cfReady: Array<[string, string]> = [
      ['GET', '/api/health'],
      ['GET', '/api/glasses/brands'],
      ['GET', '/api/auth/session'],
      ['GET', '/api/try-on/history'],
      ['GET', '/api/face-analysis/history'],
      ['GET', '/api/payment/history'],
      ['GET', '/api/user/balance'],
      ['GET', '/api/merchant/3f1d3aff-4dfa-4ff7-a0f8-fc12788a125c/profile'],
      ['POST', '/api/merchant/workspaces'],
      ['POST', '/api/mcp'],
    ]
    for (const [method, path] of cfReady) {
      expect(classify(request(path, method))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    }

    const vercelRequired: Array<[string, string]> = [
      ['POST', '/api/payment/create-session'],
      ['POST', '/api/payment/webhook'],
      ['POST', '/api/upload'],
      ['POST', '/api/face-analysis/submit'],
      ['GET', '/api/admin/users'],
      ['GET', '/api/cron/cleanup'],
      ['GET', '/api/mcp/oauth/authorize'],
      ['POST', '/api/agent/v1/merchant/source-intake'],
    ]
    for (const [method, path] of vercelRequired) {
      expect(classify(request(path, method))).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    }

    expect(classify(request('/api/unknown-read'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
    expect(classify(request('/api/unknown-write', 'POST'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
  })

  it('keeps static assets on Cloudflare while preserving method-aware boundaries', () => {
    expect(classify(request('/_next/static/chunks/app.js'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/_next/static/chunks/app.js', 'POST'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
    expect(classify(request('/favicon.ico'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
  })

  it('preserves upstream request semantics and rewrites only Host', async () => {
    const requestHeaders = {
      authorization: 'Bearer test-token',
      cookie: 'next-auth.session-token=test-cookie',
      'x-user-id': 'client-supplied-value',
    }
    const forwarded = upstreamRequest(
      new EdgeRequest('https://staging.example/api/unknown-write?probe=1', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ value: 'body-preserved' }),
      }),
      'https://origin.example/base',
    )

    expect(forwarded.url).toBe('https://origin.example/api/unknown-write?probe=1')
    expect(forwarded.method).toBe('POST')
    expect(forwarded.headers.get('host')).toBe('origin.example')
    expect(forwarded.headers.get('authorization')).toBe(requestHeaders.authorization)
    expect(forwarded.headers.get('cookie')).toBe(requestHeaders.cookie)
    expect(forwarded.headers.get('x-user-id')).toBe(requestHeaders['x-user-id'])
    await expect(forwarded.text()).resolves.toBe(JSON.stringify({ value: 'body-preserved' }))
  })

  it('fails a Cloudflare request closed without retrying against Vercel', async () => {
    const previousFetch = globalThis.fetch
    const fetchSpy = jest.fn().mockRejectedValue(new Error('vercel must not be called'))
    globalThis.fetch = fetchSpy as typeof globalThis.fetch
    const cfFetch = jest.fn().mockRejectedValue(new Error('cloudflare unavailable'))

    try {
      const response = await router.fetch(
        new EdgeRequest('https://staging.example/api/merchant/workspaces', { method: 'POST', body: '{}' }),
        {
          CF_APP: { fetch: cfFetch },
          CF_ORIGIN: 'https://cf-app.example',
          VERCEL_ORIGIN: 'https://vercel.example',
          ROUTER_ENV: 'staging',
        },
      )

      expect(response.status).toBe(502)
      expect(cfFetch).toHaveBeenCalledTimes(1)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = previousFetch
    }
  })
})

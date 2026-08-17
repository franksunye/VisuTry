export interface Env {
  CF_APP: { fetch(request: Request): Promise<Response> }
  CF_ORIGIN: string
  VERCEL_ORIGIN: string
  ROUTER_ENV: string
}

type Backend = 'cloudflare' | 'vercel'
type RouteClass = 'cf-ready' | 'vercel-required' | 'unknown-fallback'

export interface RouteDecision {
  backend: Backend
  routeClass: RouteClass
}

const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
const cloudflarePageSuffixes = ['/store', '/blog', '/face-shape-detector', '/auth/signin', '/auth/error'] as const

const vercelRequiredPrefixes = [
  '/api/admin/',
  '/api/agent/v1/merchant',
  '/api/cron/',
  '/api/face-analysis/submit',
  '/api/mcp/oauth/',
  '/api/payment/',
  '/api/store/sessions',
  '/api/try-on/',
  '/api/upload',
  '/_next/image',
] as const

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function isCloudflarePage(pathname: string, method: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false
  const path = cleanPath(pathname)
  if (path === '/') return true
  if (path === '/en/merchant') return true
  return locales.some((locale) => {
    if (path === `/${locale}`) return true
    return cloudflarePageSuffixes.some((suffix) => path === `/${locale}${suffix}`)
  })
}

function isCloudflareAuth(pathname: string, method: string): boolean {
  const path = cleanPath(pathname)
  const readOnly = new Set([
    '/api/auth/csrf',
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/signin',
    '/api/auth/signin/auth0',
  ])
  if (method === 'GET' && readOnly.has(path)) return true
  // NextAuth's browser signIn() starts the OAuth transaction with a
  // CSRF-protected POST to this provider route. Keep it on the same host as
  // the callback so state/PKCE cookies stay in the single staging session.
  if (method === 'POST' && path === '/api/auth/signin/auth0') return true
  if ((method === 'GET' || method === 'POST') && path === '/api/auth/callback/auth0') return true
  if (method === 'POST' && (path === '/api/auth/refresh-token' || path === '/api/auth/signout')) return true
  return false
}

function isCloudflareRead(pathname: string, method: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false
  const path = cleanPath(pathname)
  if (path === '/api/health' || path === '/api/glasses/brands') return true
  if (path === '/api/try-on/history') return true
  if (path === '/api/face-analysis/history') return true
  if (path === '/api/payment/history') return true
  if (path === '/api/user/balance') return true
  return /^\/api\/merchant\/[^/]+\/profile$/.test(path)
}

function isCloudflareWrite(pathname: string, method: string): boolean {
  return method === 'POST' && cleanPath(pathname) === '/api/merchant/workspaces'
}

function isCloudflareMcp(pathname: string, method: string): boolean {
  return method === 'POST' && cleanPath(pathname) === '/api/mcp'
}

function isVercelRequired(pathname: string): boolean {
  const path = cleanPath(pathname)
  return vercelRequiredPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))
}

export function classify(request: Request): RouteDecision {
  const url = new URL(request.url)
  const { pathname } = url
  const { method } = request

  if (
    isCloudflarePage(pathname, method) ||
    isCloudflareAuth(pathname, method) ||
    isCloudflareRead(pathname, method) ||
    isCloudflareWrite(pathname, method) ||
    isCloudflareMcp(pathname, method)
  ) {
    return { backend: 'cloudflare', routeClass: 'cf-ready' }
  }

  if (isVercelRequired(pathname)) {
    return { backend: 'vercel', routeClass: 'vercel-required' }
  }

  return { backend: 'vercel', routeClass: 'unknown-fallback' }
}

export function targetUrl(request: Request, origin: string): URL {
  const incoming = new URL(request.url)
  const target = new URL(origin)
  target.pathname = incoming.pathname
  target.search = incoming.search
  return target
}

export function upstreamRequest(request: Request, origin: string): Request {
  const headers = new Headers(request.headers)
  // The incoming Host belongs to the router. Rewrite only this transport header so the
  // selected origin receives the host it is serving; all application headers are preserved.
  headers.set('host', new URL(origin).host)
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  return new Request(targetUrl(request, origin), {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })
}

function logRoute(
  request: Request,
  decision: RouteDecision,
  status: number,
  latencyMs: number,
): void {
  const url = new URL(request.url)
  console.log(
    JSON.stringify({
      path: url.pathname,
      backend: decision.backend,
      routeClass: decision.routeClass,
      status,
      latencyMs,
    }),
  )
}

function cloudflareRequest(request: Request, origin: string): Request {
  const headers = new Headers(request.headers)
  headers.set('host', new URL(origin).host)
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  return new Request(targetUrl(request, origin), {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const decision = classify(request)
    const origin = decision.backend === 'cloudflare' ? env.CF_ORIGIN : env.VERCEL_ORIGIN
    const startedAt = Date.now()

    try {
      // Request construction preserves method, query, headers, cookies, authorization, body,
      // and streaming semantics. No client-provided internal identity headers are trusted.
      const upstream = decision.backend === 'cloudflare'
        ? await env.CF_APP.fetch(cloudflareRequest(request, env.CF_ORIGIN))
        : await fetch(upstreamRequest(request, origin))
      const latencyMs = Date.now() - startedAt
      logRoute(request, decision, upstream.status, latencyMs)

      const headers = new Headers(upstream.headers)
      headers.set('x-visutry-router-backend', decision.backend)
      headers.set('x-visutry-router-class', decision.routeClass)
      headers.set('x-visutry-router-latency-ms', String(latencyMs))
      return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers })
    } catch (error) {
      const latencyMs = Date.now() - startedAt
      logRoute(request, decision, 502, latencyMs)
      console.error(
        JSON.stringify({
          path: new URL(request.url).pathname,
          backend: decision.backend,
          routeClass: decision.routeClass,
          status: 502,
          latencyMs,
          error: error instanceof Error ? error.name : 'upstream-fetch-failed',
        }),
      )
      // Fail closed. There is intentionally no automatic CF → Vercel retry: a retry could
      // duplicate a write or create two owners for the same capability.
      return new Response('Upstream unavailable', {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-visutry-router-backend': decision.backend,
          'x-visutry-router-class': decision.routeClass,
          'x-visutry-router-latency-ms': String(latencyMs),
        },
      })
    }
  },
}

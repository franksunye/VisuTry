/**
 * Staging adapter for the B4 public slice.
 *
 * Wired into app-host-worker.ts for visutry-cf-staging only.
 * Does not bind www.visutry.com or change production DNS.
 * Live B3.2 classify() in worker.ts stays unchanged for regression tests.
 */

import {
  classifyB4ProductionPublicSlice,
  type B4InvocationMode,
  type B4RouteDecision,
} from './b4-production-public-slice'

export type B4Layer = 'layer1-static-asset' | 'layer2-worker' | 'layer3-vercel'

const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const

export function classifyStagingPublicSlice(request: Request): B4RouteDecision {
  return classifyB4ProductionPublicSlice(request)
}

export function b4Layer(decision: B4RouteDecision): B4Layer {
  if (decision.invocation === 'static-asset') return 'layer1-static-asset'
  if (decision.backend === 'vercel') return 'layer3-vercel'
  return 'layer2-worker'
}

export function sanitizeRouteTemplate(pathname: string): string {
  let path = pathname.split('?')[0] || '/'
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)

  const locale = locales.find((item) => path === `/${item}` || path.startsWith(`/${item}/`))
  if (locale) {
    path = path === `/${locale}` ? '/:locale' : `/:locale${path.slice(locale.length + 1)}`
  }

  return path
    .replace(/^\/:locale\/brand\/[^/]+/, '/:locale/brand/:brand')
    .replace(/^\/brand\/[^/]+/, '/brand/:brand')
    .replace(/^\/:locale\/blog\/tag\/[^/]+/, '/:locale/blog/tag/:tag')
    .replace(/^\/:locale\/blog\/[^/]+/, '/:locale/blog/:slug')
    .replace(/^\/blog\/tag\/[^/]+/, '/blog/tag/:tag')
    .replace(/^\/blog\/[^/]+/, '/blog/:slug')
    .replace(/^\/:locale\/store\/[^/]+/, '/:locale/store/:merchantSlug')
    .replace(/^\/:locale\/c\/[^/]+\/[^/]+/, '/:locale/c/:merchantSlug/:experienceSlug')
    .replace(/^\/:locale\/category\/[^/]+/, '/:locale/category/:slug')
    .replace(/^\/:locale\/try\/[^/]+/, '/:locale/try/:slug')
    .replace(/^\/:locale\/glasses-guide\/[^/]+/, '/:locale/glasses-guide/:slug')
    .replace(/^\/:locale\/face-shapes\/[^/]+/, '/:locale/face-shapes/:faceShape')
    .replace(/^\/:locale\/style\/[^/]+/, '/:locale/style/:faceShape')
    .replace(/^\/_next\/static\/.+/, '/_next/static/*')
    .replace(/^\/images\/.+/, '/images/*')
    .replace(/^\/home\/.+/, '/home/*')
    .replace(/^\/experience-heroes\/.+/, '/experience-heroes/*')
    .replace(/^\/blog-covers\/.+/, '/blog-covers/*')
    .replace(/^\/assets\/.+/, '/assets/*')
}

export function fallbackRequest(request: Request, origin: string): Request {
  const incoming = new URL(request.url)
  const target = new URL(origin)
  target.pathname = incoming.pathname
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.set('host', target.host)
  headers.set('x-forwarded-host', incoming.host)
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', '') || 'https')
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  return new Request(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })
}

const VISUTRY_VERCEL_ORIGIN = /https:\/\/visutry(?:[.-][\w]+)*\.vercel\.app/gi

export function rewriteFallbackLocation(response: Response, origin: string, publicHost: string): Response {
  const location = response.headers.get('location')
  if (!location) return response

  let rewritten = location
  try {
    const originHost = new URL(origin).host
    rewritten = rewritten.replace(VISUTRY_VERCEL_ORIGIN, `https://${publicHost}`)
    rewritten = rewritten.split(originHost).join(publicHost)
    rewritten = rewritten.replace(`https://${publicHost}//`, `https://${publicHost}/`)
  } catch {
    return response
  }

  if (rewritten === location) return response
  const headers = new Headers(response.headers)
  headers.set('location', rewritten)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function withB4RouterHeaders(
  response: Response,
  decision: B4RouteDecision,
  latencyMs: number,
): Response {
  const headers = new Headers(response.headers)
  headers.set('x-visutry-router-backend', decision.backend)
  headers.set('x-visutry-router-class', decision.routeClass)
  headers.set('x-visutry-router-layer', b4Layer(decision))
  headers.set('x-visutry-router-invocation', decision.invocation)
  headers.set('x-visutry-router-cache', decision.cacheClass)
  headers.set('x-visutry-router-latency-ms', String(latencyMs))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function sanitizeWorkerException(error: unknown): { errorClass: string; errorDetail: string } {
  const errorClass = error instanceof Error ? error.name : 'worker-fetch-failed'
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  const errorDetail = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-db]')
    .replace(/mysql:\/\/\S+/gi, '[redacted-db]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/(?:^|[;\s])(?:cookie|authorization)=[^\s;]+/gi, ' [redacted-header]')
    .slice(0, 300)
  return { errorClass, errorDetail }
}

export function resolveOpenNextAppWorker(mod: unknown): { fetch: AppWorkerFetch } {
  const candidate = mod as { fetch?: unknown; default?: { fetch?: unknown } }
  if (typeof candidate.fetch === 'function') {
    return candidate as { fetch: AppWorkerFetch }
  }
  if (candidate.default && typeof candidate.default.fetch === 'function') {
    return candidate.default as { fetch: AppWorkerFetch }
  }
  throw new Error('OpenNext worker export is missing fetch')
}

type AppWorkerFetch = (request: Request, env: unknown, ctx: unknown) => Promise<Response>

export function routerLogFields(
  request: Request,
  decision: B4RouteDecision,
  status: number,
  latencyMs: number,
  errorClass?: string,
): Record<string, string | number | boolean> {
  const layer = b4Layer(decision)
  const fields: Record<string, string | number | boolean> = {
    timestamp: new Date().toISOString(),
    method: request.method,
    route: sanitizeRouteTemplate(new URL(request.url).pathname),
    routeClass: decision.routeClass,
    layer,
    backend: decision.backend,
    invocation: decision.invocation as B4InvocationMode,
    status,
    latencyMs,
  }
  if (layer === 'layer1-static-asset') {
    fields.unexpectedWorkerInvocation = true
  }
  if (errorClass) fields.error = errorClass
  return fields
}

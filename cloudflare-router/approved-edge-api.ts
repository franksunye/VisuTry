/**
 * Direct Worker handler for the approved non-Next production health API.
 *
 * This path must never enter OpenNext / NextServer. The handler is deliberately
 * database-free so the active Cloudflare path cannot couple to a PostgreSQL
 * provider.
 */

import { B4_FIRST_SLICE_APIS } from './b4-production-public-slice'

export type ApprovedEdgeApiEnv = {
  NODE_ENV?: string
  ROUTER_ENV?: string
}

const APPROVED = new Set<string>(B4_FIRST_SLICE_APIS)

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

export function isApprovedEdgeApi(request: Request): boolean {
  const method = request.method
  if (method !== 'GET' && method !== 'HEAD') return false
  try {
    return APPROVED.has(cleanPath(new URL(request.url).pathname))
  } catch {
    return false
  }
}

function resolveNodeEnv(env: ApprovedEdgeApiEnv): string {
  return env.NODE_ENV || process.env.NODE_ENV || (env.ROUTER_ENV === 'production' ? 'production' : 'development')
}

function jsonResponse(request: Request, body: unknown, init: { status?: number; cacheControl?: string } = {}): Response {
  const payload = JSON.stringify(body)
  const headers = new Headers({ 'content-type': 'application/json' })
  if (init.cacheControl) headers.set('Cache-Control', init.cacheControl)
  const status = init.status ?? 200
  if (request.method === 'HEAD') {
    return new Response(null, { status, headers })
  }
  return new Response(payload, { status, headers })
}

export async function handleApprovedEdgeApi(request: Request, env: ApprovedEdgeApiEnv = {}): Promise<Response> {
  const path = cleanPath(new URL(request.url).pathname)

  if (path === '/api/health') {
    try {
      return jsonResponse(request, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'VisuTry',
        version: '0.1.0',
        environment: resolveNodeEnv(env),
      })
    } catch {
      return jsonResponse(request, {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
  }

  return jsonResponse(request, { success: false, error: 'Not found' }, { status: 404 })
}

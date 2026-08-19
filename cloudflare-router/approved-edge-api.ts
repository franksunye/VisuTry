/**
 * Direct Worker handlers for the 4 approved non-Next production APIs.
 *
 * These paths must never enter OpenNext / NextServer. Neon uses fetch(), and
 * Next.js Data Cache would then call StaticAssetsIncrementalCache.set(type=fetch)
 * on the read-only Static Assets adapter.
 */

import { getActiveBrands, getCategories, getFaceShapes } from '../src/data/glasses-cloudflare'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '../src/lib/public-http-cache'
import { B4_FIRST_SLICE_APIS } from './b4-production-public-slice'

export type ApprovedEdgeApiEnv = {
  DATABASE_URL?: string
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

function applyWorkerEnv(env: ApprovedEdgeApiEnv) {
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL
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

async function catalog<T>(
  request: Request,
  load: () => Promise<T>,
  logLabel: string,
  errorMessage: string,
): Promise<Response> {
  try {
    const data = await load()
    return jsonResponse(request, { success: true, data }, { cacheControl: PUBLIC_CATALOG_CACHE_CONTROL })
  } catch (error) {
    console.error(logLabel, error)
    return jsonResponse(request, { success: false, error: errorMessage }, { status: 500 })
  }
}

export async function handleApprovedEdgeApi(request: Request, env: ApprovedEdgeApiEnv = {}): Promise<Response> {
  applyWorkerEnv(env)
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

  if (path === '/api/glasses/brands') {
    return catalog(request, getActiveBrands, 'Error fetching brands:', 'Failed to fetch brands')
  }
  if (path === '/api/glasses/categories') {
    return catalog(request, getCategories, 'Error fetching categories:', 'Failed to fetch categories')
  }
  if (path === '/api/glasses/face-shapes') {
    return catalog(request, getFaceShapes, 'Error fetching face shapes:', 'Failed to fetch face shapes')
  }

  return jsonResponse(request, { success: false, error: 'Not found' }, { status: 404 })
}

/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import { forceVercelForNextFrontend } from '../../cloudflare-router/b4-staging-router'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'

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

const { handleApprovedEdgeApi, isApprovedEdgeApi } = require('../../cloudflare-router/approved-edge-api') as typeof import('../../cloudflare-router/approved-edge-api')

function request(pathName: string, method = 'GET') {
  return new EdgeRequest(`https://www.visutry.com${pathName}`, { method })
}

describe('approved edge API OpenNext bypass', () => {
  const incrementalSet = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(globalThis as { __VISUTRY_INCREMENTAL_CACHE_SET__?: unknown }).__VISUTRY_INCREMENTAL_CACHE_SET__ = incrementalSet
  })

  afterEach(() => {
    delete (globalThis as { __VISUTRY_INCREMENTAL_CACHE_SET__?: unknown }).__VISUTRY_INCREMENTAL_CACHE_SET__
  })

  it('matches only the health GET/HEAD edge API; catalog APIs are Vercel-owned', () => {
    expect(isApprovedEdgeApi(request('/api/health'))).toBe(true)
    expect(isApprovedEdgeApi(request('/api/health', 'HEAD'))).toBe(true)
    expect(isApprovedEdgeApi(request('/api/glasses/brands'))).toBe(false)
    expect(isApprovedEdgeApi(request('/api/glasses/categories'))).toBe(false)
    expect(isApprovedEdgeApi(request('/api/glasses/face-shapes'))).toBe(false)
    expect(isApprovedEdgeApi(request('/api/health', 'POST'))).toBe(false)
    expect(isApprovedEdgeApi(request('/api/glasses/frames'))).toBe(false)
    expect(isApprovedEdgeApi(request('/en'))).toBe(false)
  })

  it('serves health without touching OpenNext incremental cache writes', async () => {
    const response = await handleApprovedEdgeApi(request('/api/health'), { NODE_ENV: 'production' })
    const body = await response.json() as {
      status: string
      service: string
      version: string
      environment: string
      timestamp: string
    }
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(body).toMatchObject({
      status: 'ok',
      service: 'VisuTry',
      version: '0.1.0',
      environment: 'production',
    })
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(incrementalSet).not.toHaveBeenCalled()
  })

  it('does not import OpenNext incremental cache and dispatches before appWorker.fetch', () => {
    const handler = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/approved-edge-api.ts'), 'utf8')
    const imports = handler.split('\n').filter((line) => line.startsWith('import '))
    expect(imports.join('\n')).not.toMatch(/@opennextjs|\.open-next|incremental-cache|glasses-cloudflare|neon-cloudflare|public-catalog-edge-cache/)
    expect(handler).not.toMatch(/applyWorkerEnv/)
    expect(handler).not.toMatch(/from 'next\/cache'|from \"next\/cache\"/)
    expect(handler).not.toMatch(/unstable_cache/)
    expect(handler).not.toMatch(/process\.env\.DATABASE_URL\s*=/)

    const worker = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/app-host-worker.ts'), 'utf8')
    const dispatchAt = worker.indexOf('handleApprovedEdgeApi')
    const openNextAt = worker.indexOf('appWorker.fetch')
    expect(worker).toMatch(/isApprovedEdgeApi\(request\)/)
    expect(dispatchAt).toBeGreaterThan(-1)
    expect(openNextAt).toBeGreaterThan(dispatchAt)
    expect(worker.match(/appWorker\.fetch/g)).toHaveLength(1)
  })

  it('keeps the Next frontend guardrail and catalog APIs on Vercel', () => {
    for (const pathName of ['/api/glasses/brands', '/api/glasses/categories', '/api/glasses/face-shapes']) {
      const api = request(pathName)
      const apiDecision = classifyB4ProductionPublicSlice(api)
      expect(apiDecision).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required', invocation: 'vercel' })
      expect(forceVercelForNextFrontend(api, apiDecision).backend).toBe('vercel')
    }

    const asset = request('/_next/static/chunks/app.js')
    const apiDecision = classifyB4ProductionPublicSlice(asset)
    const coerced = forceVercelForNextFrontend(asset, {
      ...apiDecision,
      backend: 'cloudflare',
      routeClass: 'cf-ready',
      invocation: 'static-asset',
      cacheClass: 'hashed-immutable',
    })
    expect(coerced.backend).toBe('vercel')

    const rsc = new EdgeRequest('https://www.visutry.com/en?_rsc=1', {
      method: 'GET',
      headers: { RSC: '1', accept: 'text/x-component' },
    })
    const rscDecision = classifyB4ProductionPublicSlice(rsc)
    expect(forceVercelForNextFrontend(rsc, rscDecision).backend).toBe('vercel')
  })
})

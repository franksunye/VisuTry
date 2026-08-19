/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'
import { getActiveBrands, getCategories, getFaceShapes } from '../../src/data/glasses-cloudflare'
import { forceVercelForNextFrontend } from '../../cloudflare-router/b4-staging-router'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'

jest.mock('../../src/data/glasses-cloudflare', () => ({
  getActiveBrands: jest.fn(),
  getCategories: jest.fn(),
  getFaceShapes: jest.fn(),
}))

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

const mocked = {
  getActiveBrands: getActiveBrands as jest.MockedFunction<typeof getActiveBrands>,
  getCategories: getCategories as jest.MockedFunction<typeof getCategories>,
  getFaceShapes: getFaceShapes as jest.MockedFunction<typeof getFaceShapes>,
}

function request(pathName: string, method = 'GET') {
  return new EdgeRequest(`https://www.visutry.com${pathName}`, { method })
}

describe('approved edge API OpenNext bypass', () => {
  const incrementalSet = jest.fn()
  const originalDatabaseUrl = process.env.DATABASE_URL

  beforeEach(() => {
    jest.clearAllMocks()
    ;(globalThis as { __VISUTRY_INCREMENTAL_CACHE_SET__?: unknown }).__VISUTRY_INCREMENTAL_CACHE_SET__ = incrementalSet
  })

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = originalDatabaseUrl
    delete (globalThis as { __VISUTRY_INCREMENTAL_CACHE_SET__?: unknown }).__VISUTRY_INCREMENTAL_CACHE_SET__
  })

  it('matches only the 4 GET/HEAD approved APIs', () => {
    expect(isApprovedEdgeApi(request('/api/health'))).toBe(true)
    expect(isApprovedEdgeApi(request('/api/glasses/brands', 'HEAD'))).toBe(true)
    expect(isApprovedEdgeApi(request('/api/glasses/categories/'))).toBe(true)
    expect(isApprovedEdgeApi(request('/api/glasses/face-shapes?x=1'))).toBe(true)
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
    expect(mocked.getFaceShapes).not.toHaveBeenCalled()
  })

  it('keeps catalog JSON + Cache-Control and serializes Date fields as ISO', async () => {
    mocked.getActiveBrands.mockResolvedValue(['Warby Parker'])
    mocked.getCategories.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'optical',
        displayName: 'Optical',
        description: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])
    mocked.getFaceShapes.mockResolvedValue([
      {
        id: 'shape-1',
        name: 'oval',
        displayName: 'Oval',
        description: null,
        characteristics: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])

    const brands = await handleApprovedEdgeApi(request('/api/glasses/brands'), { DATABASE_URL: 'postgres://example' })
    const categories = await handleApprovedEdgeApi(request('/api/glasses/categories'), { DATABASE_URL: 'postgres://example' })
    const shapes = await handleApprovedEdgeApi(request('/api/glasses/face-shapes'), { DATABASE_URL: 'postgres://example' })

    expect(brands.status).toBe(200)
    expect(brands.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(await brands.json()).toEqual({ success: true, data: ['Warby Parker'] })

    expect(categories.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(await categories.json()).toEqual({
      success: true,
      data: [{
        id: 'cat-1',
        name: 'optical',
        displayName: 'Optical',
        description: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }],
    })

    expect(shapes.status).toBe(200)
    expect(shapes.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(await shapes.json()).toEqual({
      success: true,
      data: [{
        id: 'shape-1',
        name: 'oval',
        displayName: 'Oval',
        description: null,
        characteristics: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }],
    })
    expect(mocked.getFaceShapes).toHaveBeenCalledTimes(1)
    expect(incrementalSet).not.toHaveBeenCalled()
  })

  it('preserves catalog 500 contract when direct-Neon read fails', async () => {
    mocked.getFaceShapes.mockRejectedValue(new Error('neon down'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleApprovedEdgeApi(request('/api/glasses/face-shapes'), { DATABASE_URL: 'postgres://example' })
    spy.mockRestore()
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false, error: 'Failed to fetch face shapes' })
    expect(incrementalSet).not.toHaveBeenCalled()
  })

  it('does not import OpenNext incremental cache and dispatches before appWorker.fetch', () => {
    const handler = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/approved-edge-api.ts'), 'utf8')
    const imports = handler.split('\n').filter((line) => line.startsWith('import '))
    expect(imports.join('\n')).not.toMatch(/@opennextjs|\.open-next|incremental-cache/)

    const worker = fs.readFileSync(path.join(__dirname, '../../cloudflare-router/app-host-worker.ts'), 'utf8')
    const dispatchAt = worker.indexOf('handleApprovedEdgeApi')
    const openNextAt = worker.indexOf('appWorker.fetch')
    expect(worker).toMatch(/isApprovedEdgeApi\(request\)/)
    expect(dispatchAt).toBeGreaterThan(-1)
    expect(openNextAt).toBeGreaterThan(dispatchAt)
    expect(worker.match(/appWorker\.fetch/g)).toHaveLength(1)
  })

  it('keeps the Next frontend guardrail: /_next and RSC stay Vercel, approved APIs stay Cloudflare', () => {
    const api = request('/api/glasses/face-shapes')
    const apiDecision = classifyB4ProductionPublicSlice(api)
    expect(forceVercelForNextFrontend(api, apiDecision).backend).toBe('cloudflare')

    const asset = request('/_next/static/chunks/app.js')
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

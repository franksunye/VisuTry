/** @jest-environment node */

import {
  B4_LOCALES,
  B4_PRODUCTION_PUBLIC_HOST,
  B4_PRODUCTION_WORKER_NAME,
  generateB4ProductionWorkerRoutes,
  glassesGuideMigrationPatterns,
  P0_F1_EXISTING_UNGATED_P0,
  proposedGlassesGuideMigrationPayload,
  proposedHashedStaticMissFallbackPayload,
  routesForPriority,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import { shouldFallbackHashedStaticMissToVercel } from '../../cloudflare-router/b4-staging-router'

const EdgeRequest = (() => {
  const runtimeGlobals = globalThis as unknown as {
    setImmediate?: (...args: unknown[]) => unknown
  }
  runtimeGlobals.setImmediate ??= ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    return setTimeout(callback, 0, ...args)
  }) as unknown as (...args: unknown[]) => unknown
  const primitives = require('next/dist/compiled/@edge-runtime/primitives') as {
    Request: typeof Request
  }
  return primitives.Request
})()

function classify(pathname: string, method = 'GET') {
  return classifyB4ProductionPublicSlice({
    url: `https://${B4_PRODUCTION_PUBLIC_HOST}${pathname}`,
    method,
    headers: { get() { return null } },
  } as unknown as Request)
}

describe('P0-F1 glasses-guide production route ownership', () => {
  const all = generateB4ProductionWorkerRoutes()
  const existingP0 = routesForPriority('P0', all)
  const glassesGuide = proposedGlassesGuideMigrationPayload()
  const hashedStatic = proposedHashedStaticMissFallbackPayload()
  const active = [
    ...existingP0,
    ...all.filter((row) => glassesGuide.some((item) => item.pattern === row.pattern)),
  ]

  it('keeps the original 12 ungated P0 routes and does not rewrite them', () => {
    expect(existingP0.map((row) => row.pattern)).toEqual([...P0_F1_EXISTING_UNGATED_P0])
    expect(existingP0).toHaveLength(12)
    expect(wwwWorkerRouteMatch('/api/health', '', existingP0)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/api/health`)
  })

  it('emits 18 locale glasses-guide routes: exact hub plus wildcard detail', () => {
    expect(glassesGuideMigrationPatterns()).toHaveLength(18)
    expect(glassesGuide).toHaveLength(18)
    expect(glassesGuide.every((row) => row.script === B4_PRODUCTION_WORKER_NAME)).toBe(true)
    expect(glassesGuide.every((row) => row.request_limit_fail_open === true)).toBe(true)
    expect(glassesGuide.some((row) => row.pattern.endsWith('glasses-guide*'))).toBe(false)
    expect(all.some((row) => /glasses-guide\*$/.test(row.pattern))).toBe(false)

    for (const locale of B4_LOCALES) {
      expect(glassesGuide.map((row) => row.pattern)).toContain(`${B4_PRODUCTION_PUBLIC_HOST}/${locale}/glasses-guide`)
      expect(glassesGuide.map((row) => row.pattern)).toContain(`${B4_PRODUCTION_PUBLIC_HOST}/${locale}/glasses-guide/*`)
    }
  })

  it('routes English hub and localized details to Cloudflare without touching Vercel-required families', () => {
    expect(wwwWorkerRouteMatch('/en/glasses-guide', '', active)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/en/glasses-guide`)
    expect(classify('/en/glasses-guide')).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })

    expect(wwwWorkerRouteMatch('/de/glasses-guide/foo', '', active)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/de/glasses-guide/*`)
    expect(classify('/de/glasses-guide/foo')).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })

    expect(wwwWorkerRouteMatch('/ar/glasses-guide/foo', '', active)?.pattern).toBe(`${B4_PRODUCTION_PUBLIC_HOST}/ar/glasses-guide/*`)
    expect(classify('/ar/glasses-guide/foo')).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })

    expect(wwwWorkerRouteMatch('/en/glasses-guide/best-rectangle-glasses-for-round-face', '?_rsc=1', active)?.pattern)
      .toBe(`${B4_PRODUCTION_PUBLIC_HOST}/en/glasses-guide/*`)
  })

  it('does not migrate API, Store detail, Campaign, payment, or unknown fallback paths', () => {
    expect(wwwWorkerRouteMatch('/api/try-on/submit', '', active)).toBeNull()
    expect(classify('/api/try-on/submit')).toMatchObject({ backend: 'vercel' })

    expect(wwwWorkerRouteMatch('/api/payment/create-session', '', active)).toBeNull()
    expect(classify('/api/payment/create-session')).toMatchObject({ backend: 'vercel' })

    expect(wwwWorkerRouteMatch('/en/store/foo', '', active)).toBeNull()
    expect(classify('/en/store/foo')).toMatchObject({ backend: 'vercel' })

    expect(wwwWorkerRouteMatch('/en/c/foo/bar', '', active)).toBeNull()
    expect(classify('/en/c/foo/bar')).toMatchObject({ backend: 'vercel' })

    expect(wwwWorkerRouteMatch('/en/discover', '', active)).toBeNull()
    expect(classify('/en/discover')).toMatchObject({ backend: 'vercel' })

    expect(wwwWorkerRouteMatch('/unknown-crawler-path', '', active)).toBeNull()
    expect(classify('/unknown-crawler-path')).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
  })

  it('activates hashed static as asset-hit or Vercel-miss, not as a same-commit identity gate', () => {
    expect(hashedStatic).toEqual([
      {
        pattern: `${B4_PRODUCTION_PUBLIC_HOST}/_next/static/*`,
        script: B4_PRODUCTION_WORKER_NAME,
        request_limit_fail_open: true,
      },
    ])
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', existingP0)).toBeNull()
    expect(all.find((row) => row.pattern === `${B4_PRODUCTION_PUBLIC_HOST}/_next/static/*`)?.activationGate)
      .toBe('asset-hit-or-vercel-miss')

    const miss = shouldFallbackHashedStaticMissToVercel(
      new EdgeRequest(`https://${B4_PRODUCTION_PUBLIC_HOST}/_next/static/chunks/app.js`),
      classify('/_next/static/chunks/app.js'),
    )
    expect(miss).toBe(true)
    expect(shouldFallbackHashedStaticMissToVercel(
      new EdgeRequest(`https://${B4_PRODUCTION_PUBLIC_HOST}/en/glasses-guide`),
      classify('/en/glasses-guide'),
    )).toBe(false)
    expect(shouldFallbackHashedStaticMissToVercel(
      new EdgeRequest(`https://${B4_PRODUCTION_PUBLIC_HOST}/images/hero.webp`),
      classify('/images/hero.webp'),
    )).toBe(false)
  })
})

/** @jest-environment node */

import {
  B4_PRODUCTION_PUBLIC_HOST,
  generateB4ProductionWorkerRoutes,
  proposedCloudflareRouteApiPayload,
  routesForPriority,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'

const EXPECTED_UNGATED_P0 = [
  `${B4_PRODUCTION_PUBLIC_HOST}/blog-covers/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/assets/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/images/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/home/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/experience-heroes/*`,
  `${B4_PRODUCTION_PUBLIC_HOST}/favicon.ico`,
  `${B4_PRODUCTION_PUBLIC_HOST}/robots.txt`,
  `${B4_PRODUCTION_PUBLIC_HOST}/llms.txt`,
  `${B4_PRODUCTION_PUBLIC_HOST}/api/health`,
] as const

describe('B4.2D active ungated P0 production routes', () => {
  const all = generateB4ProductionWorkerRoutes()
  const active = routesForPriority('P0', all)
  const payload = proposedCloudflareRouteApiPayload('P0')

  it('activates exactly 9 non-Next P0 routes and never emits hashed static', () => {
    // Vercel owns the Next frontend, so the generator emits ONLY the 9 approved
    // non-Next capabilities. /_next/static is not generated at any priority/gate.
    expect(all).toHaveLength(9)
    expect(all.filter((row) => row.priority === 'P0')).toHaveLength(9)
    expect(active).toHaveLength(9)
    expect(active.map((row) => row.pattern)).toEqual([...EXPECTED_UNGATED_P0])
    expect(active.every((row) => row.priority === 'P0')).toBe(true)
    expect(active.every((row) => row.activationGate === 'none')).toBe(true)
    expect(all.some((row) => row.pattern.includes('/_next/static'))).toBe(false)
    expect(all.some((row) => row.pattern.includes('/_next/'))).toBe(false)
    expect(payload).toHaveLength(9)
    expect(payload.every((row) => row.script === 'visutry-cf-production')).toBe(true)
    expect(payload.every((row) => row.request_limit_fail_open === true)).toBe(true)
  })

  it('keeps P1, P2, catch-all, Store detail, Campaign, Auth, image, and frames off the active set', () => {
    expect(active.some((row) => row.priority === 'P1' || row.priority === 'P2')).toBe(false)
    expect(wwwWorkerRouteMatch('/', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/store/ello-sunglasses', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/c/ello-sunglasses/petite-fit', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/try-on', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/face-analysis', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/pricing', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/en/auth/signin', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/_next/image', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/_next/static/chunks/app.js', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/glasses/frames', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/api/health/foo', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/unknown-crawler-path', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/images', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/imagesfoo', '', active)).toBeNull()
    expect(wwwWorkerRouteMatch('/images/store/store-shopper-experience.png', '', active)?.pattern).toBe(
      `${B4_PRODUCTION_PUBLIC_HOST}/images/*`,
    )
    expect(active.some((row) => row.pattern === `${B4_PRODUCTION_PUBLIC_HOST}/*`)).toBe(false)
  })
})

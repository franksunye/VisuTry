import { buildCoreSitemapEntries } from '@/lib/sitemap-static'
import {
  getVisutryDemoFrameRoute,
  VISUTRY_DEMO_HISTORICAL_CANARY_SLUG,
  VISUTRY_DEMO_MERCHANT_SLUG,
  VISUTRY_DEMO_FRAME_ROUTES,
  visutryDemoFrameProductUrl,
} from '@/lib/visutry-demo-frame-routes'

describe('canonical VisuTry Demo frame routes', () => {
  it('keeps the public frame surface explicit and one-to-one with canonical catalog SKUs', () => {
    expect(VISUTRY_DEMO_FRAME_ROUTES).toHaveLength(6)
    expect(new Set(VISUTRY_DEMO_FRAME_ROUTES.map((route) => route.sku)).size).toBe(6)
    expect(new Set(VISUTRY_DEMO_FRAME_ROUTES.map((route) => route.slug)).size).toBe(6)
    expect(VISUTRY_DEMO_MERCHANT_SLUG).toBe('visutry-demo-optical')
    expect(VISUTRY_DEMO_HISTORICAL_CANARY_SLUG).toBe('visutry-demo')
    expect(VISUTRY_DEMO_FRAME_ROUTES).toEqual([
      { sku: 'VT-DEMO-001', slug: 'round' },
      { sku: 'VT-DEMO-002', slug: 'rectangle' },
      { sku: 'VT-DEMO-003', slug: 'oval' },
      { sku: 'VT-DEMO-004', slug: 'browline' },
      { sku: 'VT-DEMO-005', slug: 'aviator' },
      { sku: 'VT-DEMO-006', slug: 'cat-eye' },
    ])
    expect(getVisutryDemoFrameRoute('round')).toEqual({ sku: 'VT-DEMO-001', slug: 'round' })
    expect(getVisutryDemoFrameRoute('rectangle')).toEqual({ sku: 'VT-DEMO-002', slug: 'rectangle' })
    expect(getVisutryDemoFrameRoute('not-a-demo-frame')).toBeNull()
  })

  it('publishes exact frame destinations in the existing core sitemap', () => {
    const urls = buildCoreSitemapEntries('https://www.visutry.com').map((entry) => entry.url)
    VISUTRY_DEMO_FRAME_ROUTES.forEach(({ slug }) => {
      expect(urls).toContain(visutryDemoFrameProductUrl(slug))
    })
  })
})

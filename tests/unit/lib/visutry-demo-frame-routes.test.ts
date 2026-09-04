import { buildCoreSitemapEntries } from '@/lib/sitemap-static'
import {
  getVisutryDemoFrameRoute,
  VISUTRY_DEMO_FRAME_ROUTES,
  visutryDemoFrameProductUrl,
} from '@/lib/visutry-demo-frame-routes'

describe('VisuTry Demo discovery canary frame routes', () => {
  it('keeps the public frame surface explicit and one-to-one with the six first-party SKUs', () => {
    expect(VISUTRY_DEMO_FRAME_ROUTES).toHaveLength(6)
    expect(new Set(VISUTRY_DEMO_FRAME_ROUTES.map((route) => route.sku)).size).toBe(6)
    expect(new Set(VISUTRY_DEMO_FRAME_ROUTES.map((route) => route.slug)).size).toBe(6)
    expect(getVisutryDemoFrameRoute('round')).toEqual({ sku: 'VT-DEMO-ROUND-01', slug: 'round' })
    expect(getVisutryDemoFrameRoute('not-a-demo-frame')).toBeNull()
  })

  it('publishes exact frame destinations in the existing core sitemap', () => {
    const urls = buildCoreSitemapEntries('https://www.visutry.com').map((entry) => entry.url)
    VISUTRY_DEMO_FRAME_ROUTES.forEach(({ slug }) => {
      expect(urls).toContain(visutryDemoFrameProductUrl(slug))
    })
  })
})

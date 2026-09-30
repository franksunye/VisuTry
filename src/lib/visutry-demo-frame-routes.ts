/**
 * The deliberately small, first-party discovery surface for the canonical VisuTry Demo.
 * Keep this manifest explicit so public routes cannot expose arbitrary catalog rows.
 */
export const VISUTRY_DEMO_FRAME_ROUTES = [
  { sku: 'VT-DEMO-001', slug: 'round' },
  { sku: 'VT-DEMO-002', slug: 'rectangle' },
  { sku: 'VT-DEMO-003', slug: 'oval' },
  { sku: 'VT-DEMO-004', slug: 'browline' },
  { sku: 'VT-DEMO-005', slug: 'aviator' },
  { sku: 'VT-DEMO-006', slug: 'cat-eye' },
] as const

export const VISUTRY_DEMO_MERCHANT_SLUG = 'visutry-demo-optical'
export const VISUTRY_DEMO_HISTORICAL_CANARY_SLUG = 'visutry-demo'

export function visutryDemoFramePath(slug: string): string {
  return `/demo/frames/${slug}`
}

export function visutryDemoFrameProductUrl(slug: string, baseUrl = 'https://www.visutry.com'): string {
  return `${baseUrl.replace(/\/+$/, '')}/en${visutryDemoFramePath(slug)}`
}

export function getVisutryDemoFrameRoute(slug: string) {
  return VISUTRY_DEMO_FRAME_ROUTES.find((route) => route.slug === slug) ?? null
}

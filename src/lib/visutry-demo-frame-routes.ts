/**
 * The deliberately small, first-party discovery surface for VisuTry Demo.
 * Keep this manifest explicit so public routes cannot expose arbitrary catalog rows.
 */
export const VISUTRY_DEMO_FRAME_ROUTES = [
  { sku: 'VT-DEMO-ROUND-01', slug: 'round' },
  { sku: 'VT-DEMO-RECT-01', slug: 'rectangle' },
  { sku: 'VT-DEMO-OVAL-01', slug: 'oval' },
  { sku: 'VT-DEMO-BROW-01', slug: 'browline' },
  { sku: 'VT-DEMO-AVI-01', slug: 'aviator' },
  { sku: 'VT-DEMO-CAT-01', slug: 'cat-eye' },
] as const

export const VISUTRY_DEMO_MERCHANT_SLUG = 'visutry-demo'

export function visutryDemoFramePath(slug: string): string {
  return `/demo/frames/${slug}`
}

export function visutryDemoFrameProductUrl(slug: string, baseUrl = 'https://www.visutry.com'): string {
  return `${baseUrl.replace(/\/+$/, '')}/en${visutryDemoFramePath(slug)}`
}

export function getVisutryDemoFrameRoute(slug: string) {
  return VISUTRY_DEMO_FRAME_ROUTES.find((route) => route.slug === slug) ?? null
}

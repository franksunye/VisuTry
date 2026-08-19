/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import {
  B4_PRODUCTION_PUBLIC_HOST,
  generateB4ProductionWorkerRoutes,
  routesForPriority,
  wwwWorkerRouteMatch,
} from '../../cloudflare-router/b4-production-routes'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import { getLocalizedCombinationSearchPage } from '@/config/search-combination-locales'

const ROOT = path.join(__dirname, '../..')
const OPEN_NEXT_CONFIG = path.join(ROOT, 'open-next.config.ts')
const PACKAGE_JSON = path.join(ROOT, 'package.json')
const POPULATE_SCRIPT = path.join(ROOT, 'scripts/populate-opennext-static-assets-cache.mjs')
const EXPECTED_CACHE_NAME = 'cf-static-assets-incremental-cache'

function classify(pathname: string, method = 'GET') {
  return classifyB4ProductionPublicSlice({
    url: `https://${B4_PRODUCTION_PUBLIC_HOST}${pathname}`,
    method,
    headers: { get() { return null } },
  } as unknown as Request)
}

describe('OpenNext static-assets incremental cache production config', () => {
  it('does not leave defineCloudflareConfig() on the dummy default', () => {
    const source = fs.readFileSync(OPEN_NEXT_CONFIG, 'utf8')
    expect(source).toMatch(/staticAssetsIncrementalCache/)
    expect(source).toMatch(/incrementalCache:\s*staticAssetsIncrementalCache/)
    expect(source).not.toMatch(/export default defineCloudflareConfig\(\s*\)/)
    expect(source).not.toMatch(/incrementalCache:\s*['"]dummy['"]/)
  })

  it('wires populate into the production Cloudflare build path', () => {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8')) as { scripts: Record<string, string> }
    expect(pkg.scripts['build:cloudflare']).toMatch(/populate-opennext-static-assets-cache\.mjs/)
    expect(fs.existsSync(POPULATE_SCRIPT)).toBe(true)
    const populate = fs.readFileSync(POPULATE_SCRIPT, 'utf8')
    expect(populate).toMatch(/cdn-cgi\/_next_cache/)
    expect(populate).toMatch(/\.open-next\/cache/)
  })

  const compiledPath = path.join(ROOT, '.open-next', '.build', 'open-next.config.mjs')
  const compiledConfigCase = fs.existsSync(compiledPath) ? it : it.skip

  compiledConfigCase(
    'compiles to the static-assets incremental cache in the OpenNext build output',
    () => {
      const compiled = fs.readFileSync(compiledPath, 'utf8')
      expect(compiled).toMatch(/cf-static-assets-incremental-cache/)
      expect(compiled).not.toMatch(/incrementalCache:\s*"dummy"/)
    },
  )

  it('keeps the 12 non-Next P0 routes and classifies Glasses Guide as Vercel-owned', () => {
    const all = generateB4ProductionWorkerRoutes()
    const existingP0 = routesForPriority('P0', all)

    expect(existingP0).toHaveLength(12)
    // Glasses Guide HTML is part of the Next frontend → Vercel owns it.
    expect(classify('/en/glasses-guide')).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    expect(classify('/de/glasses-guide/best-rectangle-glasses-for-round-face')).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
    })
    expect(wwwWorkerRouteMatch('/api/health', '', existingP0)?.pattern).toBe(
      `${B4_PRODUCTION_PUBLIC_HOST}/api/health`,
    )
    expect(existingP0.some((row) => row.pattern.includes('glasses-guide'))).toBe(false)
  })

  it('does not promote P0-F2 SEO routes into the P0 slice (face-shapes, sunglasses-for, hairstyles-for, style, blog)', () => {
    const existingP0 = routesForPriority('P0', generateB4ProductionWorkerRoutes())

    for (const pathname of [
      '/en/face-shapes/oval',
      '/en/sunglasses-for/round',
      '/en/hairstyles-for/round',
      '/en/style/round-face',
      '/en/blog/how-to-choose-glasses-for-your-face',
    ]) {
      expect(wwwWorkerRouteMatch(pathname, '', existingP0)).toBeNull()
    }
  })

  it('keeps known Glasses Guide detail slugs valid and unknown slugs closed', () => {
    const glassesGuidePage = require('@/app/[locale]/(main)/glasses-guide/[slug]/page') as {
      dynamic: string
      dynamicParams: boolean
    }
    expect(glassesGuidePage.dynamic).toBe('force-static')
    expect(process.env.CLOUDFLARE_BUILD).toBeUndefined()
    expect(glassesGuidePage.dynamicParams).toBe(false)

    const validSlugs = [
      'best-rectangle-glasses-for-round-face',
      'best-square-glasses-for-round-face',
      'best-browline-glasses-for-round-face',
    ]
    for (const slug of validSlugs) {
      expect(COMBINATION_SEARCH_PAGES.some((page) => page.slug === slug)).toBe(true)
      expect(getLocalizedCombinationSearchPage('en', slug)?.slug).toBe(slug)
      expect(getLocalizedCombinationSearchPage('de', slug)?.slug).toBe(slug)
      expect(getLocalizedCombinationSearchPage('ar', slug)?.slug).toBe(slug)
    }
    expect(getLocalizedCombinationSearchPage('en', 'definitely-invalid-slug')).toBeUndefined()
  })
})

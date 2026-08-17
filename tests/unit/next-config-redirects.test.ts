/** @jest-environment node */

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }))
jest.mock('next-intl/middleware', () => jest.fn())
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn() },
  getRequestContext: jest.fn(() => ({})),
}))

import { config as middlewareConfig } from '@/middleware'

type Redirect = { source: string; destination: string; permanent?: boolean }

async function loadRedirects(): Promise<Redirect[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require('../../next.config.js')
  const config = loaded.default ?? loaded
  if (typeof config.redirects !== 'function') {
    throw new Error('next.config.js did not export redirects()')
  }
  const result = await config.redirects()
  if (Array.isArray(result)) return result
  return [
    ...(result.beforeFiles ?? []),
    ...(result.afterFiles ?? []),
    ...(result.fallback ?? []),
  ]
}

function matchSource(source: string, pathname: string): Record<string, string> | null {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const sourceParts = source.split('/').filter(Boolean)
  const pathParts = normalized.split('/').filter(Boolean)
  if (source === '/' ) return normalized === '/' ? {} : null
  if (sourceParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < sourceParts.length; i += 1) {
    const part = sourceParts[i]
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i]
      continue
    }
    if (part !== pathParts[i]) return null
  }
  return params
}

function applyRedirect(pathname: string, redirects: Redirect[]): string | null {
  for (const rule of redirects) {
    const params = matchSource(rule.source, pathname)
    if (!params) continue
    let destination = rule.destination
    for (const [key, value] of Object.entries(params)) {
      destination = destination.replace(`:${key}`, value)
    }
    return destination
  }
  return null
}

function followRedirects(pathname: string, redirects: Redirect[], limit = 5) {
  const hops = [pathname]
  let current = pathname
  for (let i = 0; i < limit; i += 1) {
    const next = applyRedirect(current, redirects)
    if (!next) return hops
    hops.push(next)
    current = next
  }
  throw new Error(`redirect loop or hop limit exceeded: ${hops.join(' -> ')}`)
}

function matcherHits(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true
  const localeLess = middlewareConfig.matcher.find((rule) => rule.includes('(?!'))
  if (!localeLess) throw new Error('locale-less matcher missing')
  return new RegExp(`^${localeLess}$`).test(pathname)
}

describe('locale-less marketing redirects', () => {
  let redirects: Redirect[] = []

  beforeAll(async () => {
    redirects = await loadRedirects()
    expect(redirects.length).toBeGreaterThan(10)
  })

  const cases: Array<{ path: string; expected: string | null; note: string }> = [
    { path: '/', expected: null, note: 'root stays with next-intl Accept-Language' },
    { path: '/en', expected: null, note: 'localized home is not rewritten' },
    { path: '/ar', expected: null, note: 'non-English locale home is not rewritten' },
    { path: '/faq', expected: '/en/faq', note: 'locale-less marketing page' },
    { path: '/en/faq', expected: null, note: 'already localized marketing page' },
    { path: '/face-shapes', expected: '/en/face-shapes', note: 'locale-less SEO hub' },
    { path: '/en/face-shapes', expected: null, note: 'localized SEO hub' },
    { path: '/brand/warby-parker', expected: '/en/brand/warby-parker', note: 'locale-less brand' },
    { path: '/en/brand/warby-parker', expected: null, note: 'localized brand' },
    { path: '/store', expected: '/en/store', note: 'locale-less store hub' },
    { path: '/en/store', expected: null, note: 'localized store hub' },
    { path: '/en/store/luna-optical', expected: null, note: 'localized merchant store' },
    { path: '/store/luna-optical', expected: '/en/store/luna-optical', note: 'locale-less merchant store' },
    { path: '/en/c/luna-optical/petite-fit', expected: null, note: 'localized campaign' },
    { path: '/c/luna-optical/petite-fit', expected: '/en/c/luna-optical/petite-fit', note: 'locale-less campaign' },
    { path: '/api/health', expected: null, note: 'public health API' },
    { path: '/api/auth/session', expected: null, note: 'Auth.js session' },
    { path: '/api/auth/callback/auth0', expected: null, note: 'Auth0 callback' },
    { path: '/admin/dashboard', expected: null, note: 'admin is not localized' },
    { path: '/skills/merchant', expected: null, note: 'public skill document' },
    { path: '/sitemaps/dynamic.xml', expected: null, note: 'sitemap endpoint' },
    { path: '/robots.txt', expected: null, note: 'robots.txt' },
    { path: '/_next/static/example.js', expected: null, note: 'Next static asset' },
    { path: '/en/merchant', expected: null, note: 'localized merchant console' },
  ]

  it.each(cases)('$path → $expected ($note)', ({ path, expected }) => {
    const hops = followRedirects(path, redirects)
    const actual = hops.length === 1 ? null : hops[hops.length - 1]
    expect(actual).toBe(expected)
    expect(hops.length).toBeLessThanOrEqual(2)
  })

  it('does not create a second hop after a locale-less marketing redirect', () => {
    for (const path of ['/faq', '/store', '/brand/warby-parker', '/face-shapes/oval', '/try-on/glasses']) {
      const hops = followRedirects(path, redirects)
      expect(hops).toHaveLength(2)
      expect(hops[1].startsWith('/en/')).toBe(true)
      expect(applyRedirect(hops[1], redirects)).toBeNull()
    }
  })
})

describe('middleware matcher vs redirects', () => {
  it('still intercepts / for Accept-Language and /admin for auth', () => {
    expect(matcherHits('/')).toBe(true)
    expect(matcherHits('/admin/dashboard')).toBe(true)
  })

  it('does not intercept localized pages, APIs, skills, sitemaps, or assets', () => {
    const skipped = [
      '/en',
      '/ar',
      '/en/faq',
      '/en/store/luna-optical',
      '/en/merchant',
      '/api/health',
      '/api/auth/callback/auth0',
      '/skills/merchant',
      '/sitemaps/dynamic.xml',
      '/robots.txt',
      '/_next/static/example.js',
    ]
    for (const path of skipped) {
      expect(matcherHits(path)).toBe(false)
    }
  })
})

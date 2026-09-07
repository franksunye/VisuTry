/** @jest-environment node */

import {
  D1_CACHE_PURGE_FILES,
  D1_CACHE_PURGE_PREFIXES,
  D1_CACHE_RULE_EDGE_TTL_SECONDS,
  D1_CACHE_RULE_EXPRESSION,
  D1_LOCALES,
  D1_ROUTE_FAMILIES,
  D1_CACHE_RULE_REPRESENTATION,
  d1CachePurgePlan,
  isD1CacheEligible,
} from '../../cloudflare-router/d1-cache-governance'

function request(path: string, init: RequestInit = {}) {
  return new Request(`https://www.visutry.com${path}`, init)
}

describe('D1 production HTML cache governance contract', () => {
  it('allows only anonymous, queryless GET/HEAD document candidates', () => {
    expect(isD1CacheEligible(request('/en/glasses-guide/round-face'))).toBe(true)
    expect(isD1CacheEligible(request('/en/style/round-face', { method: 'HEAD' }))).toBe(true)
    expect(isD1CacheEligible(request('/fr/sunglasses-for/oval-face'))).toBe(true)
  })

  it.each([
    ['Authorization', { authorization: 'Bearer token' }],
    ['Cookie', { cookie: 'foo=bar' }],
    ['RSC', { rsc: '1' }],
    ['Next Router Prefetch', { 'next-router-prefetch': '1' }],
    ['Next Router State Tree', { 'next-router-state-tree': 'tree' }],
    ['Next URL', { 'next-url': '/en/style/round-face' }],
    ['Flight Accept', { accept: 'text/x-component' }],
    ['Purpose prefetch', { purpose: 'prefetch' }],
    ['Purpose prerender', { purpose: 'prerender' }],
    ['Sec-Purpose prefetch', { 'sec-purpose': 'prefetch' }],
    ['Sec-Purpose prerender', { 'sec-purpose': 'prerender' }],
  ])('bypasses %s', (_name, headers) => {
    expect(isD1CacheEligible(request('/en/style/round-face', { headers }))).toBe(false)
  })

  it('bypasses non-empty queries, wrong methods, wrong hosts, and unknown routes', () => {
    expect(isD1CacheEligible(request('/en/style/round-face?x=1'))).toBe(false)
    expect(isD1CacheEligible(request('/en/style/round-face', { method: 'POST' }))).toBe(false)
    expect(isD1CacheEligible(new Request('https://visutry.com/en/style/round-face'))).toBe(false)
    expect(isD1CacheEligible(request('/en/style-explorer'))).toBe(false)
    expect(isD1CacheEligible(request('/en/brand/example'))).toBe(false)
    expect(isD1CacheEligible(request('/_next/static/chunks/app.js'))).toBe(false)
    expect(isD1CacheEligible(request('/sitemaps/core.xml'))).toBe(false)
  })

  it('does not broaden a family prefix to a sibling path', () => {
    expect(isD1CacheEligible(request('/en/style'))).toBe(true)
    expect(isD1CacheEligible(request('/en/style/round-face'))).toBe(true)
    expect(isD1CacheEligible(request('/en/styleful/round-face'))).toBe(false)
    expect(isD1CacheEligible(request('/en/glasses-guide'))).toBe(true)
    expect(isD1CacheEligible(request('/en/glasses-guide/'))).toBe(true)
  })

  it('contains the complete explicit route and bypass matrix', () => {
    for (const locale of D1_LOCALES) {
      for (const family of D1_ROUTE_FAMILIES) {
        expect(D1_CACHE_RULE_EXPRESSION).toContain(`/${locale}${family}`)
      }
    }
    for (const clause of [
      'not has_key(http.request.headers, "authorization")',
      'not has_key(http.request.headers, "cookie")',
      'not has_key(http.request.headers, "rsc")',
      'not has_key(http.request.headers, "next-router-prefetch")',
      'not has_key(http.request.headers, "next-router-state-tree")',
      'not has_key(http.request.headers, "next-url")',
      'text/x-component',
      'purpose',
      'sec-purpose',
    ]) {
      expect(D1_CACHE_RULE_EXPRESSION).toContain(clause)
    }
    expect(D1_CACHE_RULE_EXPRESSION).not.toContain('http.cookie contains "next-auth.session-token"')
  })

  it('keeps browser caching bypassed and edge TTL at one hour', () => {
    expect(D1_CACHE_RULE_REPRESENTATION.actionParameters.browserTtl.mode).toBe('bypass')
    expect(D1_CACHE_RULE_REPRESENTATION.actionParameters.edgeTtl).toEqual({
      mode: 'override_origin',
      default: D1_CACHE_RULE_EDGE_TTL_SECONDS,
    })
    expect(D1_CACHE_RULE_REPRESENTATION.actionParameters.edgeTtl.default).toBe(3600)
  })

  it('limits invalidation to the 27 family roots and 27 trailing-slash prefixes', () => {
    expect(D1_CACHE_PURGE_PREFIXES).toHaveLength(27)
    expect(D1_CACHE_PURGE_FILES).toHaveLength(27)
    expect(new Set(D1_CACHE_PURGE_PREFIXES).size).toBe(27)
    expect(new Set(D1_CACHE_PURGE_FILES).size).toBe(27)
    expect(D1_CACHE_PURGE_PREFIXES.every((prefix) => prefix.startsWith('https://www.visutry.com/'))).toBe(true)
    expect(D1_CACHE_PURGE_FILES.every((file) => file.startsWith('https://www.visutry.com/'))).toBe(true)
    expect(D1_CACHE_PURGE_PREFIXES.some((prefix) => prefix.includes('_next'))).toBe(false)
    expect(D1_CACHE_PURGE_PREFIXES.some((prefix) => prefix.includes('sitemaps'))).toBe(false)
    expect(d1CachePurgePlan().mechanism).toBe('Cloudflare zone purge_cache with exact files and trailing-slash prefixes')
    expect(d1CachePurgePlan().count).toBe(54)
  })
})

/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import {
  D1_CACHE_PURGE_PREFIXES,
  D1_CACHE_RULE_API_RULE,
  D1_CACHE_RULE_EDGE_TTL_SECONDS,
  D1_CACHE_RULE_ID,
  D1_CACHE_RULE_EXPRESSION,
  D1_LOCALES,
  D1_ROUTE_FAMILIES,
  compareD1LiveRule,
  d1CachePurgePlan,
  d1CachePurgeRequestBody,
  extractD1LiveRuleFromEntrypoint,
  isCloudflarePurgeSuccessful,
  isD1CacheEligible,
  isVercelProductionDeploymentProofValid,
  readVercelVerificationConfig,
  resolveVercelDeploymentTeamId,
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
    expect(isD1CacheEligible(request('/en/style'))).toBe(false)
    expect(isD1CacheEligible(request('/en/style/round-face'))).toBe(true)
    expect(isD1CacheEligible(request('/en/style/'))).toBe(false)
    expect(isD1CacheEligible(request('/en/styleful/round-face'))).toBe(false)
    expect(isD1CacheEligible(request('/en/glasses-guide'))).toBe(false)
    expect(isD1CacheEligible(request('/en/glasses-guide/'))).toBe(false)
    expect(isD1CacheEligible(request('/en/sunglasses-for'))).toBe(false)
    expect(isD1CacheEligible(request('/en/sunglasses-for/'))).toBe(false)
    expect(isD1CacheEligible(request('/en/style-explorer'))).toBe(false)
    expect(isD1CacheEligible(request('/en/glasses-guide-old'))).toBe(false)
    expect(isD1CacheEligible(request('/en/sunglasses-format'))).toBe(false)
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
      'not http.request.headers.truncated',
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
    expect(D1_CACHE_RULE_EXPRESSION).toContain('starts_with(http.request.uri.path, "/en/style/")')
    expect(D1_CACHE_RULE_EXPRESSION).toContain('http.request.uri.path ne "/en/style/"')
    expect(D1_CACHE_RULE_EXPRESSION).not.toContain('http.request.uri.path eq "/en/style"')
    expect(D1_CACHE_RULE_EXPRESSION).not.toContain('http.cookie contains "next-auth.session-token"')
  })

  it('fails closed when Cloudflare reports truncated headers', () => {
    expect(isD1CacheEligible(request('/en/style/round-face'), { headersTruncated: true })).toBe(false)
  })

  it('uses an API-exact Rulesets rule shape with no invented Vary object', () => {
    expect(D1_CACHE_RULE_API_RULE).toEqual({
      ref: 'visutry-d1-seo-html-cache-shield',
      description: 'VisuTry D1 - SEO HTML Cache Shield',
      expression: D1_CACHE_RULE_EXPRESSION,
      action: 'set_cache_settings',
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: 'override_origin',
          default: D1_CACHE_RULE_EDGE_TTL_SECONDS,
        },
        browser_ttl: { mode: 'bypass_by_default' },
      },
      enabled: true,
    })
    expect('vary' in D1_CACHE_RULE_API_RULE.action_parameters).toBe(false)
  })

  it('uses the plan-safe two-hour edge TTL', () => {
    expect(D1_CACHE_RULE_EDGE_TTL_SECONDS).toBe(7200)
    expect(D1_CACHE_RULE_API_RULE.action_parameters.edge_ttl).toEqual({
      mode: 'override_origin',
      default: 7200,
    })
    expect(D1_CACHE_RULE_API_RULE.action_parameters.browser_ttl).toEqual({ mode: 'bypass_by_default' })
  })

  it('uses one prefixes-only purge request for exactly 27 family prefixes', () => {
    expect(D1_CACHE_PURGE_PREFIXES).toHaveLength(27)
    expect(new Set(D1_CACHE_PURGE_PREFIXES).size).toBe(27)
    expect(D1_CACHE_PURGE_PREFIXES.every((prefix) => !prefix.includes('://') && !prefix.includes('?') && !prefix.includes('*'))).toBe(true)
    expect(D1_CACHE_PURGE_PREFIXES.every((prefix) => prefix.endsWith('/'))).toBe(true)
    expect(D1_CACHE_PURGE_PREFIXES).toContain('www.visutry.com/en/glasses-guide/')
    expect(D1_CACHE_PURGE_PREFIXES).toContain('www.visutry.com/en/style/')
    expect(D1_CACHE_PURGE_PREFIXES).toContain('www.visutry.com/en/sunglasses-for/')
    expect(D1_CACHE_PURGE_PREFIXES.some((prefix) => prefix.includes('_next'))).toBe(false)
    expect(D1_CACHE_PURGE_PREFIXES.some((prefix) => prefix.includes('sitemaps'))).toBe(false)
    expect(d1CachePurgePlan()).toMatchObject({ purgeType: 'prefixes', prefixCount: 27 })
    expect(d1CachePurgeRequestBody()).toEqual({ prefixes: D1_CACHE_PURGE_PREFIXES })
    expect(Object.keys(d1CachePurgeRequestBody())).toEqual(['prefixes'])
  })

  it('fails closed on Cloudflare API failures', () => {
    expect(isCloudflarePurgeSuccessful(200, { success: true })).toBe(true)
    expect(isCloudflarePurgeSuccessful(500, { success: true })).toBe(false)
    expect(isCloudflarePurgeSuccessful(200, { success: false })).toBe(false)
  })

  it('requires independent Vercel verification credentials', () => {
    expect(() => readVercelVerificationConfig({})).toThrow('missing Vercel verification configuration')
  })

  it('rejects forged or unverified Vercel deployment proof', () => {
    const config = {
      projectId: 'prj_visutry',
      teamId: 'team_visutry',
      deploymentId: 'dpl_expected',
      expectedGitSha: 'sha_expected',
      productionAlias: 'www.visutry.com',
    }
    const validProof = {
      id: 'dpl_expected',
      projectId: 'prj_visutry',
      teamId: 'team_visutry',
      target: 'production',
      readyState: 'READY',
      gitSha: 'sha_expected',
      aliases: ['www.visutry.com'],
    } as const
    expect(isVercelProductionDeploymentProofValid(validProof, config)).toBe(true)
    expect(isVercelProductionDeploymentProofValid({ ...validProof, readyState: 'BUILDING' }, config)).toBe(false)
    expect(isVercelProductionDeploymentProofValid({ ...validProof, aliases: [] }, config)).toBe(false)
    expect(isVercelProductionDeploymentProofValid({ ...validProof, gitSha: 'sha_forged' }, config)).toBe(false)
  })

  it('resolves the Vercel deployment team from current and legacy API response shapes', () => {
    expect(resolveVercelDeploymentTeamId({ teamId: 'team_direct', ownerId: 'team_owner' })).toBe('team_direct')
    expect(resolveVercelDeploymentTeamId({ ownerId: 'team_owner' })).toBe('team_owner')
    expect(resolveVercelDeploymentTeamId({ team: { id: 'team_nested' } })).toBe('team_nested')
    expect(resolveVercelDeploymentTeamId({ team: { slug: 'sunye' } })).toBe('')
  })

  it('reports live rule drift without mutating anything', () => {
    const report = compareD1LiveRule(null)
    expect(report.matches).toBe(false)
    expect(report.mismatches).toContain('live D1 rule not found')
  })

  it('does not mistake List Rulesets metadata for rule contents', () => {
    const metadataOnly = {
      success: true,
      result: [{ id: 'rs_cache', name: 'zone-cache-rules', phase: 'http_request_cache_settings', kind: 'zone' }],
    }
    expect(extractD1LiveRuleFromEntrypoint(metadataOnly)).toBeNull()
    expect(extractD1LiveRuleFromEntrypoint({ success: false, result: { rules: [] } })).toBeNull()
  })

  it('parses the entrypoint rules array, prefers ID, and records array order', () => {
    const fixture = {
      success: true,
      result: {
        id: 'rs_cache',
        phase: 'http_request_cache_settings',
        rules: [
          {
            id: D1_CACHE_RULE_ID,
            ref: 'visutry-d1-seo-html-cache-shield',
            description: 'VisuTry D1 - SEO HTML Cache Shield',
            expression: D1_CACHE_RULE_EXPRESSION,
            action: 'set_cache_settings',
            action_parameters: {
              browser_ttl: { mode: 'bypass_by_default' },
              edge_ttl: { default: 7200, mode: 'override_origin' },
              cache: true,
            },
            enabled: true,
          },
          {
            id: 'other-rule',
            ref: 'other',
            description: 'Other rule',
            expression: 'true',
            action: 'set_cache_settings',
            action_parameters: { cache: false },
            enabled: true,
          },
        ],
      },
    }
    const actual = extractD1LiveRuleFromEntrypoint(fixture)
    expect(actual).toMatchObject({ id: D1_CACHE_RULE_ID, order: 1 })
    expect(compareD1LiveRule(actual).matches).toBe(true)
  })

  it('falls back to description/ref, and missing D1 remains fail-closed', () => {
    const fallback = extractD1LiveRuleFromEntrypoint({
      success: true,
      result: {
        rules: [{
          id: 'new-rule-id',
          ref: 'visutry-d1-seo-html-cache-shield',
          description: 'VisuTry D1 - SEO HTML Cache Shield',
          expression: D1_CACHE_RULE_EXPRESSION,
          action: 'set_cache_settings',
          action_parameters: D1_CACHE_RULE_API_RULE.action_parameters,
          enabled: true,
        }],
      },
    })
    expect(fallback).not.toBeNull()
    expect(compareD1LiveRule(fallback).matches).toBe(false)
    expect(extractD1LiveRuleFromEntrypoint({ result: { rules: [] } })).toBeNull()
  })

  it('canonicalizes action parameters regardless of JSON property order', () => {
    const actual = {
      id: D1_CACHE_RULE_ID,
      expression: D1_CACHE_RULE_EXPRESSION,
      action: 'set_cache_settings',
      action_parameters: {
        browser_ttl: { mode: 'bypass_by_default' },
        edge_ttl: { default: 7200, mode: 'override_origin' },
        cache: true,
      },
      enabled: true,
      order: 1,
    }
    expect(compareD1LiveRule(actual).matches).toBe(true)
  })

  it('offers manual workflow dispatch but keeps the same verification gate', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/d1-cache-invalidation.yml'), 'utf8')
    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('deployment_id')
    expect(workflow).toContain('git_sha')
    expect(workflow).toContain('--verify-vercel')
    expect(workflow).toContain("echo 'D1_CACHE_PURGE_APPROVED=1' >> \"$GITHUB_ENV\"")
  })
})

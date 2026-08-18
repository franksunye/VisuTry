/** @jest-environment node */

import { generateB4ProductionWorkerRoutes, requireFrozenWwwDnsTarget, routesForPriority } from '../../cloudflare-router/b4-production-routes'
import {
  compareDesiredToCloudflare,
  loadDesiredDnsRecords,
  normalizeDnsContent,
  recordKey,
} from '../../cloudflare-router/b4-dns-zone-diff'

describe('B4.2C Phase A DNS zone diff', () => {
  const desired = loadDesiredDnsRecords()

  it('keeps www PROXIED after B3 with historical nsCutoverProxy DNS_ONLY', () => {
    const www = desired.find((row) => row.name === 'www' && row.type === 'CNAME')
    expect(www?.content).toBe('cname.vercel-dns-017.com')
    expect(www?.proxied).toBe(true)
    expect(www?.futureProxy).toBe('PROXIED')
    expect(www?.nsCutoverProxy).toBe('DNS_ONLY')
    expect(desired.some((row) => row.name === '@' && row.type === 'MX' && row.priority === 5 && row.content === 'mxbiz1.qq.com' && row.proxied === false)).toBe(true)
    expect(desired.some((row) => row.name === 'auth' && row.proxied === false)).toBe(true)
    expect(desired.filter((row) => row.name === 'www').every((row) => row.proxied === true)).toBe(true)
    expect(desired.filter((row) => row.type === 'CAA').every((row) => row.proxied === false)).toBe(true)
    expect(desired.filter((row) => row.type === 'CAA').map((row) => row.content).sort()).toEqual([
      '0 issue "letsencrypt.org"',
      '0 issue "pki.goog"',
      '0 issue "sectigo.com"',
    ].sort())
    expect(generateB4ProductionWorkerRoutes().length).toBe(286)
    expect(routesForPriority('P0').length).toBe(12)
  })

  it('skips when the Cloudflare dump is empty', () => {
    const report = compareDesiredToCloudflare({ desired, remote: [] })
    expect(report.status).toBe('skipped')
    expect(report.reason).toMatch(/no Cloudflare DNS dump/)
  })

  it('passes an exact remote copy and fails extra catch-all or proxied mail', () => {
    const remote = desired.map((row) => ({
      name: row.name === '@' ? 'visutry.com' : `${row.name}.visutry.com`,
      type: row.type,
      content: row.content,
      priority: row.priority,
      proxied: row.proxied,
    }))
    expect(compareDesiredToCloudflare({ desired, remote }).status).toBe('pass')
    const extra = [...remote, { name: 'visutry.com', type: 'A', content: '1.2.3.4', proxied: true }]
    expect(compareDesiredToCloudflare({ desired, remote: extra }).findings.some((row) => row.kind === 'unexpected')).toBe(true)
    const proxiedMx = remote.map((row) => (
      row.type === 'MX' && row.name === 'visutry.com'
        ? { ...row, proxied: true }
        : row
    ))
    expect(compareDesiredToCloudflare({ desired, remote: proxiedMx }).findings.some((row) => row.kind === 'proxy')).toBe(true)
    const dnsOnlyWww = remote.map((row) => (
      row.type === 'CNAME' && row.name === 'www.visutry.com'
        ? { ...row, proxied: false }
        : row
    ))
    const wwwProxyFail = compareDesiredToCloudflare({ desired, remote: dnsOnlyWww })
    expect(wwwProxyFail.status).toBe('fail')
    expect(wwwProxyFail.findings.some((row) => row.kind === 'proxy' && row.record.includes('www') && row.actual === 'DNS_ONLY')).toBe(true)
  })

  it('normalizes trailing dots and TXT quotes', () => {
    expect(normalizeDnsContent('CNAME', 'cname.vercel-dns-017.com.')).toBe('cname.vercel-dns-017.com')
    expect(normalizeDnsContent('TXT', '"v=spf1 include:spf.mail.qq.com ~all"')).toBe('v=spf1 include:spf.mail.qq.com ~all')
    expect(recordKey({
      name: 'www',
      type: 'CNAME',
      content: 'cname.vercel-dns-017.com.',
    })).toBe(recordKey({
      name: 'www.visutry.com',
      type: 'CNAME',
      content: 'cname.vercel-dns-017.com',
    }))
  })

  it('still rejects undocumented example Vercel CNAMEs without an inspect timestamp', () => {
    expect(() => requireFrozenWwwDnsTarget({
      domain: 'www.visutry.com',
      resolved: true,
      inspectedAt: null,
      command: 'vercel domains inspect www.visutry.com',
      recordType: 'CNAME',
      target: 'cname.vercel-dns.com',
      examplesThatMustNotBeAssumed: ['cname.vercel-dns.com', 'cname.vercel-dns-0.com'],
    })).toThrow(/docs example/)
  })
})

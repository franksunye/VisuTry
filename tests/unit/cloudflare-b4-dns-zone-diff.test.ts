/** @jest-environment node */

import { requireFrozenWwwDnsTarget } from '../../cloudflare-router/b4-production-routes'
import {
  compareDesiredToCloudflare,
  loadDesiredDnsRecords,
  normalizeDnsContent,
  recordKey,
} from '../../cloudflare-router/b4-dns-zone-diff'

describe('B4.2C Phase A DNS zone diff', () => {
  const desired = loadDesiredDnsRecords()

  it('loads the prepared desired Cloudflare records including frozen www CNAME', () => {
    expect(desired.some((row) => row.name === 'www' && row.type === 'CNAME' && row.content === 'cname.vercel-dns-017.com' && row.proxied === true)).toBe(true)
    expect(desired.some((row) => row.name === '@' && row.type === 'MX' && row.priority === 5 && row.content === 'mxbiz1.qq.com' && row.proxied === false)).toBe(true)
    expect(desired.some((row) => row.name === 'auth' && row.proxied === false)).toBe(true)
    expect(desired.every((row) => row.name !== 'www' || row.proxied === true || row.type !== 'CNAME')).toBe(true)
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

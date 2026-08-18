/**
 * Compare the prepared Cloudflare DNS desired state against a remote
 * Cloudflare zone dump. Live Vercel ALIAS flattening to anycast A is
 * expected and is not treated as a Cloudflare-zone mismatch.
 *
 *   npx tsx cloudflare-router/b4-dns-zone-diff.ts
 *   npx tsx cloudflare-router/b4-dns-zone-diff.ts --from-json cf-zone-records.json
 *
 * Exit: 0 pass, 1 fail, 2 skipped (no Cloudflare dump; zone not populated)
 */

import fs from 'node:fs'
import path from 'node:path'

export const B4_DESIRED_DNS_PATH = 'cloudflare-router/b4-production-dns.desired.json'

export interface B4DesiredDnsRecord {
  name: string
  type: string
  content: string
  priority?: number
  proxied: boolean
  futureProxy?: string
  nsCutoverProxy?: string
  reason?: string
}

export interface B4CloudflareDnsRecord {
  name?: string
  type?: string
  content?: string
  priority?: number
  proxied?: boolean
}

export interface B4DnsDiffFinding {
  kind:
    | 'missing'
    | 'unexpected'
    | 'value'
    | 'mx-priority'
    | 'txt'
    | 'caa'
    | 'proxy'
  record: string
  expected?: string
  actual?: string
}

export interface B4DnsDiffReport {
  status: 'pass' | 'fail' | 'skipped'
  reason: string
  desiredCount: number
  remoteCount: number
  ttlDifferencesIgnored: true
  findings: B4DnsDiffFinding[]
}

function fqdn(name: string, zone = 'visutry.com'): string {
  if (name === '@' || name === zone || name === `${zone}.`) return `${zone}.`
  const trimmed = name.replace(/\.$/, '')
  if (trimmed.endsWith(zone)) return `${trimmed}.`
  return `${trimmed}.${zone}.`
}

export function normalizeDnsContent(type: string, content: string): string {
  const raw = content.trim().replace(/^"|"$/g, '')
  if (type === 'CNAME' || type === 'MX' || type === 'NS') {
    return raw.replace(/\.$/, '').toLowerCase()
  }
  if (type === 'TXT') return raw.replace(/^"|"$/g, '')
  if (type === 'CAA') {
    return raw.replace(/\s+/g, ' ').replace(/"/g, '').toLowerCase()
  }
  return raw
}

export function recordKey(record: { name: string; type: string; content: string; priority?: number }): string {
  const name = fqdn(record.name)
  const type = record.type.toUpperCase()
  const content = normalizeDnsContent(type, record.content)
  if (type === 'MX') return `${name}|${type}|${record.priority ?? ''}|${content}`
  return `${name}|${type}|${content}`
}

export function parseCloudflareDnsDump(raw: unknown): B4CloudflareDnsRecord[] {
  if (Array.isArray(raw)) return raw as B4CloudflareDnsRecord[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { result?: unknown }).result)) {
    return (raw as { result: B4CloudflareDnsRecord[] }).result
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { records?: unknown }).records)) {
    return (raw as { records: B4CloudflareDnsRecord[] }).records
  }
  throw new Error('expected a Cloudflare { result: [] } DNS dump, { records: [] }, or an array')
}

function relativeName(name: string, zone = 'visutry.com'): string {
  const host = name.replace(/\.$/, '').toLowerCase()
  if (host === zone) return '@'
  if (host.endsWith(`.${zone}`)) return host.slice(0, -(zone.length + 1))
  return host
}

export function compareDesiredToCloudflare(options: {
  desired: B4DesiredDnsRecord[]
  remote: B4CloudflareDnsRecord[]
}): B4DnsDiffReport {
  const desired = options.desired
  const remote = options.remote
    .filter((row) => row.type && row.type !== 'SOA' && row.type !== 'NS')
    .map((row) => ({
      name: relativeName(String(row.name || '@')),
      type: String(row.type).toUpperCase(),
      content: String(row.content || ''),
      priority: row.priority,
      proxied: Boolean(row.proxied),
    }))

  if (remote.length === 0) {
    return {
      status: 'skipped',
      reason: 'no Cloudflare DNS dump. Zone is missing or unpopulated; local desired state is not Phase A PASS for records copied.',
      desiredCount: desired.length,
      remoteCount: 0,
      ttlDifferencesIgnored: true,
      findings: [],
    }
  }

  const findings: B4DnsDiffFinding[] = []
  const remoteByKey = new Map(remote.map((row) => [recordKey(row), row]))
  const desiredKeys = new Set(desired.map((row) => recordKey(row)))

  for (const row of desired) {
    const key = recordKey(row)
    const match = remoteByKey.get(key)
    const sameNameType = remote.filter(
      (item) => fqdn(item.name) === fqdn(row.name) && item.type === row.type.toUpperCase(),
    )
    if (!match) {
      const similar = sameNameType[0]
      if (similar && row.type === 'MX' && normalizeDnsContent('MX', similar.content) === normalizeDnsContent('MX', row.content)) {
        findings.push({
          kind: 'mx-priority',
          record: `${row.name} MX ${row.content}`,
          expected: String(row.priority),
          actual: String(similar.priority),
        })
        continue
      }
      if (similar && (row.type === 'TXT' || row.type === 'CAA')) {
        findings.push({
          kind: row.type === 'TXT' ? 'txt' : 'caa',
          record: `${row.name} ${row.type}`,
          expected: normalizeDnsContent(row.type, row.content),
          actual: normalizeDnsContent(similar.type, similar.content),
        })
        continue
      }
      if (similar) {
        findings.push({
          kind: 'value',
          record: `${row.name} ${row.type}`,
          expected: normalizeDnsContent(row.type, row.content),
          actual: normalizeDnsContent(similar.type, similar.content),
        })
        continue
      }
      findings.push({
        kind: 'missing',
        record: `${row.name} ${row.type} ${row.content}`,
        expected: key,
      })
      continue
    }
    if (Boolean(match.proxied) !== Boolean(row.proxied)) {
      findings.push({
        kind: 'proxy',
        record: `${row.name} ${row.type}`,
        expected: row.proxied ? 'PROXIED' : 'DNS_ONLY',
        actual: match.proxied ? 'PROXIED' : 'DNS_ONLY',
      })
    }
  }

  for (const row of remote) {
    if (!desiredKeys.has(recordKey(row))) {
      findings.push({
        kind: 'unexpected',
        record: `${row.name} ${row.type} ${row.content}`,
        actual: recordKey(row),
      })
    }
  }

  return {
    status: findings.length === 0 ? 'pass' : 'fail',
    reason: findings.length === 0
      ? 'Cloudflare zone records match the prepared desired state'
      : `${findings.length} DNS differences versus the prepared desired state`,
    desiredCount: desired.length,
    remoteCount: remote.length,
    ttlDifferencesIgnored: true,
    findings,
  }
}

export function loadDesiredDnsRecords(filePath = path.join(process.cwd(), B4_DESIRED_DNS_PATH)): B4DesiredDnsRecord[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { records: B4DesiredDnsRecord[] }
  return parsed.records
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
  return entry.endsWith(`${path.sep}b4-dns-zone-diff.ts`) || entry.endsWith(`${path.sep}b4-dns-zone-diff.js`)
}

if (isMain()) {
  const fromJson = process.argv.includes('--from-json')
    ? process.argv[process.argv.indexOf('--from-json') + 1]
    : undefined
  const desired = loadDesiredDnsRecords()
  if (!fromJson) {
    const report = compareDesiredToCloudflare({ desired, remote: [] })
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    process.exit(2)
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(fromJson), 'utf8'))
  const report = compareDesiredToCloudflare({ desired, remote: parseCloudflareDnsDump(raw) })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.status === 'pass') process.exit(0)
  if (report.status === 'skipped') process.exit(2)
  process.exit(1)
}

import { lookup } from 'node:dns/promises'
import { request as httpsRequest, type RequestOptions } from 'node:https'
import { isIP } from 'node:net'

export const CIMD_FETCH_TIMEOUT_MS = 2_000
export const CIMD_MAX_DOCUMENT_BYTES = 64 * 1024

export class CimdNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CimdNetworkError'
  }
}

function ipv4ToNumber(address: string): number {
  return address.split('.').reduce((value, octet) => (value * 256) + Number(octet), 0) >>> 0
}

function ipv4NumberToDotted(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join('.')
}

function ipv4InRange(address: string, base: string, prefixLength: number): boolean {
  const mask = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0
  return (ipv4ToNumber(address) & mask) === (ipv4ToNumber(base) & mask)
}

function ipv6ToGroups(address: string): number[] | null {
  const normalized = address.toLowerCase().replace(/^\[|\]$/gu, '').split('%')[0]
  const pieces = normalized.split('::')
  if (pieces.length > 2) return null
  const parsePart = (part: string): number[] => part ? part.split(':').flatMap((piece, index, all) => {
    if (!piece.includes('.')) return [Number.parseInt(piece, 16)]
    if (index !== all.length - 1) return []
    const value = ipv4ToNumber(piece)
    return [(value >>> 16) & 0xffff, value & 0xffff]
  }) : []
  const head = parsePart(pieces[0])
  const tail = pieces.length === 2 ? parsePart(pieces[1]) : []
  const missing = 8 - head.length - tail.length
  if (missing < 0 || (pieces.length === 1 && missing !== 0)) return null
  const groups = [...head, ...Array.from({ length: missing }, () => 0), ...tail]
  if (groups.length !== 8 || groups.some((group) => !Number.isInteger(group) || group < 0 || group > 0xffff)) return null
  return groups
}

function ipv6InRange(address: string, base: string, prefixLength: number): boolean {
  const value = ipv6ToGroups(address)
  const baseValue = ipv6ToGroups(base)
  if (value === null || baseValue === null) return false
  const fullGroups = Math.floor(prefixLength / 16)
  const remainingBits = prefixLength % 16
  if (value.slice(0, fullGroups).some((group, index) => group !== baseValue[index])) return false
  if (remainingBits === 0) return true
  const mask = (0xffff << (16 - remainingBits)) & 0xffff
  return (value[fullGroups] & mask) === (baseValue[fullGroups] & mask)
}

export function isDisallowedCimdAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/gu, '').split('%')[0].toLowerCase()
  if (isIP(normalized) === 4) {
    const disallowedRanges: Array<[string, number]> = [
      ['0.0.0.0', 8],
      ['10.0.0.0', 8],
      ['100.64.0.0', 10],
      ['127.0.0.0', 8],
      ['169.254.0.0', 16],
      ['172.16.0.0', 12],
      ['192.0.0.0', 24],
      ['192.0.2.0', 24],
      ['192.168.0.0', 16],
      ['192.88.99.0', 24],
      ['198.18.0.0', 15],
      ['198.51.100.0', 24],
      ['203.0.113.0', 24],
      ['224.0.0.0', 4],
      ['240.0.0.0', 4],
    ]
    return disallowedRanges.some(([base, prefix]) => ipv4InRange(normalized, base, prefix))
  }
  if (isIP(normalized) === 6) {
    if (ipv6InRange(normalized, '::', 128) || ipv6InRange(normalized, '::1', 128)) return true
    if (ipv6InRange(normalized, 'fc00::', 7) || ipv6InRange(normalized, 'fe80::', 10) || ipv6InRange(normalized, 'ff00::', 8)) return true
    if (ipv6InRange(normalized, '::ffff:0:0', 96)) {
      const groups = ipv6ToGroups(normalized)
      if (groups === null) return false
      return isDisallowedCimdAddress(ipv4NumberToDotted((groups[6] * 65536) + groups[7]))
    }
  }
  return false
}

export type PinnedCimdHost = {
  clientId: string
  hostname: string
  address: string
  family: 4 | 6
  port: number
  path: string
}

export async function resolveAndPinCimdHost(clientId: string): Promise<PinnedCimdHost> {
  const parsed = new URL(clientId)
  if (parsed.protocol !== 'https:' || parsed.pathname === '/' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new CimdNetworkError('CIMD client_id must be an HTTPS URL with a path and no query or fragment.')
  const hostname = parsed.hostname.replace(/^\[|\]$/gu, '')
  if (!hostname || hostname === 'localhost' || isDisallowedCimdAddress(hostname)) throw new CimdNetworkError('CIMD host is local, private, or reserved.')
  let resolved: Array<{ address: string; family: 4 | 6 }>
  try {
    resolved = await lookup(hostname, { all: true, verbatim: true }) as Array<{ address: string; family: 4 | 6 }>
  } catch {
    throw new CimdNetworkError('CIMD host could not be resolved.')
  }
  if (resolved.length === 0 || resolved.some(({ address }) => isDisallowedCimdAddress(address))) throw new CimdNetworkError('CIMD host resolves to a private or reserved address.')
  const selected = [...resolved].sort((left, right) => `${left.family}:${left.address}`.localeCompare(`${right.family}:${right.address}`))[0]
  return {
    clientId,
    hostname,
    address: selected.address,
    family: selected.family,
    port: parsed.port ? Number(parsed.port) : 443,
    path: `${parsed.pathname}${parsed.search}`,
  }
}

export type PinnedCimdResponse = {
  status: number
  contentType: string
  contentLength: string | undefined
  cacheControl: string | undefined
  body: string
}

export function fetchPinnedCimdDocument(host: PinnedCimdHost, options: { timeoutMs?: number; maxBytes?: number } = {}): Promise<PinnedCimdResponse> {
  const timeoutMs = options.timeoutMs ?? CIMD_FETCH_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? CIMD_MAX_DOCUMENT_BYTES
  const requestOptions: RequestOptions = {
    hostname: host.address,
    family: host.family,
    port: host.port,
    path: host.path,
    method: 'GET',
    headers: { Accept: 'application/json', Host: host.port === 443 ? host.hostname : `${host.hostname}:${host.port}` },
    servername: host.hostname,
    rejectUnauthorized: true,
    agent: false,
  }
  return new Promise((resolve, reject) => {
    const request = httpsRequest(requestOptions, (response) => {
      const chunks: Buffer[] = []
      let totalBytes = 0
      response.on('data', (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalBytes += buffer.byteLength
        if (totalBytes > maxBytes) {
          request.destroy(new CimdNetworkError('CIMD document exceeds the response-size limit.'))
          return
        }
        chunks.push(buffer)
      })
      response.on('end', () => resolve({
        status: response.statusCode || 0,
        contentType: String(response.headers['content-type'] || ''),
        contentLength: response.headers['content-length'] as string | undefined,
        cacheControl: response.headers['cache-control'] as string | undefined,
        body: Buffer.concat(chunks).toString('utf8'),
      }))
      response.on('error', reject)
    })
    request.setTimeout(timeoutMs, () => request.destroy(new CimdNetworkError('CIMD request timed out.')))
    request.on('error', reject)
    request.end()
  })
}

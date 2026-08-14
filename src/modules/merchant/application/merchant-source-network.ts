import { lookup } from 'node:dns/promises'
import { request as httpRequest, type RequestOptions as HttpRequestOptions } from 'node:http'
import { request as httpsRequest, type RequestOptions as HttpsRequestOptions } from 'node:https'
import { isIP } from 'node:net'
import { isDisallowedCimdAddress } from './merchant-cimd-network'

export const MERCHANT_SOURCE_FETCH_TIMEOUT_MS = 3_000
export const MERCHANT_SOURCE_MAX_RESPONSE_BYTES = 512 * 1024
export const MERCHANT_SOURCE_MAX_REDIRECTS = 2

export class MerchantSourceNetworkError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'MerchantSourceNetworkError'
    this.code = code
  }
}

export type PinnedMerchantSourceUrl = {
  url: string
  protocol: 'http:' | 'https:'
  hostname: string
  address: string
  family: 4 | 6
  port: number
  path: string
}

export type MerchantSourceDocument = {
  url: string
  status: number
  contentType: string
  body: string
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, '')
  return normalized === 'localhost' || normalized.endsWith('.localhost')
}

function isAllowedSourceUrl(value: URL): boolean {
  return (value.protocol === 'http:' || value.protocol === 'https:') && !value.username && !value.password
}

export async function resolveAndPinMerchantSourceUrl(rawUrl: string): Promise<PinnedMerchantSourceUrl> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new MerchantSourceNetworkError('UNSAFE_SOURCE_URL', 'The source URL is not valid.')
  }
  if (!isAllowedSourceUrl(parsed)) {
    throw new MerchantSourceNetworkError('UNSAFE_SOURCE_URL', 'Only public HTTP or HTTPS source URLs are supported.')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/gu, '')
  if (!hostname || isLocalHostname(hostname) || isDisallowedCimdAddress(hostname)) {
    throw new MerchantSourceNetworkError('UNSAFE_SOURCE_URL', 'Local, private, reserved, or metadata source URLs are not allowed.')
  }

  let resolved: Array<{ address: string; family: 4 | 6 }>
  if (isIP(hostname)) {
    resolved = [{ address: hostname, family: isIP(hostname) as 4 | 6 }]
  } else {
    try {
      resolved = await lookup(hostname, { all: true, verbatim: true }) as Array<{ address: string; family: 4 | 6 }>
    } catch {
      throw new MerchantSourceNetworkError('SOURCE_UNREACHABLE', 'The source hostname could not be resolved.')
    }
  }

  if (resolved.length === 0 || resolved.some(({ address }) => isDisallowedCimdAddress(address))) {
    throw new MerchantSourceNetworkError('UNSAFE_SOURCE_URL', 'The source resolves to a private or reserved network address.')
  }

  const selected = [...resolved].sort((left, right) => `${left.family}:${left.address}`.localeCompare(`${right.family}:${right.address}`))[0]
  return {
    url: parsed.toString(),
    protocol: parsed.protocol as 'http:' | 'https:',
    hostname,
    address: selected.address,
    family: selected.family,
    port: parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80,
    path: `${parsed.pathname || '/'}${parsed.search}`,
  }
}

function requestPinnedDocument(host: PinnedMerchantSourceUrl, options: {
  timeoutMs?: number
  maxBytes?: number
} = {}): Promise<MerchantSourceDocument & { location?: string }> {
  const timeoutMs = options.timeoutMs ?? MERCHANT_SOURCE_FETCH_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? MERCHANT_SOURCE_MAX_RESPONSE_BYTES
  const requestOptions: HttpRequestOptions | HttpsRequestOptions = {
    hostname: host.address,
    family: host.family,
    port: host.port,
    path: host.path,
    method: 'GET',
    headers: {
      Accept: 'text/html, application/xhtml+xml;q=0.9',
      Host: host.port === (host.protocol === 'https:' ? 443 : 80) ? host.hostname : `${host.hostname}:${host.port}`,
    },
    agent: false,
  }
  if (host.protocol === 'https:') {
    Object.assign(requestOptions, { servername: host.hostname, rejectUnauthorized: true })
  }

  const request = host.protocol === 'https:' ? httpsRequest : httpRequest
  return new Promise((resolve, reject) => {
    let settled = false
    const req = request(requestOptions, (response) => {
      const chunks: Buffer[] = []
      let totalBytes = 0
      response.on('data', (chunk: Buffer | string) => {
        if (settled) return
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalBytes += buffer.byteLength
        if (totalBytes > maxBytes) {
          const error = new MerchantSourceNetworkError('SOURCE_TOO_LARGE', 'The source response exceeds the size limit.')
          settled = true
          reject(error)
          req.destroy(error)
          return
        }
        chunks.push(buffer)
      })
      response.on('end', () => {
        if (settled) return
        settled = true
        resolve({
          url: host.url,
          status: response.statusCode || 0,
          contentType: String(response.headers['content-type'] || ''),
          body: Buffer.concat(chunks).toString('utf8'),
          location: typeof response.headers.location === 'string' ? response.headers.location : undefined,
        })
      })
      response.on('error', (error) => {
        if (settled) return
        settled = true
        reject(error)
      })
    })
    req.setTimeout(timeoutMs, () => {
      const error = new MerchantSourceNetworkError('SOURCE_TIMEOUT', 'The source request timed out.')
      settled = true
      reject(error)
      req.destroy(error)
    })
    req.on('error', (error) => {
      if (settled) return
      settled = true
      reject(error)
    })
    req.end()
  })
}

export async function fetchMerchantSourceDocument(rawUrl: string, options: {
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
} = {}): Promise<MerchantSourceDocument> {
  let currentUrl = rawUrl
  const maxRedirects = options.maxRedirects ?? MERCHANT_SOURCE_MAX_REDIRECTS
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const pinned = await resolveAndPinMerchantSourceUrl(currentUrl)
    const response = await requestPinnedDocument(pinned, options)
    if (response.status >= 300 && response.status < 400 && response.location) {
      if (redirectCount === maxRedirects) {
        throw new MerchantSourceNetworkError('TOO_MANY_REDIRECTS', 'The source exceeded the redirect limit.')
      }
      const nextUrl = new URL(response.location, currentUrl)
      if (!isAllowedSourceUrl(nextUrl) || nextUrl.origin !== new URL(currentUrl).origin) {
        throw new MerchantSourceNetworkError('UNSAFE_SOURCE_URL', 'Cross-origin or non-HTTP source redirects are not allowed.')
      }
      currentUrl = nextUrl.toString()
      continue
    }
    if (response.status < 200 || response.status >= 300) {
      throw new MerchantSourceNetworkError('SOURCE_UNREACHABLE', `The source returned HTTP ${response.status}.`)
    }
    return response
  }
  throw new MerchantSourceNetworkError('TOO_MANY_REDIRECTS', 'The source exceeded the redirect limit.')
}

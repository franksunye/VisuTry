import { isIP } from 'node:net'

export class McpOriginError extends Error {
  readonly code = 'MCP_ORIGIN_FORBIDDEN'
  readonly httpStatus = 403

  constructor() {
    super('The MCP Origin is not trusted.')
    this.name = 'McpOriginError'
  }
}

function normalizeConfiguredOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim())
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null
    return parsed.origin
  } catch {
    return null
  }
}

function trustedMcpOrigins(): Set<string> {
  const configured = process.env.MCP_ALLOWED_ORIGINS
  if (configured !== undefined) {
    return new Set(configured.split(',').map(normalizeConfiguredOrigin).filter((value): value is string => Boolean(value)))
  }
  return new Set(process.env.NODE_ENV === 'production' ? ['https://www.visutry.com'] : ['http://localhost:3000'])
}

export function assertTrustedMcpOrigin(origin: string | null): void {
  if (origin === null) return
  let parsedOrigin: string
  try {
    parsedOrigin = new URL(origin).origin
  } catch {
    throw new McpOriginError()
  }
  if (origin !== parsedOrigin || !trustedMcpOrigins().has(parsedOrigin)) throw new McpOriginError()
}

function parseSingleIp(value: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().replace(/^\[|\]$/gu, '')
  if (!normalized || normalized.includes(',') || isIP(normalized) === 0) return null
  return normalized
}

export type DcrTrustedProxyMode = 'vercel' | 'cloudflare' | 'none'

export function dcrTrustedProxyMode(): DcrTrustedProxyMode {
  const configured = process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE
  if (configured === 'vercel' || configured === 'cloudflare' || configured === 'none') return configured
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true' || Boolean(process.env.VERCEL_URL) ? 'vercel' : 'none'
}

export function dcrClientIdentityFromHeaders(headers: Headers): { identity: string; source: DcrTrustedProxyMode } {
  const mode = dcrTrustedProxyMode()
  if (mode === 'vercel') {
    const vercelIp = parseSingleIp(headers.get('x-vercel-forwarded-for'))
    return { identity: vercelIp || 'unknown', source: mode }
  }
  if (mode === 'cloudflare') return { identity: parseSingleIp(headers.get('cf-connecting-ip')) || 'unknown', source: mode }
  return { identity: 'untrusted', source: mode }
}

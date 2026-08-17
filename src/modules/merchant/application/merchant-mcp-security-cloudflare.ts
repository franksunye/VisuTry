export class McpOriginError extends Error {
  readonly code = 'MCP_ORIGIN_FORBIDDEN'
  readonly httpStatus = 403

  constructor() {
    super('The MCP Origin is not trusted.')
    this.name = 'McpOriginError'
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim())
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null
    return parsed.origin
  } catch {
    return null
  }
}

function trustedOrigins(): Set<string> {
  const configured = process.env.MCP_ALLOWED_ORIGINS
  if (configured !== undefined) return new Set(configured.split(',').map(normalizeOrigin).filter((value): value is string => Boolean(value)))
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
  if (origin !== parsedOrigin || !trustedOrigins().has(parsedOrigin)) throw new McpOriginError()
}

import { MERCHANT_AGENT_SCOPES } from '../domain/agent-credentials'

/**
 * Dependency-light OAuth metadata shared by discovery routes. Keep this
 * module free of repositories and Prisma so public metadata can be bundled
 * without pulling the merchant runtime into the Cloudflare build.
 */
export const MCP_OAUTH_ISSUER_PATH = '/api/mcp/oauth'
export const MCP_OAUTH_AUTHORIZE_PATH = `${MCP_OAUTH_ISSUER_PATH}/authorize`
export const MCP_OAUTH_TOKEN_PATH = `${MCP_OAUTH_ISSUER_PATH}/token`
export const MCP_OAUTH_REGISTER_PATH = `${MCP_OAUTH_ISSUER_PATH}/register`
export const MCP_OAUTH_REVOKE_PATH = `${MCP_OAUTH_ISSUER_PATH}/revoke`
export const MCP_OAUTH_SCOPE_VALUES = [...MERCHANT_AGENT_SCOPES] as const

export function canonicalMcpResource(requestOrigin?: string): string {
  const configured = process.env.MCP_RESOURCE_URL || process.env.NEXT_PUBLIC_MCP_RESOURCE_URL
  if (configured) return configured.replace(/\/$/u, '')
  const origin = (requestOrigin || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/u, '')
  return `${origin}/api/mcp`
}

export function oauthIssuer(requestOrigin?: string): string {
  const configured = process.env.MCP_OAUTH_ISSUER_URL
  if (configured) return configured.replace(/\/$/u, '')
  const origin = (requestOrigin || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/u, '')
  return origin
}

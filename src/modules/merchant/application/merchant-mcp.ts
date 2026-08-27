/**
 * Canonical (Vercel Node / Prisma) MCP auth + discovery helpers.
 * Cloudflare builds alias this module to `merchant-mcp-cloudflare.ts`.
 */
export {
  authenticateMerchantMcpBearer,
  authenticateMerchantOAuthAccessToken,
} from './merchant-oauth'
export { canonicalMcpResource } from './merchant-oauth-metadata'
export { assertTrustedMcpOrigin, McpOriginError } from './merchant-mcp-security'
export { InvalidAgentCredentialError } from '../domain/agent-credentials'

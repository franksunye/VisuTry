import { canonicalMcpResource } from './merchant-oauth-metadata'
import { assertTrustedMcpOrigin, McpOriginError } from './merchant-mcp-security-cloudflare'
import { authenticateMerchantAgentCredential } from './merchant-agent-credentials-cloudflare'
import { InvalidAgentCredentialError } from '../domain/agent-credentials'

export { assertTrustedMcpOrigin, canonicalMcpResource, InvalidAgentCredentialError, McpOriginError }

export async function authenticateMerchantMcpBearer(rawToken: string, _expectedResource: string) {
  if (!rawToken.startsWith('vt_live_')) throw new InvalidAgentCredentialError()
  return authenticateMerchantAgentCredential(rawToken)
}

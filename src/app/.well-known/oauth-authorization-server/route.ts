import { NextRequest, NextResponse } from 'next/server'
import {
  MCP_OAUTH_AUTHORIZE_PATH,
  MCP_OAUTH_REGISTER_PATH,
  MCP_OAUTH_REVOKE_PATH,
  MCP_OAUTH_SCOPE_VALUES,
  MCP_OAUTH_TOKEN_PATH,
  oauthIssuer,
} from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const issuer = oauthIssuer(request.nextUrl.origin)
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}${MCP_OAUTH_AUTHORIZE_PATH}`,
    token_endpoint: `${issuer}${MCP_OAUTH_TOKEN_PATH}`,
    registration_endpoint: `${issuer}${MCP_OAUTH_REGISTER_PATH}`,
    revocation_endpoint: `${issuer}${MCP_OAUTH_REVOKE_PATH}`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: MCP_OAUTH_SCOPE_VALUES,
    token_endpoint_auth_methods_supported: ['none'],
    client_id_metadata_document_supported: true,
  }, { headers: { 'Cache-Control': 'public, max-age=300' } })
}

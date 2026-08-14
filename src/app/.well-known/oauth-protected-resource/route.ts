import { NextRequest, NextResponse } from 'next/server'
import { canonicalMcpResource, oauthIssuer, MCP_OAUTH_SCOPE_VALUES } from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const issuer = oauthIssuer(request.nextUrl.origin)
  return NextResponse.json({
    resource: canonicalMcpResource(request.nextUrl.origin),
    authorization_servers: [issuer],
    scopes_supported: MCP_OAUTH_SCOPE_VALUES,
    resource_documentation: `${request.nextUrl.origin}/en/merchant`,
  }, { headers: { 'Cache-Control': 'public, max-age=300' } })
}

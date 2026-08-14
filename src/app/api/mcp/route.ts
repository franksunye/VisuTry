import { NextRequest, NextResponse } from 'next/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  authenticateMerchantMcpBearer,
  canonicalMcpResource,
  InvalidAgentCredentialError,
} from '@/modules/merchant'
import { AgentRateLimitError, consumeMerchantAgentMcpRequest } from '@/modules/merchant'
import { createMerchantMcpServer } from '@/modules/merchant/mcp/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bearerToken(request: NextRequest): string {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) throw new InvalidAgentCredentialError()
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) throw new InvalidAgentCredentialError()
  return token
}

function errorResponse(error: unknown, request: NextRequest) {
  if (error instanceof InvalidAgentCredentialError) {
    const resourceMetadata = `${request.nextUrl.origin}/.well-known/oauth-protected-resource`
    return NextResponse.json({ error: error.code }, {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${resourceMetadata}"`,
      },
    })
  }
  if (error instanceof AgentRateLimitError) {
    return NextResponse.json({ error: error.code }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } })
  }
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authenticateMerchantMcpBearer(bearerToken(request), canonicalMcpResource(request.nextUrl.origin))
    await consumeMerchantAgentMcpRequest({ actor })
    const server = createMerchantMcpServer(actor)
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    await server.connect(transport)
    const response = await transport.handleRequest(request)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return errorResponse(error, request)
  }
}

export async function GET() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } })
}

export async function DELETE() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } })
}

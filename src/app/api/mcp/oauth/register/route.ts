import { NextRequest, NextResponse } from 'next/server'
import { consumeMcpOAuthDcrRateLimit, MerchantOAuthError, registerMcpOAuthClient } from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const identity = request.headers.get('cf-connecting-ip')?.trim()
      || request.headers.get('x-real-ip')?.trim()
      || forwardedFor
      || 'unknown'
    await consumeMcpOAuthDcrRateLimit({ identity })
    const body = await request.json() as Record<string, unknown>
    const client = await registerMcpOAuthClient({
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
      applicationType: body.application_type,
    })
    return NextResponse.json({
      client_id: client.clientId,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof MerchantOAuthError) {
      const headers: HeadersInit = { 'Cache-Control': 'no-store' }
      if (error.retryAfterSeconds) headers['Retry-After'] = String(error.retryAfterSeconds)
      return NextResponse.json({ error: error.code, error_description: error.message }, { status: error.httpStatus, headers })
    }
    return NextResponse.json({ error: 'invalid_client_metadata' }, { status: 400 })
  }
}

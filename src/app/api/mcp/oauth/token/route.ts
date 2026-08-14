import { NextRequest, NextResponse } from 'next/server'
import {
  canonicalMcpResource,
  exchangeMcpOAuthCode,
  getMcpOAuthClient,
  MerchantOAuthError,
  refreshMcpOAuthToken,
} from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function oauthError(error: unknown) {
  if (error instanceof MerchantOAuthError) return NextResponse.json({ error: error.code, error_description: error.message }, { status: error.httpStatus, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ error: 'server_error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const grantType = String(form.get('grant_type') || '')
    const expectedResource = canonicalMcpResource(request.nextUrl.origin)
    if (grantType === 'authorization_code') {
      const clientId = String(form.get('client_id') || '')
      const client = await getMcpOAuthClient(clientId)
      const result = await exchangeMcpOAuthCode({
        clientId: client.clientId,
        code: String(form.get('code') || ''),
        redirectUri: String(form.get('redirect_uri') || ''),
        codeVerifier: String(form.get('code_verifier') || ''),
        resource: String(form.get('resource') || '') || null,
        expectedResource,
      })
      return NextResponse.json({ access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope, resource: result.resource }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (grantType === 'refresh_token') {
      const result = await refreshMcpOAuthToken({ refreshToken: String(form.get('refresh_token') || ''), resource: String(form.get('resource') || '') || null, expectedResource })
      return NextResponse.json({ access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope, resource: result.resource }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return oauthError(error)
  }
}

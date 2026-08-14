import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  approveMcpOAuthAuthorization,
  attachMcpOAuthAuthorizationRequestUser,
  canonicalMcpResource,
  createMcpOAuthAuthorizationRequest,
  getMcpOAuthClient,
  getMcpOAuthAuthorizationRequest,
  MerchantOAuthError,
} from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character))
}

function html(body: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect VisuTry</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:2rem}.card{max-width:42rem;margin:4rem auto;background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:2rem;box-shadow:0 12px 30px #0f172a12}h1{margin-top:0}p{color:#475569;line-height:1.6}.merchant{display:block;border:1px solid #cbd5e1;border-radius:.75rem;padding:1rem;margin:.75rem 0}.scopes{display:flex;flex-wrap:wrap;gap:.5rem}.scope{background:#eff6ff;border-radius:999px;padding:.35rem .65rem;font-size:.85rem}button{border:0;border-radius:.65rem;padding:.75rem 1rem;font-weight:650;cursor:pointer}.allow{background:#0f172a;color:#fff}.deny{background:#fff;color:#b91c1c;border:1px solid #fecaca}</style></head><body>${body}</body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function redirectWithError(request: { redirectUri: string; state: string | null }, error: string, description: string) {
  const target = new URL(request.redirectUri)
  target.searchParams.set('error', error)
  target.searchParams.set('error_description', description)
  if (request.state) target.searchParams.set('state', request.state)
  return NextResponse.redirect(target)
}

async function loadSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

async function showConsent(request: NextRequest, requestId: string, userId: string) {
  const authRequest = await getMcpOAuthAuthorizationRequest(requestId)
  const client = await getMcpOAuthClient(authRequest.clientId)
  if (authRequest.userId && authRequest.userId !== userId) {
    throw new MerchantOAuthError('access_denied', 'This authorization request belongs to another user.', 403)
  }
  if (!authRequest.userId) await attachMcpOAuthAuthorizationRequestUser(requestId, userId)
  const memberships = await prisma.merchantMembership.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { merchantId: true, role: true, merchant: { select: { name: true, slug: true, status: true } } },
  })
  if (memberships.length === 0) {
    return html('<div class="card"><h1>No Merchant workspace found</h1><p>Your VisuTry account is not a member of a Merchant workspace. Ask a workspace owner to invite you, then reconnect.</p></div>', 403)
  }
  const scopeMarkup = authRequest.scopes.map((scope) => `<span class="scope">${escapeHtml(scope)}</span>`).join('')
  const merchantMarkup = memberships.map((membership) => `<label class="merchant"><input required type="radio" name="merchant_id" value="${escapeHtml(membership.merchantId)}"> <strong>${escapeHtml(membership.merchant.name)}</strong> <small>(${escapeHtml(membership.merchant.slug)} · ${escapeHtml(membership.role)})</small></label>`).join('')
  const redirectHost = new URL(authRequest.redirectUri).host
  return html(`<div class="card"><h1>Connect ${escapeHtml(client.clientName)} to VisuTry</h1><p><strong>Client ID:</strong> <code>${escapeHtml(client.clientId)}</code><br><strong>Redirect host:</strong> <code>${escapeHtml(redirectHost)}</code></p><p>Choose exactly one Merchant workspace for this agent connection. The agent will not receive access to your other workspaces.</p><h2>Requested scopes</h2><div class="scopes">${scopeMarkup}</div><form method="post" action="${escapeHtml(request.nextUrl.pathname)}"><input type="hidden" name="request_id" value="${escapeHtml(requestId)}"><div style="margin-top:1.5rem"><h2>Merchant workspace</h2>${merchantMarkup}</div><div style="display:flex;gap:.75rem;margin-top:1.5rem"><button class="allow" name="decision" value="allow" type="submit">Allow</button><button class="deny" name="decision" value="deny" type="submit">Deny</button></div></form></div>`)
}

export async function GET(request: NextRequest) {
  try {
    let requestId = request.nextUrl.searchParams.get('request_id')
    if (!requestId) {
      const authRequest = await createMcpOAuthAuthorizationRequest({
        clientId: request.nextUrl.searchParams.get('client_id') || '',
        redirectUri: request.nextUrl.searchParams.get('redirect_uri') || '',
        responseType: request.nextUrl.searchParams.get('response_type') || '',
        scope: request.nextUrl.searchParams.get('scope') || undefined,
        resource: request.nextUrl.searchParams.get('resource'),
        state: request.nextUrl.searchParams.get('state'),
        codeChallenge: request.nextUrl.searchParams.get('code_challenge') || '',
        codeChallengeMethod: request.nextUrl.searchParams.get('code_challenge_method') || '',
        expectedResource: canonicalMcpResource(request.nextUrl.origin),
      })
      requestId = authRequest.requestId
    }
    const userId = await loadSessionUserId()
    if (!userId) {
      const login = new URL('/api/auth/signin/auth0', request.nextUrl.origin)
      const callback = new URL('/api/mcp/oauth/authorize', request.nextUrl.origin)
      callback.searchParams.set('request_id', requestId)
      login.searchParams.set('callbackUrl', callback.toString())
      return NextResponse.redirect(login)
    }
    return showConsent(request, requestId, userId)
  } catch (error) {
    if (error instanceof MerchantOAuthError) return NextResponse.json({ error: error.code, error_description: error.message }, { status: error.httpStatus })
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await loadSessionUserId()
    if (!userId) return NextResponse.json({ error: 'login_required' }, { status: 401 })
    const form = await request.formData()
    const requestId = String(form.get('request_id') || '')
    const decision = String(form.get('decision') || '')
    const authRequest = await getMcpOAuthAuthorizationRequest(requestId)
    if (authRequest.userId && authRequest.userId !== userId) throw new MerchantOAuthError('access_denied', 'This authorization request belongs to another user.', 403)
    if (decision !== 'allow') return redirectWithError(authRequest, 'access_denied', 'The user denied VisuTry access.')
    const merchantId = String(form.get('merchant_id') || '')
    const result = await approveMcpOAuthAuthorization({ requestId, userId, merchantId })
    const target = new URL(result.redirectUri)
    target.searchParams.set('code', result.code)
    if (result.state) target.searchParams.set('state', result.state)
    return NextResponse.redirect(target)
  } catch (error) {
    if (error instanceof MerchantOAuthError) return NextResponse.json({ error: error.code, error_description: error.message }, { status: error.httpStatus })
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMembership: { findMany: jest.fn() },
  },
}))

jest.mock('@/modules/merchant', () => ({
  MCP_OAUTH_AUTHORIZE_PATH: '/api/mcp/oauth/authorize',
  MCP_OAUTH_REGISTER_PATH: '/api/mcp/oauth/register',
  MCP_OAUTH_REVOKE_PATH: '/api/mcp/oauth/revoke',
  MCP_OAUTH_SCOPE_VALUES: ['merchant:read', 'experience:read', 'experience:write', 'analytics:read'],
  MCP_OAUTH_TOKEN_PATH: '/api/mcp/oauth/token',
  canonicalMcpResource: jest.fn((origin: string) => `${origin}/api/mcp`),
  assertTrustedMcpOrigin: jest.fn(),
  McpOriginError: class McpOriginError extends Error {
    readonly code = 'MCP_ORIGIN_FORBIDDEN'
    readonly httpStatus = 403
  },
  oauthIssuer: jest.fn((origin: string) => origin),
  registerMcpOAuthClient: jest.fn(),
  consumeMcpOAuthDcrRateLimit: jest.fn(),
  dcrClientIdentityFromHeaders: jest.fn().mockReturnValue({ identity: 'untrusted', source: 'none' }),
  createMcpOAuthAuthorizationRequest: jest.fn(),
  getMcpOAuthClient: jest.fn(),
  getMcpOAuthAuthorizationRequest: jest.fn(),
  attachMcpOAuthAuthorizationRequestUser: jest.fn(),
  approveMcpOAuthAuthorization: jest.fn(),
  exchangeMcpOAuthCode: jest.fn(),
  MerchantOAuthError: class MerchantOAuthError extends Error {
    readonly code = 'OAUTH_ERROR'
    readonly httpStatus = 400
  },
}))

jest.mock('@/modules/merchant/application/merchant-mcp', () => ({
  canonicalMcpResource: jest.fn((origin: string) => `${origin}/api/mcp`),
  assertTrustedMcpOrigin: jest.fn(),
  McpOriginError: class McpOriginError extends Error {
    readonly code = 'MCP_ORIGIN_FORBIDDEN'
    readonly httpStatus = 403
  },
  authenticateMerchantMcpBearer: jest.fn(),
  InvalidAgentCredentialError: class InvalidAgentCredentialError extends Error {
    readonly code = 'INVALID_AGENT_CREDENTIAL'
    readonly httpStatus = 401
  },
}))

jest.mock('@/modules/merchant/application/merchant-agent-rate-limit', () => ({
  consumeMerchantAgentMcpRequest: jest.fn().mockResolvedValue(undefined),
  AgentRateLimitError: class AgentRateLimitError extends Error {
    readonly code = 'AGENT_RATE_LIMITED'
    readonly httpStatus = 429
    readonly retryAfterSeconds = 10
  },
}))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import {
  approveMcpOAuthAuthorization,
  attachMcpOAuthAuthorizationRequestUser,
  createMcpOAuthAuthorizationRequest,
  getMcpOAuthClient,
  exchangeMcpOAuthCode,
  getMcpOAuthAuthorizationRequest,
  registerMcpOAuthClient,
  consumeMcpOAuthDcrRateLimit,
} from '@/modules/merchant'
import {
  authenticateMerchantMcpBearer,
  InvalidAgentCredentialError,
} from '@/modules/merchant/application/merchant-mcp'
import { POST as mcpPost } from '@/app/api/mcp/route'
import { GET as protectedResourceGet } from '@/app/.well-known/oauth-protected-resource/route'
import { GET as authorizationServerGet } from '@/app/.well-known/oauth-authorization-server/route'
import { POST as registerPost } from '@/app/api/mcp/oauth/register/route'
import { GET as authorizeGet, POST as authorizePost } from '@/app/api/mcp/oauth/authorize/route'
import { POST as tokenPost } from '@/app/api/mcp/oauth/token/route'

const mockSession = getServerSession as jest.Mock
const mockPrisma = prisma as any
const mockRegister = registerMcpOAuthClient as jest.Mock
const mockDcrRateLimit = consumeMcpOAuthDcrRateLimit as jest.Mock
const mockCreateRequest = createMcpOAuthAuthorizationRequest as jest.Mock
const mockGetClient = getMcpOAuthClient as jest.Mock
const mockGetRequest = getMcpOAuthAuthorizationRequest as jest.Mock
const mockAttachUser = attachMcpOAuthAuthorizationRequestUser as jest.Mock
const mockApprove = approveMcpOAuthAuthorization as jest.Mock
const mockExchange = exchangeMcpOAuthCode as jest.Mock
const mockAuthenticate = authenticateMerchantMcpBearer as jest.Mock

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init)
}

describe('HTTP MCP OAuth discovery and connection handler contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue(null)
    mockPrisma.merchantMembership.findMany.mockResolvedValue([
      { merchantId: 'merchant-a', role: 'OWNER', merchant: { name: 'Test Merchant', slug: 'test-merchant', status: 'ACTIVE' } },
    ])
    mockRegister.mockResolvedValue({
      clientId: 'mcp_client_a',
      clientName: 'Claude Code',
      redirectUris: ['http://127.0.0.1:4567/callback'],
      tokenEndpointAuthMethod: 'none',
    })
    mockDcrRateLimit.mockResolvedValue(undefined)
    mockCreateRequest.mockResolvedValue({ requestId: 'request-a' })
    mockGetClient.mockResolvedValue({
      clientId: 'mcp_client_a',
      clientName: 'Claude Code',
      redirectUris: ['http://127.0.0.1:4567/callback'],
      tokenEndpointAuthMethod: 'none',
    })
    mockGetRequest.mockResolvedValue({
      requestId: 'request-a',
      clientId: 'mcp_client_a',
      redirectUri: 'http://127.0.0.1:4567/callback',
      scopes: ['merchant:read'],
      resource: 'http://localhost:3000/api/mcp',
      state: 'state-a',
      codeChallenge: 'challenge-a',
      codeChallengeMethod: 'S256',
      userId: null,
      expiresAt: new Date(Date.now() + 60_000),
    })
    mockApprove.mockResolvedValue({ redirectUri: 'http://127.0.0.1:4567/callback', code: 'code-a', state: 'state-a' })
    mockExchange.mockResolvedValue({
      accessToken: 'mcp_at_a',
      refreshToken: 'mcp_rt_a',
      expiresIn: 3600,
      scope: 'merchant:read',
      resource: 'http://localhost:3000/api/mcp',
    })
    mockAuthenticate.mockRejectedValue(new InvalidAgentCredentialError())
  })

  it('completes discovery, registration, PKCE authorization, token exchange, and MCP initialize/tools list over HTTP handlers', async () => {
    const unauthenticated = await mcpPost(request('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: { authorization: 'Bearer missing', 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    }))
    expect(unauthenticated.status).toBe(401)
    expect(unauthenticated.headers.get('WWW-Authenticate')).toContain('resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource"')

    const protectedResource = await protectedResourceGet(request('http://localhost:3000/.well-known/oauth-protected-resource'))
    expect(await protectedResource.json()).toMatchObject({
      resource: 'http://localhost:3000/api/mcp',
      authorization_servers: ['http://localhost:3000'],
    })

    const authorizationServer = await authorizationServerGet(request('http://localhost:3000/.well-known/oauth-authorization-server'))
    expect(await authorizationServer.json()).toMatchObject({
      registration_endpoint: 'http://localhost:3000/api/mcp/oauth/register',
      client_id_metadata_document_supported: true,
    })

    const registration = await registerPost(request('http://localhost:3000/api/mcp/oauth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Claude Code',
        redirect_uris: ['http://127.0.0.1:4567/callback'],
        application_type: 'native',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      }),
    }))
    expect(registration.status).toBe(201)
    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
      applicationType: 'native',
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
    }))
    expect(mockDcrRateLimit).toHaveBeenCalledWith(expect.objectContaining({ identity: expect.any(String) }))

    const authorizationStart = await authorizeGet(request('http://localhost:3000/api/mcp/oauth/authorize?client_id=mcp_client_a&redirect_uri=http%3A%2F%2F127.0.0.1%3A4567%2Fcallback&response_type=code&code_challenge=challenge-a&code_challenge_method=S256&resource=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fmcp&scope=merchant%3Aread&state=state-a'))
    expect(authorizationStart.status).toBe(307)
    expect(authorizationStart.headers.get('location')).toContain('/api/auth/signin/auth0')
    expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({ responseType: 'code' }))

    mockSession.mockResolvedValue({ user: { id: 'user-a' } })
    const consent = await authorizeGet(request('http://localhost:3000/api/mcp/oauth/authorize?request_id=request-a'))
    expect(consent.status).toBe(200)
    const consentHtml = await consent.text()
    expect(consentHtml).toContain('Claude Code')
    expect(consentHtml).toContain('Test Merchant')
    expect(mockAttachUser).toHaveBeenCalledWith('request-a', 'user-a')

    const authorization = await authorizePost(request('http://localhost:3000/api/mcp/oauth/authorize', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ request_id: 'request-a', merchant_id: 'merchant-a', decision: 'allow' }).toString(),
    }))
    expect(authorization.status).toBe(307)
    expect(authorization.headers.get('location')).toContain('code=code-a')
    expect(mockApprove).toHaveBeenCalledWith({ requestId: 'request-a', userId: 'user-a', merchantId: 'merchant-a' })

    const token = await tokenPost(request('http://localhost:3000/api/mcp/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'mcp_client_a',
        code: 'code-a',
        redirect_uri: 'http://127.0.0.1:4567/callback',
        code_verifier: 'verifier-a',
        resource: 'http://localhost:3000/api/mcp',
      }).toString(),
    }))
    expect(token.status).toBe(200)
    expect(await token.json()).toMatchObject({
      access_token: 'mcp_at_a',
      refresh_token: 'mcp_rt_a',
      resource: 'http://localhost:3000/api/mcp',
    })
    expect(mockExchange).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'http://localhost:3000/api/mcp',
      codeVerifier: 'verifier-a',
    }))

    mockAuthenticate.mockResolvedValue({
      actorType: 'AGENT_CREDENTIAL',
      actorId: 'credential-a',
      merchantId: 'merchant-a',
      scopes: ['merchant:read', 'catalog:read', 'experience:read', 'analytics:read'],
    })
    const initialize = await mcpPost(request('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mcp_at_a',
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'integration-test', version: '1' } },
      }),
    }))
    expect(initialize.status).toBe(200)
    expect((await initialize.json() as any).result.protocolVersion).toBeTruthy()

    const list = await mcpPost(request('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mcp_at_a',
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} }),
    }))
    expect(list.status).toBe(200)
    expect((await list.json() as any).result.tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'get_merchant' }),
      expect.objectContaining({ name: 'create_campaign' }),
    ]))
  })
})

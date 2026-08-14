/** @jest-environment node */

jest.mock('@/modules/merchant/application/merchant-cimd-network', () => ({
  CIMD_FETCH_TIMEOUT_MS: 2_000,
  CIMD_MAX_DOCUMENT_BYTES: 64 * 1024,
  resolveAndPinCimdHost: jest.fn(),
  fetchPinnedCimdDocument: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantOAuthClient: { findUnique: jest.fn(), create: jest.fn() },
    merchantOAuthDcrCounter: { upsert: jest.fn() },
    merchantOAuthAuthorizationCode: { findUnique: jest.fn(), updateMany: jest.fn() },
    merchantOAuthAccessToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    merchantOAuthAuthorization: { update: jest.fn(), create: jest.fn() },
    merchantOAuthRefreshToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { createHash } from 'node:crypto'
import {
  assertResource,
  authenticateMerchantOAuthAccessToken,
  canonicalMcpResource,
  consumeMcpOAuthDcrRateLimit,
  createMcpOAuthAuthorizationRequest,
  exchangeMcpOAuthCode,
  getMcpOAuthClient,
  refreshMcpOAuthToken,
  registerMcpOAuthClient,
  revokeMcpOAuthToken,
  MerchantOAuthError,
} from '@/modules/merchant/application/merchant-oauth'
import { requireAgentScope } from '@/modules/merchant/domain/actor'
import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'
import { prisma } from '@/lib/prisma'
import { fetchPinnedCimdDocument, resolveAndPinCimdHost } from '@/modules/merchant/application/merchant-cimd-network'

const mockPrisma = prisma as any
const mockResolvePinned = resolveAndPinCimdHost as jest.Mock
const mockFetchPinned = fetchPinnedCimdDocument as jest.Mock

describe('Merchant OAuth principal boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResolvePinned.mockReset()
    mockFetchPinned.mockReset()
    mockPrisma.$transaction.mockResolvedValue([])
    mockPrisma.merchantOAuthAccessToken.update.mockResolvedValue({})
    mockPrisma.merchantOAuthAuthorization.update.mockResolvedValue({})
    mockPrisma.merchantOAuthAuthorizationCode.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.merchantOAuthAuthorization.create.mockResolvedValue({ id: 'authorization-a' })
    mockPrisma.merchantOAuthAccessToken.create.mockResolvedValue({})
    mockPrisma.merchantOAuthRefreshToken.create.mockResolvedValue({ id: 'refresh-a' })
    mockPrisma.merchantOAuthRefreshToken.update.mockResolvedValue({})
    mockPrisma.merchantOAuthRefreshToken.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.merchantOAuthDcrCounter.upsert.mockResolvedValue({ count: 1 })
    mockPrisma.merchantOAuthClient.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...data, id: 'client-row-a' }))
  })

  it('maps a valid resource-bound token to one OAuth MerchantActorContext', async () => {
    mockPrisma.merchantOAuthAccessToken.findUnique.mockResolvedValue({
      id: 'access-a',
      authorizationId: 'authorization-a',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      authorization: {
        userId: 'user-a',
        merchantId: 'merchant-a',
        resource: 'https://www.visutry.com/api/mcp',
        status: 'ACTIVE',
        scopes: ['merchant:read', 'experience:read'],
      },
    })

    await expect(authenticateMerchantOAuthAccessToken('mcp_at_valid', 'https://www.visutry.com/api/mcp')).resolves.toEqual({
      actorType: 'AGENT_OAUTH',
      actorId: 'access-a',
      userId: 'user-a',
      authorizationId: 'authorization-a',
      merchantId: 'merchant-a',
      scopes: ['merchant:read', 'experience:read'],
    })
    expect(mockPrisma.merchantOAuthAuthorization.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'authorization-a' } }))
  })

  it.each([
    ['expired', { expiresAt: new Date(Date.now() - 1) }],
    ['revoked', { expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date() }],
    ['wrong resource', { expiresAt: new Date(Date.now() + 60_000), resource: 'https://other.example/mcp' }],
    ['revoked authorization', { expiresAt: new Date(Date.now() + 60_000), authorizationStatus: 'REVOKED' }],
  ])('rejects an %s token before constructing an actor', async (_label, overrides) => {
    const values = overrides as { expiresAt?: Date; revokedAt?: Date; resource?: string; authorizationStatus?: string }
    mockPrisma.merchantOAuthAccessToken.findUnique.mockResolvedValue({
      id: 'access-a',
      authorizationId: 'authorization-a',
      expiresAt: values.expiresAt || new Date(Date.now() + 60_000),
      revokedAt: values.revokedAt || null,
      authorization: { userId: 'user-a', merchantId: 'merchant-a', resource: values.resource || 'https://www.visutry.com/api/mcp', status: values.authorizationStatus || 'ACTIVE', scopes: ['merchant:read'] },
    })
    await expect(authenticateMerchantOAuthAccessToken('mcp_at_invalid', 'https://www.visutry.com/api/mcp')).rejects.toMatchObject({ code: 'INVALID_AGENT_CREDENTIAL' })
  })

  it('reuses existing scope enforcement for OAuth actors', () => {
    const actor = { actorType: 'AGENT_OAUTH' as const, actorId: 'access-a', userId: 'user-a', authorizationId: 'authorization-a', merchantId: 'merchant-a', scopes: ['merchant:read'] as MerchantAgentScope[] }
    expect(() => requireAgentScope(actor, 'merchant:read')).not.toThrow()
    expect(() => requireAgentScope(actor, 'experience:write')).toThrow('Agent scope required: experience:write')
  })

  it('requires the canonical resource in authorization and token requests', () => {
    expect(() => assertResource(undefined, 'http://localhost:3000/api/mcp')).toThrow(MerchantOAuthError)
    expect(() => assertResource('http://other.example/api/mcp', 'http://localhost:3000/api/mcp')).toThrow(MerchantOAuthError)
    expect(assertResource('http://localhost:3000/api/mcp', 'http://localhost:3000/api/mcp')).toBe('http://localhost:3000/api/mcp')
  })

  it('keeps local, preview, and production resource identifiers environment-specific', () => {
    const previous = process.env.MCP_RESOURCE_URL
    const previousPublic = process.env.NEXT_PUBLIC_MCP_RESOURCE_URL
    delete process.env.MCP_RESOURCE_URL
    delete process.env.NEXT_PUBLIC_MCP_RESOURCE_URL
    expect(canonicalMcpResource('http://localhost:3000')).toBe('http://localhost:3000/api/mcp')
    expect(canonicalMcpResource('https://preview.visutry.example')).toBe('https://preview.visutry.example/api/mcp')
    process.env.MCP_RESOURCE_URL = 'https://www.visutry.com/api/mcp'
    expect(canonicalMcpResource('https://preview.visutry.example')).toBe('https://www.visutry.com/api/mcp')
    if (previous === undefined) delete process.env.MCP_RESOURCE_URL
    else process.env.MCP_RESOURCE_URL = previous
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_MCP_RESOURCE_URL
    else process.env.NEXT_PUBLIC_MCP_RESOURCE_URL = previousPublic
  })

  it('hardens DCR metadata and redirect URI validation', async () => {
    await expect(registerMcpOAuthClient({ clientName: 'native', redirectUris: ['https://client.example/callback'], applicationType: 'native' })).rejects.toMatchObject({ code: 'invalid_client_metadata' })
    await expect(registerMcpOAuthClient({ clientName: 'web', redirectUris: ['http://localhost:3000/callback'], applicationType: 'web' })).rejects.toMatchObject({ code: 'invalid_client_metadata' })
    await expect(registerMcpOAuthClient({ clientName: 'bad', redirectUris: ['https://user:pass@client.example/callback'] })).rejects.toMatchObject({ code: 'invalid_request' })
    await expect(registerMcpOAuthClient({ clientName: 'bad', redirectUris: ['https://client.example/callback#fragment'] })).rejects.toMatchObject({ code: 'invalid_request' })
    await expect(registerMcpOAuthClient({ clientName: 'bad', redirectUris: ['https://client.example/callback'], tokenEndpointAuthMethod: 'client_secret_post' })).rejects.toMatchObject({ code: 'invalid_client_metadata' })
    await expect(registerMcpOAuthClient({ clientName: 'native', redirectUris: ['http://127.0.0.1:4567/callback'], applicationType: 'native', grantTypes: ['authorization_code'], responseTypes: ['code'] })).resolves.toMatchObject({ clientId: expect.stringMatching(/^mcp_/u) })
  })

  it('supports CIMD as the primary no-pre-registration client path with strict metadata validation', async () => {
    const clientId = 'https://client.example/.well-known/mcp-client.json'
    mockResolvePinned.mockResolvedValue({ clientId, hostname: 'client.example', address: '93.184.216.34', family: 4, port: 443, path: '/.well-known/mcp-client.json' })
    mockFetchPinned.mockResolvedValue({
      status: 200,
      contentType: 'application/json',
      contentLength: undefined,
      cacheControl: 'max-age=60',
      body: JSON.stringify({
      client_id: clientId,
      client_name: 'CIMD client',
      redirect_uris: ['http://127.0.0.1:4567/callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      }),
    })
    await expect(getMcpOAuthClient(clientId)).resolves.toMatchObject({ clientId, clientName: 'CIMD client', tokenEndpointAuthMethod: 'none' })
    expect(mockResolvePinned).toHaveBeenCalledWith(clientId)
    expect(mockFetchPinned).toHaveBeenCalledWith(expect.objectContaining({ address: '93.184.216.34', hostname: 'client.example' }), expect.objectContaining({ timeoutMs: 2_000, maxBytes: 64 * 1024 }))
    await expect(getMcpOAuthClient('https://client.example/.well-known/mcp-client.json?evil=1')).rejects.toMatchObject({ code: 'invalid_client' })
  })

  it('requires response_type=code and rate-limits public DCR by a distributed bucket', async () => {
    mockPrisma.merchantOAuthClient.findUnique.mockResolvedValue({ clientId: 'client-a', clientName: 'Test', redirectUris: ['http://127.0.0.1:4567/callback'], tokenEndpointAuthMethod: 'none' })
    await expect(createMcpOAuthAuthorizationRequest({
      clientId: 'client-a',
      redirectUri: 'http://127.0.0.1:4567/callback',
      responseType: 'foo',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      expectedResource: 'http://localhost:3000/api/mcp',
      resource: 'http://localhost:3000/api/mcp',
    })).rejects.toMatchObject({ code: 'unsupported_response_type' })

    mockPrisma.merchantOAuthDcrCounter.upsert.mockResolvedValue({ count: 2 })
    await expect(consumeMcpOAuthDcrRateLimit({ identity: '203.0.113.10', limit: 1 })).rejects.toMatchObject({ code: 'rate_limited', httpStatus: 429, retryAfterSeconds: expect.any(Number) })
  })

  it('uses one-time short-lived PKCE codes and never stores raw access or refresh tokens', async () => {
    const verifier = 'verifier-a'
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const codeRow = {
      id: 'code-a', codeHash: createHash('sha256').update('code-a').digest('hex'), clientId: 'client-a', userId: 'user-a', merchantId: 'merchant-a',
      redirectUri: 'http://127.0.0.1:4567/callback', scopes: ['merchant:read'], resource: 'http://localhost:3000/api/mcp', codeChallenge: challenge, codeChallengeMethod: 'S256', expiresAt: new Date(Date.now() + 60_000), usedAt: null as Date | null,
    }
    mockPrisma.merchantOAuthClient.findUnique.mockResolvedValue({ clientId: 'client-a', clientName: 'Test', redirectUris: [codeRow.redirectUri], tokenEndpointAuthMethod: 'none' })
    mockPrisma.merchantOAuthAuthorizationCode.findUnique.mockResolvedValue(codeRow)
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => callback(mockPrisma))

    const tokens = await exchangeMcpOAuthCode({ clientId: 'client-a', code: 'code-a', redirectUri: codeRow.redirectUri, codeVerifier: verifier, resource: codeRow.resource, expectedResource: codeRow.resource })
    expect(tokens.accessToken).toMatch(/^mcp_at_/u)
    expect(tokens.refreshToken).toMatch(/^mcp_rt_/u)
    expect(mockPrisma.merchantOAuthAccessToken.create.mock.calls[0][0].data.tokenHash).not.toContain(tokens.accessToken)
    expect(mockPrisma.merchantOAuthRefreshToken.create.mock.calls[0][0].data.tokenHash).not.toContain(tokens.refreshToken)

    codeRow.usedAt = new Date()
    await expect(exchangeMcpOAuthCode({ clientId: 'client-a', code: 'code-a', redirectUri: codeRow.redirectUri, codeVerifier: verifier, resource: codeRow.resource, expectedResource: codeRow.resource })).rejects.toMatchObject({ code: 'invalid_grant' })
  })

  it('rejects invalid PKCE, expired codes, and wrong token resources', async () => {
    const codeRow = {
      id: 'code-a', codeHash: createHash('sha256').update('code-a').digest('hex'), clientId: 'client-a', userId: 'user-a', merchantId: 'merchant-a',
      redirectUri: 'http://127.0.0.1:4567/callback', scopes: ['merchant:read'], resource: 'http://localhost:3000/api/mcp', codeChallenge: 'different', codeChallengeMethod: 'S256', expiresAt: new Date(Date.now() + 60_000), usedAt: null as Date | null,
    }
    mockPrisma.merchantOAuthClient.findUnique.mockResolvedValue({ clientId: 'client-a', clientName: 'Test', redirectUris: [codeRow.redirectUri], tokenEndpointAuthMethod: 'none' })
    mockPrisma.merchantOAuthAuthorizationCode.findUnique.mockResolvedValue(codeRow)
    await expect(exchangeMcpOAuthCode({ clientId: 'client-a', code: 'code-a', redirectUri: codeRow.redirectUri, codeVerifier: 'wrong', resource: 'http://other.example/api/mcp', expectedResource: codeRow.resource })).rejects.toMatchObject({ code: 'invalid_target' })
    codeRow.expiresAt = new Date(Date.now() - 1)
    await expect(exchangeMcpOAuthCode({ clientId: 'client-a', code: 'code-a', redirectUri: codeRow.redirectUri, codeVerifier: 'wrong', resource: codeRow.resource, expectedResource: codeRow.resource })).rejects.toMatchObject({ code: 'invalid_grant' })

    mockPrisma.merchantOAuthRefreshToken.findUnique.mockResolvedValue({
      id: 'refresh-a', revokedAt: null, expiresAt: new Date(Date.now() + 60_000), authorizationId: 'authorization-a',
      authorization: { status: 'ACTIVE', resource: 'http://localhost:3000/api/mcp', scopes: ['merchant:read'] },
    })
    await expect(refreshMcpOAuthToken({ refreshToken: 'mcp_rt_a', resource: 'http://other.example/api/mcp', expectedResource: 'http://localhost:3000/api/mcp' })).rejects.toMatchObject({ code: 'invalid_target' })
  })

  it('rotates refresh tokens and revocation invalidates both token families', async () => {
    const row = { id: 'refresh-a', revokedAt: null as Date | null, expiresAt: new Date(Date.now() + 60_000), authorizationId: 'authorization-a', authorization: { status: 'ACTIVE', resource: 'http://localhost:3000/api/mcp', scopes: ['merchant:read'] } }
    mockPrisma.merchantOAuthRefreshToken.findUnique.mockResolvedValue(row)
    mockPrisma.$transaction.mockImplementation(async (operation: any) => Array.isArray(operation) ? Promise.all(operation) : operation(mockPrisma))
    await expect(refreshMcpOAuthToken({ refreshToken: 'mcp_rt_a', resource: row.authorization.resource, expectedResource: row.authorization.resource })).resolves.toMatchObject({ scope: 'merchant:read' })
    expect(mockPrisma.merchantOAuthRefreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'refresh-a', revokedAt: null }, data: expect.objectContaining({ revokedAt: expect.any(Date) }) }))

    row.revokedAt = new Date()
    await expect(refreshMcpOAuthToken({ refreshToken: 'mcp_rt_a', resource: row.authorization.resource, expectedResource: row.authorization.resource })).rejects.toMatchObject({ code: 'invalid_grant' })
    expect(mockPrisma.merchantOAuthAuthorization.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'authorization-a' }, data: expect.objectContaining({ status: 'REVOKED' }) }))
    expect(mockPrisma.merchantOAuthAccessToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorizationId: 'authorization-a', revokedAt: null } }))

    await revokeMcpOAuthToken('mcp_rt_a')
    expect(mockPrisma.merchantOAuthRefreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tokenHash: expect.any(String), revokedAt: null } }))
  })
})

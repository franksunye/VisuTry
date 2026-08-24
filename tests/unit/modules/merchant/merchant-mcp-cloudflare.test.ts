/** @jest-environment node */

jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({
  authenticateMerchantAgentCredential: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { authenticateMerchantAgentCredential } from '@/modules/merchant/application/merchant-agent-credentials-cloudflare'
import {
  authenticateMerchantMcpBearer,
  authenticateMerchantOAuthAccessToken,
} from '@/modules/merchant/application/merchant-mcp-cloudflare'
import { InvalidAgentCredentialError } from '@/modules/merchant/domain/agent-credentials'

const resource = 'https://www.visutry.com/api/mcp'

function sqlMock(rows: unknown[]) {
  const sql = jest.fn(async () => rows) as jest.Mock & { transaction: jest.Mock }
  sql.transaction = jest.fn(async () => [])
  return sql
}

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    accessTokenId: 'access-token-a',
    accessExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    accessRevokedAt: null,
    authorizationId: 'authorization-a',
    userId: 'user-a',
    merchantId: 'merchant-a',
    scopes: ['merchant:read', 'catalog:read', 'experience:read', 'analytics:read'],
    resource,
    status: 'ACTIVE',
    ...overrides,
  }
}

describe('Cloudflare MCP bearer authentication', () => {
  afterEach(() => jest.clearAllMocks())

  it('authenticates a DB-backed OAuth access token and records last use', async () => {
    const sql = sqlMock([validRow()])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(authenticateMerchantOAuthAccessToken('mcp_at_test', resource)).resolves.toEqual({
      actorType: 'AGENT_OAUTH',
      actorId: 'access-token-a',
      userId: 'user-a',
      authorizationId: 'authorization-a',
      merchantId: 'merchant-a',
      scopes: ['merchant:read', 'catalog:read', 'experience:read', 'analytics:read'],
    })
    expect(sql.transaction).toHaveBeenCalledTimes(1)
    expect(sql.mock.calls[0][0].join('')).toContain('MerchantOAuthAccessToken')
  })

  it.each([
    ['unknown token', []],
    ['expired token', [validRow({ accessExpiresAt: new Date(Date.now() - 1) })]],
    ['revoked token', [validRow({ accessRevokedAt: new Date() })]],
    ['revoked authorization', [validRow({ status: 'REVOKED' })]],
    ['wrong resource', [validRow({ resource: 'https://evil.example/api/mcp' })]],
  ])('rejects deterministic stale or invalid credentials: %s', async (_label, rows) => {
    const sql = sqlMock(rows)
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(authenticateMerchantOAuthAccessToken('mcp_at_test', resource)).rejects.toBeInstanceOf(InvalidAgentCredentialError)
    expect(sql.transaction).not.toHaveBeenCalled()
  })

  it('keeps Agent Key authentication on the existing credential path', async () => {
    const actor = { actorType: 'AGENT_CREDENTIAL', actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read'] }
    ;(authenticateMerchantAgentCredential as jest.Mock).mockResolvedValue(actor)

    await expect(authenticateMerchantMcpBearer('vt_live_test', resource)).resolves.toEqual(actor)
    expect(authenticateMerchantAgentCredential).toHaveBeenCalledWith('vt_live_test')
    expect(getCloudflareSql).not.toHaveBeenCalled()
  })
})

import { resolveMerchantAgentIntegrationStatus } from '@/modules/merchant/domain/merchant-integration-presentation'

describe('Merchant Agent integration status presentation', () => {
  it('distinguishes no active credential from revoked history', () => {
    expect(resolveMerchantAgentIntegrationStatus([])).toMatchObject({ kind: 'NOT_CONFIGURED', activeCredentialCount: 0, revokedCredentialCount: 0 })
    expect(resolveMerchantAgentIntegrationStatus([{ status: 'REVOKED', lastUsedAt: '2026-09-01T00:00:00.000Z' }])).toMatchObject({ kind: 'NOT_CONFIGURED', activeCredentialCount: 0, revokedCredentialCount: 1, latestActiveUseAt: null })
  })

  it('does not treat an active unused credential as connected or used', () => {
    expect(resolveMerchantAgentIntegrationStatus([{ status: 'ACTIVE', lastUsedAt: null }])).toEqual({ kind: 'READY_TO_CONNECT', activeCredentialCount: 1, revokedCredentialCount: 0, latestActiveUseAt: null })
  })

  it('uses real lastUsedAt on an active key as evidence and chooses the latest timestamp', () => {
    expect(resolveMerchantAgentIntegrationStatus([
      { status: 'ACTIVE', lastUsedAt: '2026-09-03T00:00:00.000Z' },
      { status: 'ACTIVE', lastUsedAt: '2026-09-05T00:00:00.000Z' },
      { status: 'REVOKED', lastUsedAt: '2026-09-20T00:00:00.000Z' },
    ])).toEqual({ kind: 'USED', activeCredentialCount: 2, revokedCredentialCount: 1, latestActiveUseAt: '2026-09-05T00:00:00.000Z' })
  })

  it('does not accept malformed usage timestamps as connection evidence', () => {
    expect(resolveMerchantAgentIntegrationStatus([{ status: 'ACTIVE', lastUsedAt: 'not-a-date' }]).kind).toBe('READY_TO_CONNECT')
  })
})

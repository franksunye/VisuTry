jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantAgentBrandKit } from '@/modules/merchant/application/merchant-agent-brand-read-cloudflare'

const actor = {
  actorType: 'AGENT_CREDENTIAL' as const,
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['merchant:read', 'experience:read'],
}

describe('Cloudflare Agent Brand Kit parity', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the same tenant-bound Brand Kit and optional Experience Hero shape as Prisma', async () => {
    const sql = jest.fn()
      .mockResolvedValueOnce([{ id: 'merchant-a', name: 'Eyewear A', logoUrl: null, accentColor: '#1D4ED8' }])
      .mockResolvedValueOnce([{ id: 'experience-a', type: 'CAMPAIGN', status: 'DRAFT', heroAssetUrl: null }])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const data = await getMerchantAgentBrandKit({ actor, experienceId: 'experience-a' })
    expect(data).toMatchObject({
      merchant: { id: 'merchant-a', effectiveAccentColor: '#1D4ED8' },
      experience: { id: 'experience-a', type: 'CAMPAIGN', status: 'DRAFT', heroAssetUrl: null },
      permissions: { brandChanges: 'HUMAN_OWNER_ONLY' },
    })
    expect(data.supportedAccentColors).toHaveLength(6)
    expect(sql).toHaveBeenCalledTimes(2)
    const query = sql.mock.calls[1][0].join(' ')
    expect(query).toContain('"merchantId"')
    expect(query).toContain('"type" IN')
    expect(sql.mock.calls[1]).toEqual(expect.arrayContaining(['experience-a', 'merchant-a']))
  })

  it('returns not-found for an unrelated Experience without revealing its existence', async () => {
    const sql = jest.fn().mockResolvedValueOnce([
      { id: 'merchant-a', name: 'Eyewear A', logoUrl: null, accentColor: null },
    ]).mockResolvedValueOnce([])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    await expect(getMerchantAgentBrandKit({ actor, experienceId: 'foreign' }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
  })

  it('rejects missing read scope without hitting Cloudflare SQL', async () => {
    await expect(getMerchantAgentBrandKit({ actor: { ...actor, scopes: ['merchant:read'] } }))
      .rejects.toMatchObject({ code: 'AGENT_SCOPE_REQUIRED' })
    expect(getCloudflareSql).not.toHaveBeenCalled()
  })
})

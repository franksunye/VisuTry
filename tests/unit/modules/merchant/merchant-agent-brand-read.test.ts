import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { findFirst: jest.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { getMerchantAgentBrandKit } from '@/modules/merchant/application/merchant-agent-brand-read'

const actor: AgentMerchantActor = {
  actorType: 'AGENT_CREDENTIAL',
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['merchant:read', 'experience:read'],
}

describe('canonical Prisma Agent Brand Kit read', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({
      id: 'merchant-a', name: 'Eyewear A', logoUrl: null, accentColor: '#1D4ED8',
    })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'experience-a', type: 'STORE', status: 'ACTIVE', heroAssetUrl: 'https://example.test/hero.png',
    })
  })

  it('returns tenant-owned brand and the fixed accessible palette without writes', async () => {
    const result = await getMerchantAgentBrandKit({ actor })
    expect(result).toMatchObject({
      merchant: { id: 'merchant-a', effectiveAccentColor: '#1D4ED8' },
      experience: null,
      permissions: { brandChanges: 'HUMAN_OWNER_ONLY', experienceHeroChanges: 'HUMAN_OWNER_ONLY' },
    })
    expect(result.supportedAccentColors).toHaveLength(6)
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'merchant-a' },
      select: { id: true, name: true, logoUrl: true, accentColor: true },
    })
    expect(prisma.experience.findFirst).not.toHaveBeenCalled()
  })

  it('reads one explicitly requested tenant-owned Store/Campaign Hero without cross-tenant lookups', async () => {
    const result = await getMerchantAgentBrandKit({ actor, experienceId: 'experience-a' })
    expect(result.experience).toMatchObject({ id: 'experience-a', type: 'STORE', status: 'ACTIVE' })
    expect(prisma.experience.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'experience-a', merchantId: 'merchant-a', type: { in: ['STORE', 'CAMPAIGN'] },
      },
      select: { id: true, type: true, status: true, heroAssetUrl: true },
    })
  })

  it('conceals foreign/missing Experiences as tenant-scoped not-found', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValueOnce(null)
    await expect(getMerchantAgentBrandKit({ actor, experienceId: 'foreign' }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND', httpStatus: 404 })
  })

  it('requires BOTH merchant and experience read scopes before any database access', async () => {
    for (const scopes of [['merchant:read'], ['experience:read'], []] as MerchantAgentScope[][]) {
      await expect(getMerchantAgentBrandKit({ actor: { ...actor, scopes } }))
        .rejects.toMatchObject({ code: 'AGENT_SCOPE_REQUIRED' })
    }
    expect(prisma.merchant.findUnique).not.toHaveBeenCalled()
  })
})

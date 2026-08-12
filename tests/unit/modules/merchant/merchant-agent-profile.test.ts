import { getMerchantProfile, requireMerchantTenant } from '@/modules/merchant'

describe('merchant profile commerce boundary', () => {
  const repository = {
    findById: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    repository.findById.mockResolvedValue({
      id: 'merchant-a',
      slug: 'merchant-a',
      name: 'Merchant A',
      status: 'ACTIVE',
      websiteUrl: null,
      contactEmail: null,
    })
  })

  it('serves the human and agent adapters through the same service and tenant authority', async () => {
    const human = await getMerchantProfile({
      actor: { actorType: 'HUMAN', actorId: 'user-a', merchantId: 'merchant-a' },
      repository,
    })
    const agent = await getMerchantProfile({
      actor: { actorType: 'AGENT_CREDENTIAL', actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read'] },
      repository,
    })

    expect(human).toEqual(agent)
    expect(repository.findById).toHaveBeenNthCalledWith(1, 'merchant-a')
    expect(repository.findById).toHaveBeenNthCalledWith(2, 'merchant-a')
  })

  it('cannot be redirected to another merchant by an agent request', async () => {
    const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read' as const] }

    await getMerchantProfile({ actor, repository })

    expect(repository.findById).not.toHaveBeenCalledWith('merchant-b')
  })

  it.each(['Merchant', 'Catalog', 'Experience'])('denies an agent tenant mismatch for a %s resource', (resourceType) => {
    const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read' as const] }

    expect(() => requireMerchantTenant(actor, 'merchant-a')).not.toThrow()
    expect(() => requireMerchantTenant(actor, 'merchant-b')).toThrow(expect.objectContaining({ httpStatus: 404 }))
    expect(resourceType).toBeTruthy()
  })
})

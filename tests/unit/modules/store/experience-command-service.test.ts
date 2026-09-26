jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { createExperienceCommandService, ExperienceCommandError, type ExperienceCommandRepository } from '@/modules/store/application/experience-command-service'

const validJourney = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }
const validDelivery = { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 }

function serviceFor(type: 'STORE' | 'CAMPAIGN' = 'STORE') {
  const repository: ExperienceCommandRepository = {
    findTarget: jest.fn().mockResolvedValue({ id: 'experience-1', slug: type === 'STORE' ? 'store' : 'summer', type, merchantSlug: 'merchant-a' }),
    update: jest.fn().mockResolvedValue({ id: 'experience-1' }),
    replaceCatalogSelection: jest.fn().mockResolvedValue(undefined),
  }
  return { commands: createExperienceCommandService(repository), repository }
}

describe('canonical Experience command boundary', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each(['STORE', 'CAMPAIGN'] as const)('applies the same shared Journey/Delivery command semantics to %s', async (type) => {
    const { commands, repository } = serviceFor(type)

    await commands.updateSharedConfiguration({
      merchantId: 'merchant-a',
      experienceId: 'experience-1',
      patch: { journeyPolicy: validJourney, deliveryPolicy: validDelivery },
    })

    expect(repository.update).toHaveBeenCalledWith('merchant-a', 'experience-1', {
      journeyPolicy: validJourney,
      deliveryPolicy: validDelivery,
    }, { afterUpdate: undefined, atomicEffects: undefined })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: type === 'STORE' ? null : 'summer' },
    }))
  })

  it('validates every shared patch field before querying or mutating the aggregate', async () => {
    const { commands, repository } = serviceFor()

    await expect(commands.updateSharedConfiguration({
      merchantId: 'merchant-a',
      experienceId: 'experience-1',
      patch: { journeyPolicy: validJourney, deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 1 } },
    })).rejects.toBeInstanceOf(Error)

    expect(repository.findTarget).not.toHaveBeenCalled()
    expect(repository.update).not.toHaveBeenCalled()
    expect(withPublicDiscoveryInvalidation).not.toHaveBeenCalled()
  })

  it('bounds configured handoff types while preserving known legacy CTA values', async () => {
    const { commands, repository } = serviceFor()
    await commands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'experience-1',
      patch: { primaryCtaType: 'PRODUCT_OR_COLLECTION', secondaryCtaType: 'WHATSAPP' },
    })
    expect(repository.update).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
    await expect(commands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'experience-1',
      patch: { primaryCtaType: 'EXECUTE_SCRIPT' },
    })).rejects.toThrow('primaryCtaType must use a supported Merchant Handoff action')
    expect(repository.findTarget).not.toHaveBeenCalled()
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('keeps Campaign-only policy fields out of shared commands and rejects wrong aggregate types', async () => {
    const { commands, repository } = serviceFor('STORE')

    await expect(commands.updateSharedConfiguration({
      merchantId: 'merchant-a',
      experienceId: 'experience-1',
      patch: { campaignGate: 'NONE' },
    })).rejects.toBeInstanceOf(ExperienceCommandError)
    await expect(commands.updateCampaignConfiguration({
      merchantId: 'merchant-a',
      experienceId: 'experience-1',
      patch: { campaignGate: 'NONE' },
    })).rejects.toThrow('Experience not found')

    expect(repository.update).not.toHaveBeenCalled()
  })

  it('deduplicates Catalog selections and invalidates only after the atomic replacement succeeds', async () => {
    const { commands, repository } = serviceFor('CAMPAIGN')
    const afterReplace = jest.fn().mockResolvedValue(undefined)

    await commands.replaceCatalogSelection({
      merchantId: 'merchant-a',
      experienceId: 'experience-1',
      expectedType: 'CAMPAIGN',
      frameIds: ['frame-a', 'frame-a', 'frame-b'],
      afterReplace,
    })

    expect(repository.replaceCatalogSelection).toHaveBeenCalledWith(expect.objectContaining({ frameIds: ['frame-a', 'frame-b'], afterReplace }))
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
    const failed = serviceFor('CAMPAIGN')
    ;(failed.repository.replaceCatalogSelection as jest.Mock).mockRejectedValue(new Error('write failed'))
    await expect(failed.commands.replaceCatalogSelection({ merchantId: 'merchant-a', experienceId: 'experience-1', frameIds: [] })).rejects.toThrow('write failed')
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledTimes(1)
  })

  it('keeps capacity-checked Campaign lifecycle mutations behind the shared invalidation boundary', async () => {
    const { commands } = serviceFor('CAMPAIGN')
    const mutation = jest.fn().mockResolvedValue({ status: 'ACTIVE' })

    await commands.runCampaignLifecycleMutation({ merchantId: 'merchant-a', experienceId: 'experience-1', mutation })

    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'summer' },
      mutation,
    }))

    const wrongType = serviceFor('STORE')
    const rejectedMutation = jest.fn()
    await expect(wrongType.commands.runCampaignLifecycleMutation({
      merchantId: 'merchant-a', experienceId: 'experience-1', mutation: rejectedMutation,
    })).rejects.toThrow('Experience not found')
    expect(rejectedMutation).not.toHaveBeenCalled()
  })
})

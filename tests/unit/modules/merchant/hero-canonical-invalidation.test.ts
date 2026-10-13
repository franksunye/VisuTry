/** @jest-environment node */
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { createExperienceCommandService, type ExperienceCommandRepository } from '@/modules/store/application/experience-command-service'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'

const hero = 'https://cdn.public.blob.vercel-storage.com/merchant-brand/merchant-a/hero/experience-a/a.webp'

function serviceFor(type: 'STORE' | 'CAMPAIGN') {
  const repo: ExperienceCommandRepository = {
    findTarget: jest.fn().mockResolvedValue({
      id: 'experience-a', type, slug: type === 'CAMPAIGN' ? 'fall' : 'default',
      merchantSlug: 'merchant-a',
    }),
    update: jest.fn().mockResolvedValue({ id: 'experience-a', heroAssetUrl: hero }),
    replaceCatalogSelection: jest.fn(),
  }
  return { service: createExperienceCommandService(repo), repo }
}

beforeEach(() => jest.clearAllMocks())

describe('Hero writes already use one canonical public invalidation', () => {
  it.each([
    { type: 'STORE' as const, slug: null },
    { type: 'CAMPAIGN' as const, slug: 'fall' },
  ])('canonical $type Hero write invalidates exactly one scoped route', async ({ type, slug }) => {
    const { service, repo } = serviceFor(type)
    const result = await service.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'experience-a',
      expectedType: type, patch: { heroAssetUrl: hero },
      draftOnly: type === 'STORE',
    })
    expect(result).toMatchObject({ heroAssetUrl: hero })
    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledTimes(1)
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: slug },
      mutation: expect.any(Function),
    }))
  })

  it('does not perform a public cache invalidation for a missing or wrong-tenant Experience', async () => {
    const { service, repo } = serviceFor('STORE')
    ;(repo.findTarget as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.updateSharedConfiguration({
      merchantId: 'foreign', experienceId: 'experience-a', patch: { heroAssetUrl: hero },
    })).rejects.toThrow('Experience not found')
    expect(repo.update).not.toHaveBeenCalled()
    expect(withPublicDiscoveryInvalidation).not.toHaveBeenCalled()
  })
})

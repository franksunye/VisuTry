import { prisma } from '@/lib/prisma'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn(), update: jest.fn() },
    merchant: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

describe('Prisma Experience Agent draft-only write boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'campaign-a', slug: 'spring', type: 'CAMPAIGN', merchant: { slug: 'merchant-a' },
    })
  })

  it('rejects an ACTIVE update before configuration, callbacks, or selection writes', async () => {
    const queryRaw = jest.fn().mockResolvedValue([])
    const update = jest.fn()
    const deleteMany = jest.fn()
    const createMany = jest.fn()
    const afterUpdate = jest.fn()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      $queryRaw: queryRaw,
      experience: { update },
      experienceFrame: { deleteMany, createMany },
    }))

    await expect(experienceCommands.updateCampaignConfiguration({
      merchantId: 'merchant-a', experienceId: 'campaign-a', patch: { primaryCtaLabel: 'Shop now' }, draftOnly: true, afterUpdate,
    })).rejects.toBeInstanceOf(ExperienceCommandError)

    expect(String(queryRaw.mock.calls[0]?.[0]?.join(''))).toContain('"merchantId"')
    expect(String(queryRaw.mock.calls[0]?.[0]?.join(''))).toContain("'DRAFT' FOR UPDATE")
    expect(update).not.toHaveBeenCalled()
    expect(deleteMany).not.toHaveBeenCalled()
    expect(createMany).not.toHaveBeenCalled()
    expect(afterUpdate).not.toHaveBeenCalled()
  })

  it('allows a locked Draft update and runs its atomic callback once', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ id: 'campaign-a' }])
    const update = jest.fn().mockResolvedValue({ id: 'campaign-a', primaryCtaLabel: 'Shop now' })
    const afterUpdate = jest.fn().mockResolvedValue(undefined)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      $queryRaw: queryRaw,
      experience: { update },
      experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    }))

    await experienceCommands.updateCampaignConfiguration({
      merchantId: 'merchant-a', experienceId: 'campaign-a', patch: { primaryCtaLabel: 'Shop now' }, draftOnly: true, afterUpdate,
    })

    expect(update).toHaveBeenCalledTimes(1)
    expect(afterUpdate).toHaveBeenCalledTimes(1)
  })

  it('rejects an ACTIVE frame replacement before delete/create or its audit callback', async () => {
    const queryRaw = jest.fn().mockResolvedValue([])
    const deleteMany = jest.fn()
    const createMany = jest.fn()
    const afterReplace = jest.fn()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      $queryRaw: queryRaw,
      experience: { update: jest.fn() },
      experienceFrame: { deleteMany, createMany },
    }))

    await expect(experienceCommands.replaceCatalogSelection({
      merchantId: 'merchant-a', experienceId: 'campaign-a', expectedType: 'CAMPAIGN', frameIds: ['frame-a'], draftOnly: true, afterReplace,
    })).rejects.toBeInstanceOf(ExperienceCommandError)

    expect(deleteMany).not.toHaveBeenCalled()
    expect(createMany).not.toHaveBeenCalled()
    expect(afterReplace).not.toHaveBeenCalled()
  })
})

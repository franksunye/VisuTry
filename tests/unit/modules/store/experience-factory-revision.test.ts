jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'

const revision = '2026-10-12T08:30:00.000Z'
const tx = {
  $queryRaw: jest.fn(),
  experience: { update: jest.fn() },
}

describe('Canonical Prisma Experience optimistic DRAFT revision', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'store-a', slug: 'store', type: 'STORE',
      merchant: { slug: 'store-a' },
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(tx))
    tx.$queryRaw.mockResolvedValue([{ id: 'store-a', updatedAt: new Date(revision) }])
    tx.experience.update.mockResolvedValue({ id: 'store-a', status: 'DRAFT', name: 'New' })
  })

  it('locks DRAFT row and enforces expected updatedAt in the canonical transaction before writes', async () => {
    const result = await experienceCommands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'store-a',
      expectedType: 'STORE', draftOnly: true,
      expectedUpdatedAt: revision,
      patch: { name: 'New' },
    })
    expect(result).toMatchObject({ id: 'store-a', name: 'New' })
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    const first = tx.$queryRaw.mock.calls[0][0]
    expect(first.join(' ')).toContain('FOR UPDATE')
    expect(first.join(' ')).toContain("'DRAFT'")
    expect(tx.experience.update).toHaveBeenCalledTimes(1)
  })

  it('rejects an outdated approval within locked transaction, never updating Store', async () => {
    tx.$queryRaw.mockResolvedValue([{ id: 'store-a', updatedAt: new Date('2026-10-12T09:10:00.000Z') }])
    await expect(experienceCommands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'store-a',
      expectedType: 'STORE', draftOnly: true,
      expectedUpdatedAt: revision,
      patch: { name: 'New' },
    })).rejects.toThrow('FACTORY_DRAFT_STORE_STALE_REVISION')
    expect(tx.experience.update).not.toHaveBeenCalled()
  })

  it('does not update a Store that became ACTIVE after the approval read', async () => {
    tx.$queryRaw.mockResolvedValue([])
    await expect(experienceCommands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'store-a',
      expectedType: 'STORE', draftOnly: true,
      expectedUpdatedAt: revision,
      patch: { name: 'New' },
    })).rejects.toThrow('Agent changes are limited to Draft Experiences.')
    expect(tx.experience.update).not.toHaveBeenCalled()
  })

  it('preserves ordinary canonical unguarded Store writes without forcing Factory rules', async () => {
    const direct = jest.fn().mockResolvedValue({ id: 'store-a', name: 'Human Edit' })
    ;(prisma.experience as unknown as { update: jest.Mock }).update = direct
    await experienceCommands.updateSharedConfiguration({
      merchantId: 'merchant-a', experienceId: 'store-a',
      expectedType: 'STORE', patch: { name: 'Human Edit' },
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(direct).toHaveBeenCalledTimes(1)
  })
})

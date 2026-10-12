jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn() },
    merchant: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'

const tx = {
  $queryRaw: jest.fn(),
  experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
}

const selection = {
  merchantId: 'merchant-a',
  experienceId: 'experience-a',
  expectedType: 'STORE' as const,
  frameIds: ['frame-a'],
}

describe('Prisma Catalog selection serialization boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'experience-a', slug: 'store', type: 'STORE', merchant: { slug: 'merchant-a' },
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (run) => run(tx))
    tx.$queryRaw.mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'ACTIVE' }])
    tx.experienceFrame.deleteMany.mockResolvedValue({ count: 0 })
    tx.experienceFrame.createMany.mockResolvedValue({ count: 1 })
  })

  it.each([
    ['raw PostgreSQL SQLSTATE via Prisma P2010', { code: 'P2010', meta: { code: '40001', message: 'could not serialize access' } }],
    ['transaction write conflict via Prisma P2034', { code: 'P2034' }],
    ['direct SQLSTATE from PostgreSQL adapter', { code: '40001' }],
    ['adapter cause SQLSTATE', { code: 'P2010', cause: { code: '40001' } }],
    // Exact production-shaped driver-adapter wrapper found by Codex's real
    // isolated PostgreSQL16 archive-first/Store-selection race.
    ['observed P2010 driver adapter conflict string', {
      code: 'P2010', meta: { driverAdapterError: 'TransactionWriteConflict' },
    }],
    ['observed P2010 driver adapter conflict object', {
      code: 'P2010', meta: { driverAdapterError: { kind: 'TransactionWriteConflict' } },
    }],
    ['nested adapter conflict cause and SQLSTATE', {
      code: 'P2010',
      meta: { driverAdapterError: {
        name: 'DriverAdapterError',
        cause: { kind: 'TransactionWriteConflict', originalCode: '40001' },
      } },
    }],
  ])('translates %s into a recoverable, tenant-safe 409 without committing selections', async (_label, error) => {
    ;(prisma.$transaction as jest.Mock).mockRejectedValueOnce(error)
    await expect(experienceCommands.replaceCatalogSelection(selection))
      .rejects.toMatchObject({
        code: 'CATALOG_SELECTION_NOT_ACTIVE',
        httpStatus: 409,
        message: expect.stringMatching(/reload.*retry/i),
      })
    expect(tx.experienceFrame.deleteMany).not.toHaveBeenCalled()
    expect(tx.experienceFrame.createMany).not.toHaveBeenCalled()
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledTimes(1)
  })

  it('rejects a newly archived frame under lock, before any ExperienceFrame writes', async () => {
    tx.$queryRaw.mockReset().mockResolvedValueOnce([{ id: 'merchant-a' }])
      .mockResolvedValueOnce([{ id: 'frame-a', status: 'INACTIVE' }])
    await expect(experienceCommands.replaceCatalogSelection(selection))
      .rejects.toMatchObject({ code: 'CATALOG_SELECTION_NOT_ACTIVE', httpStatus: 409 })
    expect(tx.experienceFrame.deleteMany).not.toHaveBeenCalled()
    expect(tx.experienceFrame.createMany).not.toHaveBeenCalled()
  })

  it('preserves true database faults as errors rather than hiding them as recoverable races', async () => {
    const fault = { code: 'P2010', meta: { code: '23503', message: 'foreign key violation' } }
    ;(prisma.$transaction as jest.Mock).mockRejectedValueOnce(fault)
    await expect(experienceCommands.replaceCatalogSelection(selection)).rejects.toBe(fault)
    expect(tx.experienceFrame.deleteMany).not.toHaveBeenCalled()
  })

  it.each([
    ['plain failed raw query', { code: 'P2010', meta: { code: '23503' } }],
    ['non-serialization adapter conflict', {
      code: 'P2010',
      meta: { driverAdapterError: { kind: 'UniqueConstraintViolation', originalCode: '23505' } },
    }],
    ['unrelated adapter cause', {
      code: 'P2010',
      meta: { driverAdapterError: { cause: { kind: 'ForeignKeyConstraintViolation', originalCode: '23503' } } },
    }],
  ])('does not hide %s as a recoverable 409', async (_name, error) => {
    ;(prisma.$transaction as jest.Mock).mockRejectedValueOnce(error)
    await expect(experienceCommands.replaceCatalogSelection(selection)).rejects.toBe(error)
  })

  it('keeps ordinary valid Store selection transactional and invokes post-replace work once', async () => {
    const afterReplace = jest.fn().mockResolvedValue(undefined)
    await expect(experienceCommands.replaceCatalogSelection({ ...selection, afterReplace }))
      .resolves.toMatchObject({ frameIds: ['frame-a'] })
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2)
    expect(tx.experienceFrame.deleteMany).toHaveBeenCalledTimes(1)
    expect(tx.experienceFrame.createMany).toHaveBeenCalledTimes(1)
    expect(afterReplace).toHaveBeenCalledTimes(1)
  })
})

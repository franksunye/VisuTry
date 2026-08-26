jest.mock('@/lib/prisma', () => ({
    prisma: {
      $transaction: jest.fn(),
      merchantSponsoredUsage: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    },
}))

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createPrismaMerchantSponsoredUsageRepository } from '@/modules/store/infrastructure/prisma/merchant-sponsored-usage-repository'

const tx = {
  $executeRaw: jest.fn(),
  merchantSponsoredUsage: {
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
}

describe('Merchant sponsored usage repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (value: typeof tx) => unknown) => callback(tx))
    tx.merchantSponsoredUsage.findUnique.mockResolvedValue(null)
    tx.merchantSponsoredUsage.count.mockResolvedValue(0)
    tx.merchantSponsoredUsage.create.mockResolvedValue({ id: 'reservation-1', status: 'RESERVED' })
  })

  it('reserves one generation in a rolling window under a serializable transaction lock', async () => {
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)
    const now = new Date('2026-08-12T10:00:00.000Z')

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-a',
      experienceId: 'experience-a',
      userId: null,
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'generation-a',
      now,
    })).resolves.toEqual({ id: 'reservation-1', status: 'RESERVED' })

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1)
    expect(tx.merchantSponsoredUsage.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        merchantId: 'merchant-a',
        usageType: 'SPONSORED_GENERATION',
        createdAt: { gte: new Date('2026-08-11T10:00:00.000Z') },
        status: { in: ['RESERVED', 'CONSUMED'] },
        OR: [{ shopperIdentityHash: 'shopper-a' }],
      }),
    })
    expect(tx.merchantSponsoredUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchantId: 'merchant-a',
        shopperIdentityHash: 'shopper-a',
        status: 'RESERVED',
        createdAt: now,
      }),
      select: { id: true, status: true },
    })
  })

  it('blocks the second active generation for the same merchant and shopper', async () => {
    tx.merchantSponsoredUsage.count.mockResolvedValue(1)
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'generation-b',
    })).resolves.toBeNull()
    expect(tx.merchantSponsoredUsage.create).not.toHaveBeenCalled()
  })

  it('keys the rolling window by shopper identity, not session, frame, or task key', async () => {
    tx.merchantSponsoredUsage.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)
    const firstAt = new Date('2026-08-12T10:00:00.000Z')

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'task-frame-a',
      now: firstAt,
    })).resolves.toEqual({ id: 'reservation-1', status: 'RESERVED' })

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-b',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'task-frame-b',
      now: new Date(firstAt.getTime() + 60 * 60 * 1000),
    })).resolves.toBeNull()

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-c',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'task-frame-c',
      now: new Date(firstAt.getTime() + 25 * 60 * 60 * 1000),
    })).resolves.toEqual({ id: 'reservation-1', status: 'RESERVED' })

    expect(tx.merchantSponsoredUsage.count).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({
        createdAt: { gte: new Date('2026-08-11T11:00:00.000Z') },
        OR: [{ shopperIdentityHash: 'shopper-a' }],
      }),
    }))
    expect(tx.merchantSponsoredUsage.count).toHaveBeenNthCalledWith(3, expect.objectContaining({
      where: expect.objectContaining({
        createdAt: { gte: new Date('2026-08-12T11:00:00.000Z') },
        OR: [{ shopperIdentityHash: 'shopper-a' }],
      }),
    }))
  })

  it('keeps different anonymous shoppers isolated', async () => {
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)

    await repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'shopper-a-task',
    })
    await repository.reserve({
      merchantId: 'merchant-a',
      merchantSessionId: 'session-b',
      shopperIdentityHash: 'shopper-b',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'shopper-b-task',
    })

    expect(tx.merchantSponsoredUsage.create).toHaveBeenCalledTimes(2)
    expect(tx.merchantSponsoredUsage.count).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({
        OR: [{ shopperIdentityHash: 'shopper-b' }],
      }),
    }))
  })

  it('keeps merchant and identity scopes independent while matching a logged-in shopper identity', async () => {
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)

    await repository.reserve({
      merchantId: 'merchant-b',
      userId: 'user-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'generation-c',
    })

    expect(tx.merchantSponsoredUsage.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        merchantId: 'merchant-b',
        OR: [
          { shopperIdentityHash: 'shopper-a' },
          { userId: 'user-a' },
        ],
      }),
    })
  })

  it('is idempotent and only transitions reservations from RESERVED', async () => {
    tx.merchantSponsoredUsage.findUnique.mockResolvedValue({ id: 'existing', status: 'CONSUMED' })
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'generation-existing',
    })).resolves.toEqual({ id: 'existing', status: 'CONSUMED' })
    expect(tx.merchantSponsoredUsage.count).not.toHaveBeenCalled()

    ;(prisma.merchantSponsoredUsage.updateMany as jest.Mock)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    await expect(repository.consume('existing')).resolves.toBe(true)
    await expect(repository.release('existing')).resolves.toBe(false)
    expect(prisma.merchantSponsoredUsage.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { id: 'existing', status: 'RESERVED' },
      data: expect.objectContaining({ status: 'CONSUMED' }),
    }))
    expect(prisma.merchantSponsoredUsage.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { id: 'existing', status: 'RESERVED' },
      data: expect.objectContaining({ status: 'RELEASED' }),
    }))
  })

  it('recovers an idempotency-key race after a unique constraint conflict', async () => {
    ;(prisma.$transaction as jest.Mock).mockRejectedValueOnce({ code: 'P2002' })
    ;(prisma.merchantSponsoredUsage.findUnique as jest.Mock).mockResolvedValue({
      id: 'raced-reservation',
      status: 'RESERVED',
    })
    const repository = createPrismaMerchantSponsoredUsageRepository(prisma)

    await expect(repository.reserve({
      merchantId: 'merchant-a',
      shopperIdentityHash: 'shopper-a',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: 'generation-raced',
    })).resolves.toEqual({ id: 'raced-reservation', status: 'RESERVED' })
    expect(prisma.merchantSponsoredUsage.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'generation-raced' },
      select: { id: true, status: true },
    })
  })
})

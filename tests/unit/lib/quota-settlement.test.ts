import { settleTryOnTaskQuota } from '@/lib/quota'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}))

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

const completedTask = {
  userId: 'user-1',
  status: 'COMPLETED',
  quotaSettledAt: new Date(),
  quotaSource: 'credit',
}

const user = {
  id: 'user-1',
  isPremium: false,
  premiumExpiresAt: null,
  currentSubscriptionType: null,
  premiumUsageCount: 0,
  creditsPurchased: 3,
  creditsUsed: 1,
  freeTrialsUsed: 0,
}

function makeTransactionClient() {
  return {
    tryOnTask: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }
}

describe('settleTryOnTaskQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('claims and settles a completed task in one transaction', async () => {
    const tx = makeTransactionClient()
    tx.tryOnTask.updateMany.mockResolvedValue({ count: 1 })
    tx.user.findUnique.mockResolvedValue(user)
    tx.user.update.mockResolvedValue({})
    tx.tryOnTask.update.mockResolvedValue({})
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx))

    const result = await settleTryOnTaskQuota('task-1', 'user-1')

    expect(result).toEqual({ settled: true, alreadySettled: false, source: 'credit' })
    expect(tx.tryOnTask.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'task-1',
        userId: 'user-1',
        status: 'COMPLETED',
        quotaSettledAt: null,
      }),
    }))
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { creditsUsed: { increment: 1 } },
    })
    expect(tx.tryOnTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { quotaSource: 'credit' },
    })
    expect(revalidateTag).toHaveBeenCalledWith('user-user-1')
  })

  it('does not deduct again when another caller already settled the task', async () => {
    const tx = makeTransactionClient()
    tx.tryOnTask.updateMany.mockResolvedValue({ count: 0 })
    tx.tryOnTask.findUnique.mockResolvedValue(completedTask)
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx))

    const result = await settleTryOnTaskQuota('task-1', 'user-1')

    expect(result).toEqual({ settled: false, alreadySettled: true, source: 'credit' })
    expect(tx.user.findUnique).not.toHaveBeenCalled()
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('retries a serializable write conflict', async () => {
    const tx = makeTransactionClient()
    tx.tryOnTask.updateMany.mockResolvedValue({ count: 0 })
    tx.tryOnTask.findUnique.mockResolvedValue(completedTask)
    ;(prisma.$transaction as jest.Mock)
      .mockRejectedValueOnce(Object.assign(new Error('write conflict'), { code: 'P2034' }))
      .mockImplementationOnce((callback) => callback(tx))

    const result = await settleTryOnTaskQuota('task-1', 'user-1')

    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
    expect(result.alreadySettled).toBe(true)
  })
})

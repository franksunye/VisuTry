import { syncPendingConsumerTryOnTasks } from '@/lib/cron/sync-pending-consumer-tasks'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/tryon-service', () => ({
  getTryOnResult: jest.fn(),
}))

jest.mock('@/lib/quota', () => ({
  settleTryOnTaskQuota: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('syncPendingConsumerTryOnTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('includes Kie PROCESSING tasks in the daily fallback selector', async () => {
    ;(prisma.tryOnTask.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await syncPendingConsumerTryOnTasks()

    const where = (prisma.tryOnTask.findMany as jest.Mock).mock.calls[1][0].where
    expect(where.origin).toBe('CONSUMER')
    expect(where.OR).toEqual(expect.arrayContaining([
      expect.objectContaining({
        status: 'PROCESSING',
        metadata: { path: ['serviceType'], equals: 'grsai' },
      }),
      expect.objectContaining({
        status: 'PROCESSING',
        metadata: { path: ['serviceType'], equals: 'kie' },
      }),
    ]))
  })

  it('reconciles a stale Kie PENDING task without a provider ID', async () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 1000)
    ;(prisma.tryOnTask.findMany as jest.Mock)
      .mockResolvedValueOnce([{
        id: 'stale-kie',
        createdAt,
        updatedAt: createdAt,
        metadata: { serviceType: 'kie', dispatchOutcome: 'NOT_SENT' },
      }])
      .mockResolvedValueOnce([])
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await syncPendingConsumerTryOnTasks()
    expect(result.stalePendingFailed).toBe(1)
    expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'stale-kie' }),
      data: expect.objectContaining({ status: 'FAILED' }),
    }))
  })

  it('fails stale PENDING Consumer tasks that never saved an external ID', async () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 1000)
    const updatedAt = new Date(createdAt)
    ;(prisma.tryOnTask.findMany as jest.Mock)
      .mockResolvedValueOnce([{
        id: 'stale-task',
        createdAt,
        updatedAt,
        metadata: { serviceType: 'grsai', clientSubmissionId: 'submission-1' },
      }])
      .mockResolvedValueOnce([])
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await syncPendingConsumerTryOnTasks()

    expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: 'stale-task',
        origin: 'CONSUMER',
        status: 'PENDING',
        updatedAt,
      }),
      data: expect.objectContaining({
        status: 'FAILED',
        errorMessage: expect.stringContaining('Please retry'),
        metadata: expect.objectContaining({
          dispatchReconcileReason: 'missing_external_task_id',
          clientSubmissionId: 'submission-1',
        }),
      }),
    })
    expect(result).toMatchObject({
      total: 1,
      errors: 1,
      stalePendingFailed: 1,
    })
    expect(logger.warn).toHaveBeenCalledWith(
      'cron',
      'Marked stale Consumer dispatch as failed',
      expect.objectContaining({ taskId: 'stale-task' }),
    )
  })

  it('does not reconcile a task that already has an external ID', async () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 1000)
    ;(prisma.tryOnTask.findMany as jest.Mock)
      .mockResolvedValueOnce([{
        id: 'dispatched-task',
        createdAt,
        updatedAt: createdAt,
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-1' },
      }])
      .mockResolvedValueOnce([])

    const result = await syncPendingConsumerTryOnTasks()

    expect(prisma.tryOnTask.updateMany).not.toHaveBeenCalled()
    expect(result).toMatchObject({ total: 0, errors: 0, stalePendingFailed: 0 })
  })
})

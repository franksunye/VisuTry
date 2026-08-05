jest.mock('@prisma/client', () => ({
  TaskStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))
jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}))

import { prisma } from '@/lib/prisma'
import {
  acquireStoreDispatchTakeover,
  acquireStoreResultPersistLease,
} from '@/modules/store/application/store-task-leases'
import { reconcileStaleStoreClaims } from '@/modules/store/application/reconcile-stale-store-claims'

describe('Store fenced database leases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('allows only one of two concurrent dispatch takeovers for the same version', async () => {
    const now = new Date('2026-08-05T08:00:00.000Z')
    let version = 7
    ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue({
      metadata: { dispatchLeaseUntil: '2026-08-05T07:00:00.000Z' },
      dispatchVersion: 7,
    })
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockImplementation(async ({ where, data }) => {
      if (where.dispatchVersion !== version) return { count: 0 }
      version += data.dispatchVersion.increment
      return { count: 1 }
    })

    const [first, second] = await Promise.all([
      acquireStoreDispatchTakeover({ taskId: 'task-1', now, owner: 'owner-a' }),
      acquireStoreDispatchTakeover({ taskId: 'task-1', now, owner: 'owner-b' }),
    ])

    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect([first, second].filter(Boolean)[0]).toMatchObject({ version: 8 })
    expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dispatchVersion: 7,
          OR: expect.arrayContaining([{ dispatchLeaseUntil: { lte: now } }]),
        }),
      }),
    )
  })

  it('allows only one result persister to acquire an expired version', async () => {
    const now = new Date('2026-08-05T08:00:00.000Z')
    let version = 2
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockImplementation(async ({ where, data }) => {
      if (where.resultPersistVersion !== version) return { count: 0 }
      version += data.resultPersistVersion.increment
      return { count: 1 }
    })

    const [first, second] = await Promise.all([
      acquireStoreResultPersistLease({
        taskId: 'task-2',
        expectedVersion: 2,
        now,
        owner: 'persist-a',
      }),
      acquireStoreResultPersistLease({
        taskId: 'task-2',
        expectedVersion: 2,
        now,
        owner: 'persist-b',
      }),
    ])

    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect([first, second].filter(Boolean)[0]).toMatchObject({ version: 3 })
  })

  it('fences the reconciler with owner, version, and expiry in the update', async () => {
    const now = new Date('2026-08-05T08:00:00.000Z')
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'task-3',
        metadata: {},
        createdAt: new Date('2026-08-05T07:00:00.000Z'),
        dispatchLeaseOwner: 'owner-new',
        dispatchVersion: 4,
      },
    ])
    // Simulates a renewal between SELECT and UPDATE: the fenced UPDATE loses.
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

    const result = await reconcileStaleStoreClaims({ now, limit: 10 })

    expect(result.markedFailed).toBe(0)
    expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dispatchLeaseOwner: 'owner-new',
          dispatchVersion: 4,
          OR: expect.arrayContaining([{ dispatchLeaseUntil: { lte: now } }]),
        }),
      }),
    )
  })
})

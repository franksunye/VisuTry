import { randomUUID } from 'node:crypto'
import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  buildDispatchLeaseFields,
  buildResultPersistLeaseFields,
  type DispatchFence,
} from './store-dispatch-lease'

/** Atomically take over an expired Store placeholder. */
export async function acquireStoreDispatchTakeover(input: {
  taskId: string
  now?: Date
  owner?: string
}): Promise<DispatchFence | null> {
  const now = input.now ?? new Date()
  const owner = input.owner ?? randomUUID()
  const lease = buildDispatchLeaseFields(now)
  const existing = await prisma.tryOnTask.findUnique({
    where: { id: input.taskId },
    select: { metadata: true, dispatchVersion: true },
  })
  if (!existing) return null

  const metadata = (existing.metadata ?? {}) as Record<string, unknown>
  const updated = await prisma.tryOnTask.updateMany({
    where: {
      id: input.taskId,
      status: TaskStatus.PENDING,
      userImageUrl: { startsWith: 'pending:' },
      dispatchVersion: existing.dispatchVersion,
      OR: [{ dispatchLeaseUntil: null }, { dispatchLeaseUntil: { lte: now } }],
    },
    data: {
      metadata: {
        ...metadata,
        ...lease,
        dispatchTakeoverAt: lease.dispatchClaimedAt,
      },
      dispatchLeaseOwner: owner,
      dispatchLeaseUntil: new Date(lease.dispatchLeaseUntil),
      dispatchVersion: { increment: 1 },
    },
  })

  return updated.count === 1
    ? { owner, version: existing.dispatchVersion + 1 }
    : null
}

/** Atomically acquire an expired/empty result-persistence lease. */
export async function acquireStoreResultPersistLease(input: {
  taskId: string
  expectedVersion: number
  now?: Date
  owner?: string
}): Promise<DispatchFence | null> {
  const now = input.now ?? new Date()
  const owner = input.owner ?? randomUUID()
  const lease = buildResultPersistLeaseFields(now)
  const updated = await prisma.tryOnTask.updateMany({
    where: {
      id: input.taskId,
      status: { not: TaskStatus.COMPLETED },
      resultPersistVersion: input.expectedVersion,
      OR: [
        { resultPersistLeaseUntil: null },
        { resultPersistLeaseUntil: { lte: now } },
      ],
    },
    data: {
      resultPersistLeaseOwner: owner,
      resultPersistLeaseUntil: new Date(lease.resultPersistLeaseUntil),
      resultPersistVersion: { increment: 1 },
    },
  })

  return updated.count === 1
    ? { owner, version: input.expectedVersion + 1 }
    : null
}

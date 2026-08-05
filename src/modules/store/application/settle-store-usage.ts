/**
 * Exactly-once Store usage settlement — never touches consumer User counters.
 */

import { Prisma, TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { UsagePolicy } from '../domain/usage-policy'
import type { StoreUsageRepository } from '../application/ports/repositories'

export type StoreUsageSettlementResult = {
  settled: boolean
  alreadySettled: boolean
  source: 'store_demo' | 'merchant_allowance' | null
}

export async function settleStoreTryOnUsage(input: {
  taskId: string
  merchantId: string
  merchantSessionId: string
  usagePolicy: UsagePolicy
  usage: StoreUsageRepository
}): Promise<StoreUsageSettlementResult> {
  const quotaSource =
    input.usagePolicy.kind === 'merchant_allowance' ? 'merchant_allowance' : 'store_demo'

  const claim = await prisma.tryOnTask.updateMany({
    where: {
      id: input.taskId,
      merchantId: input.merchantId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: TaskStatus.COMPLETED,
      quotaSettledAt: null,
    },
    data: {
      quotaSettledAt: new Date(),
      quotaSource,
    },
  })

  if (claim.count === 0) {
    const task = await prisma.tryOnTask.findFirst({
      where: { id: input.taskId, merchantId: input.merchantId },
      select: { quotaSettledAt: true, quotaSource: true, status: true },
    })
    if (task?.quotaSettledAt) {
      return {
        settled: false,
        alreadySettled: true,
        source: (task.quotaSource as StoreUsageSettlementResult['source']) ?? null,
      }
    }
    return { settled: false, alreadySettled: false, source: null }
  }

  await input.usage.record({
    merchantId: input.merchantId,
    merchantSessionId: input.merchantSessionId,
    tryOnTaskId: input.taskId,
    kind: 'RENDER_SUCCESS',
  })

  return { settled: true, alreadySettled: false, source: quotaSource }
}

export async function recordStoreTryOnAttempt(input: {
  usage: StoreUsageRepository
  merchantId: string
  merchantSessionId: string
  tryOnTaskId?: string | null
  kind: 'RENDER_ATTEMPT' | 'RENDER_FAILURE'
}): Promise<void> {
  await input.usage.record({
    merchantId: input.merchantId,
    merchantSessionId: input.merchantSessionId,
    tryOnTaskId: input.tryOnTaskId ?? null,
    kind: input.kind,
  })
}

/** Narrow type guard used by cron to detect Store tasks. */
export function isStoreOrigin(origin: string): boolean {
  return origin === 'STORE_DEMO' || origin === 'STORE_PILOT'
}

export type { Prisma }

/**
 * Exactly-once Store usage settlement — never touches consumer User counters.
 * Claim + RENDER_SUCCESS ledger must commit in the same transaction.
 */

import { Prisma, TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { UsagePolicy } from '../domain/usage-policy'
import type { StoreUsageRepository } from './ports/repositories'

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

  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const claim = await tx.tryOnTask.updateMany({
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
            const task = await tx.tryOnTask.findFirst({
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

          try {
            await tx.merchantUsageLedger.create({
              data: {
                merchantId: input.merchantId,
                merchantSessionId: input.merchantSessionId,
                tryOnTaskId: input.taskId,
                kind: 'RENDER_SUCCESS',
              },
            })
          } catch (error) {
            const code = (error as { code?: string }).code
            if (code === 'P2002') {
              return {
                settled: false,
                alreadySettled: true,
                source: quotaSource,
              }
            }
            throw error
          }

          return { settled: true, alreadySettled: false, source: quotaSource }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      const isWriteConflict = (error as { code?: string })?.code === 'P2034'
      if (!isWriteConflict || attempt === maxAttempts) throw error
    }
  }

  throw new Error('Store usage settlement retry limit exceeded')
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

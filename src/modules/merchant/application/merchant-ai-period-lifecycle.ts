import { Prisma, TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * M1b Merchant v2 lifecycle. The billing-period reservation is not the
 * historical rolling 24-hour MerchantSponsoredUsage first-value reservation.
 *
 * Called by Store RENDER_SUCCESS settlement inside the SAME transaction as
 * the once-only success ledger entry. A task's reservation remains pinned to
 * its original billing period even after renewal.
 */
export async function settleMerchantAiRenderInTransaction(
  tx: Prisma.TransactionClient,
  input: { taskId: string; merchantId: string; merchantSessionId: string },
): Promise<'NO_HOLD' | 'SETTLED' | 'ALREADY_SETTLED'> {
  const row = await tx.merchantAiRenderReservation.findUnique({
    where: { tryOnTaskId: input.taskId },
    select: { id: true, merchantId: true, merchantSessionId: true, status: true },
  })
  if (!row) return 'NO_HOLD'
  if (row.merchantId !== input.merchantId || row.merchantSessionId !== input.merchantSessionId) {
    throw new Error('Merchant AI settlement tenant mismatch')
  }
  if (row.status === 'SETTLED') return 'ALREADY_SETTLED'
  if (row.status !== 'RESERVED') {
    throw new Error('Merchant AI released reservation cannot settle as a success')
  }

  const updated = await tx.merchantAiRenderReservation.updateMany({
    where: {
      id: row.id,
      merchantId: input.merchantId,
      merchantSessionId: input.merchantSessionId,
      tryOnTaskId: input.taskId,
      status: 'RESERVED',
    },
    data: { status: 'SETTLED', settledAt: new Date() },
  })
  if (updated.count !== 1) throw new Error('Merchant AI settlement write conflict')
  return 'SETTLED'
}

export type MerchantAiFailedReleaseResult =
  | 'NO_HOLD'
  | 'RELEASED'
  | 'ALREADY_RELEASED'
  | 'HELD_AMBIGUOUS'
  | 'HELD_NOT_TERMINAL'
  | 'HELD_SETTLED'

/**
 * Release only on *durably proven* no-usable-result failure.
 * - Prior-to-dispatch placeholder failure and explicit Kie NOT_SENT are safe.
 * - Known accepted provider task that conclusively failed is safe.
 * - UNKNOWN acceptance, Grsai ambiguous submission or mere timeout must
 *   retain the hold until recovery; NEVER free it for a second dispatch.
 *
 * There is deliberately no time-based sweep that silently releases UNKNOWN.
 */
export async function releaseMerchantAiRenderForTerminalFailure(input: {
  taskId: string
  merchantId: string
  merchantSessionId: string
  /** Internal-only database override for disposable PostgreSQL contract execution. */
  db?: typeof prisma
}): Promise<MerchantAiFailedReleaseResult> {
  return (input.db ?? prisma).$transaction(async (tx) => {
    const task = await tx.tryOnTask.findFirst({
      where: { id: input.taskId, merchantId: input.merchantId, merchantSessionId: input.merchantSessionId },
      select: {
        id: true, status: true, userImageUrl: true,
        resultImageUrl: true, quotaSettledAt: true, metadata: true,
      },
    })
    if (!task) throw new Error('Merchant AI terminal task tenant mismatch')

    const row = await tx.merchantAiRenderReservation.findUnique({
      where: { tryOnTaskId: input.taskId },
      select: { id: true, merchantId: true, merchantSessionId: true, status: true },
    })
    if (!row) return 'NO_HOLD'
    if (row.merchantId !== input.merchantId || row.merchantSessionId !== input.merchantSessionId) {
      throw new Error('Merchant AI release tenant mismatch')
    }
    if (row.status === 'SETTLED') return 'HELD_SETTLED'
    if (row.status === 'RELEASED') return 'ALREADY_RELEASED'
    if (task.status !== TaskStatus.FAILED || task.quotaSettledAt || task.resultImageUrl) {
      return 'HELD_NOT_TERMINAL'
    }

    const meta = (task.metadata ?? {}) as Record<string, unknown>
    const outcome = meta.dispatchOutcome
    const providerTaskId = typeof meta.externalTaskId === 'string' && Boolean(meta.externalTaskId)
    const neverDispatched =
      task.userImageUrl.startsWith('pending:') || outcome === 'NOT_SENT'
    const definitiveProviderFailure = outcome === 'ACCEPTED' && providerTaskId

    if (!neverDispatched && !definitiveProviderFailure) {
      // In particular, no timeout or failed Grsai HTTP response is proof
      // that a generation was not charged or will never complete.
      return 'HELD_AMBIGUOUS'
    }

    const changed = await tx.merchantAiRenderReservation.updateMany({
      where: {
        id: row.id, merchantId: input.merchantId,
        merchantSessionId: input.merchantSessionId,
        tryOnTaskId: input.taskId, status: 'RESERVED',
      },
      data: { status: 'RELEASED', releasedAt: new Date() },
    })
    if (changed.count !== 1) throw new Error('Merchant AI release write conflict')
    return 'RELEASED'
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

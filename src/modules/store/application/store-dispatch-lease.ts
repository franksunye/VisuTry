/**
 * Store claim / dispatch lease helpers (pure; no Prisma).
 * Prevents permanent PENDING placeholders after claim-then-crash.
 */

export const STORE_DISPATCH_LEASE_MS = 2 * 60 * 1000
export const STORE_RESULT_PERSIST_LEASE_MS = 60 * 1000

export type DispatchLeaseFields = {
  dispatchClaimedAt: string
  dispatchLeaseUntil: string
  claimFirst: true
  atomicClaim: true
  source: 'store'
}

export function buildDispatchLeaseFields(now = new Date()): DispatchLeaseFields {
  return {
    dispatchClaimedAt: now.toISOString(),
    dispatchLeaseUntil: new Date(now.getTime() + STORE_DISPATCH_LEASE_MS).toISOString(),
    claimFirst: true,
    atomicClaim: true,
    source: 'store',
  }
}

export function isPendingPlaceholderUrls(task: {
  userImageUrl: string
  itemImageUrl?: string | null
}): boolean {
  return task.userImageUrl.startsWith('pending:')
}

export function readDispatchLeaseUntil(
  metadata: Record<string, unknown> | null | undefined,
): Date | null {
  const raw = metadata?.dispatchLeaseUntil
  if (typeof raw !== 'string') return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isDispatchLeaseExpired(
  metadata: Record<string, unknown> | null | undefined,
  now = new Date(),
): boolean {
  const until = readDispatchLeaseUntil(metadata)
  if (!until) return true
  return until.getTime() <= now.getTime()
}

/**
 * Same idempotency key hit an existing task — decide whether to take over dispatch.
 */
export function resolvePlaceholderReuseAction(input: {
  status: string
  userImageUrl: string
  metadata: Record<string, unknown> | null | undefined
  now?: Date
}): 'return_existing' | 'wait_inflight' | 'takeover' {
  const now = input.now ?? new Date()
  const hasExternal =
    typeof input.metadata?.externalTaskId === 'string' &&
    input.metadata.externalTaskId.length > 0

  if (!isPendingPlaceholderUrls({ userImageUrl: input.userImageUrl })) {
    return 'return_existing'
  }
  if (hasExternal) {
    return 'return_existing'
  }
  if (input.status === 'FAILED' || input.status === 'COMPLETED') {
    return 'return_existing'
  }
  if (input.status === 'PROCESSING') {
    return 'return_existing'
  }
  // PENDING + pending://
  if (!isDispatchLeaseExpired(input.metadata, now)) {
    return 'wait_inflight'
  }
  return 'takeover'
}

export function isBlobConflictError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    name === 'BlobPreconditionFailedError' ||
    message.includes('already exists') ||
    message.includes('already-exists') ||
    message.includes('cannot overwrite') ||
    message.includes('precondition') ||
    message.includes('409')
  )
}

export function readResultPersistLeaseUntil(
  metadata: Record<string, unknown> | null | undefined,
): Date | null {
  const raw = metadata?.resultPersistLeaseUntil
  if (typeof raw !== 'string') return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isResultPersistLeaseActive(
  metadata: Record<string, unknown> | null | undefined,
  now = new Date(),
): boolean {
  const until = readResultPersistLeaseUntil(metadata)
  if (!until) return false
  return until.getTime() > now.getTime()
}

export function buildResultPersistLeaseFields(now = new Date()) {
  return {
    resultPersistClaimedAt: now.toISOString(),
    resultPersistLeaseUntil: new Date(
      now.getTime() + STORE_RESULT_PERSIST_LEASE_MS,
    ).toISOString(),
  }
}

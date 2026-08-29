/**
 * Client Try-On poll policy.
 *
 * Every in-flight shopper task must reach a terminal UI state:
 * completed | failed | timed_out | status_unknown | session_restart | unavailable.
 * Server terminal status always wins. The 120s client deadline is a hard wall-clock
 * cap, not a sum of backoff delays.
 */

export const STORE_TRYON_POLL_MAX_DURATION_MS = 120_000
export const STORE_TRYON_POLL_INTERVALS_MS = [0, 7_000, 14_000, 25_000, 40_000, 60_000] as const
export const STORE_TRYON_POLL_MAX_NETWORK_FAILURES = 3
export const STORE_TRYON_POLL_MAX_SERVER_ERRORS = 4
/** Scheduler slack allowed in tests when asserting the hard deadline. */
export const STORE_TRYON_POLL_SCHEDULER_TOLERANCE_MS = 50

export type StoreTryOnPollFailReason =
  | 'not_found'
  | 'server_error'
  | 'network'
  | 'timed_out'
  | 'forbidden'
  | 'session_restart'
  | 'unavailable'

export type StoreTryOnEntitlementCode = 'AUTH_REQUIRED' | 'CONSUMER_CREDITS_REQUIRED'

export type StoreTryOnPollDecision =
  | { action: 'apply' }
  | { action: 'retry'; delayMs: number }
  | { action: 'fail'; reason: StoreTryOnPollFailReason }
  | { action: 'entitlement'; code: StoreTryOnEntitlementCode }

export function nextPollDelayMs(attemptIndex: number): number {
  const last = STORE_TRYON_POLL_INTERVALS_MS[STORE_TRYON_POLL_INTERVALS_MS.length - 1]
  return STORE_TRYON_POLL_INTERVALS_MS[attemptIndex] ?? last
}

export function remainingPollTimeMs(
  startedAtMs: number,
  nowMs: number,
  maxDurationMs = STORE_TRYON_POLL_MAX_DURATION_MS,
): number {
  return Math.max(0, maxDurationMs - (nowMs - startedAtMs))
}

/**
 * Cap a scheduled delay so it cannot land after the hard deadline.
 * Returns 0 remaining when the deadline is already due (caller must time out,
 * not poll).
 */
export function capPollDelayByDeadline(delayMs: number, remainingMs: number): number {
  if (remainingMs <= 0) return 0
  return Math.min(Math.max(0, delayMs), remainingMs)
}

export function parseStorePollErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const code = (body as { code?: unknown }).code
  if (typeof code !== 'string') return null
  const trimmed = code.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function parseRetryAfterMs(header: string | null | undefined): number | null {
  if (!header) return null
  const trimmed = header.trim()
  const seconds = Number.parseInt(trimmed, 10)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.max(seconds, 1) * 1000, 60_000)
  }
  const dateMs = Date.parse(trimmed)
  if (Number.isFinite(dateMs)) {
    return Math.min(Math.max(dateMs - Date.now(), 1_000), 60_000)
  }
  return null
}

function classifyStoreCode(code: string | null | undefined): StoreTryOnPollDecision | null {
  if (!code) return null
  if (code === 'AUTH_REQUIRED' || code === 'SPONSORED_ALLOWANCE_EXHAUSTED') {
    return { action: 'entitlement', code: 'AUTH_REQUIRED' }
  }
  if (code === 'CONSUMER_CREDITS_REQUIRED') {
    return { action: 'entitlement', code: 'CONSUMER_CREDITS_REQUIRED' }
  }
  if (code === 'SESSION_EXPIRED' || code === 'SESSION_UNAUTHORIZED' || code === 'SESSION_NOT_FOUND') {
    return { action: 'fail', reason: 'session_restart' }
  }
  if (code === 'MERCHANT_INACTIVE' || code === 'CAPABILITY_DISABLED') {
    return { action: 'fail', reason: 'unavailable' }
  }
  return null
}

export function decidePollHttpStatus(input: {
  status: number
  code?: string | null
  success?: boolean
  retryAfterHeader?: string | null
  serverErrorCount: number
  elapsedMs: number
  maxDurationMs?: number
}): StoreTryOnPollDecision {
  const maxDurationMs = input.maxDurationMs ?? STORE_TRYON_POLL_MAX_DURATION_MS
  if (input.elapsedMs >= maxDurationMs) {
    return { action: 'fail', reason: 'timed_out' }
  }

  const fromCode = classifyStoreCode(input.code ?? null)
  if (fromCode) return fromCode

  if (input.status === 404) {
    return { action: 'fail', reason: 'not_found' }
  }
  if (input.status === 429) {
    return {
      action: 'retry',
      delayMs: parseRetryAfterMs(input.retryAfterHeader) ?? 15_000,
    }
  }
  if (input.status >= 500) {
    if (input.serverErrorCount + 1 >= STORE_TRYON_POLL_MAX_SERVER_ERRORS) {
      return { action: 'fail', reason: 'server_error' }
    }
    return {
      action: 'retry',
      delayMs: Math.min(15_000 * (input.serverErrorCount + 1), 60_000),
    }
  }

  // HTTP status is not entitlement by itself. 401/403 without a Store code
  // are session/unavailable failures, not sign-in/credits continuation.
  if (input.status === 401) {
    return { action: 'fail', reason: 'session_restart' }
  }
  if (input.status === 403) {
    return { action: 'fail', reason: 'unavailable' }
  }
  if (input.status === 402) {
    return { action: 'entitlement', code: 'CONSUMER_CREDITS_REQUIRED' }
  }

  if (input.status >= 200 && input.status < 300) {
    if (input.success === false) {
      if (input.serverErrorCount + 1 >= STORE_TRYON_POLL_MAX_SERVER_ERRORS) {
        return { action: 'fail', reason: 'server_error' }
      }
      return {
        action: 'retry',
        delayMs: Math.min(15_000 * (input.serverErrorCount + 1), 60_000),
      }
    }
    return { action: 'apply' }
  }
  return { action: 'fail', reason: 'server_error' }
}

export function decidePollNetworkFailure(input: {
  networkFailureCount: number
  elapsedMs: number
  maxDurationMs?: number
}): Extract<StoreTryOnPollDecision, { action: 'retry' | 'fail' }> {
  const maxDurationMs = input.maxDurationMs ?? STORE_TRYON_POLL_MAX_DURATION_MS
  if (input.elapsedMs >= maxDurationMs) {
    return { action: 'fail', reason: 'timed_out' }
  }
  if (input.networkFailureCount >= STORE_TRYON_POLL_MAX_NETWORK_FAILURES) {
    return { action: 'fail', reason: 'network' }
  }
  return {
    action: 'retry',
    delayMs: Math.min(7_000 * input.networkFailureCount, 60_000),
  }
}

/** Unknown client-side outcomes must resume the same taskId, never submit again. */
export function isUnknownPollFailure(reason: StoreTryOnPollFailReason): boolean {
  return reason === 'timed_out' || reason === 'network' || reason === 'server_error'
}

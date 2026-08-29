/**
 * Client Try-On poll policy.
 *
 * Every in-flight shopper task must reach a terminal UI state:
 * completed | failed | timed_out. Server terminal status always wins.
 */

export const STORE_TRYON_POLL_MAX_DURATION_MS = 120_000
export const STORE_TRYON_POLL_INTERVALS_MS = [0, 7_000, 14_000, 25_000, 40_000, 60_000] as const
export const STORE_TRYON_POLL_MAX_NETWORK_FAILURES = 3
export const STORE_TRYON_POLL_MAX_SERVER_ERRORS = 4

export type StoreTryOnPollFailReason =
  | 'not_found'
  | 'server_error'
  | 'network'
  | 'timed_out'
  | 'forbidden'

export type StoreTryOnPollDecision =
  | { action: 'apply' }
  | { action: 'retry'; delayMs: number }
  | { action: 'fail'; reason: StoreTryOnPollFailReason }
  | { action: 'entitlement' }

export function nextPollDelayMs(attemptIndex: number): number {
  const last = STORE_TRYON_POLL_INTERVALS_MS[STORE_TRYON_POLL_INTERVALS_MS.length - 1]
  return STORE_TRYON_POLL_INTERVALS_MS[attemptIndex] ?? last
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

export function decidePollHttpStatus(input: {
  status: number
  retryAfterHeader?: string | null
  serverErrorCount: number
  elapsedMs: number
  maxDurationMs?: number
}): StoreTryOnPollDecision {
  const maxDurationMs = input.maxDurationMs ?? STORE_TRYON_POLL_MAX_DURATION_MS
  if (input.elapsedMs >= maxDurationMs) {
    return { action: 'fail', reason: 'timed_out' }
  }

  if (input.status === 401 || input.status === 403) {
    return { action: 'entitlement' }
  }
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
  if (input.status >= 200 && input.status < 300) {
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

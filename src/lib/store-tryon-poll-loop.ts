/**
 * Store Try-On poll runner with a true wall-clock deadline.
 *
 * Backoff delays are successive and must be capped by remaining time. An
 * independent deadline timer fires at maxDurationMs so the UI does not wait
 * for the next poll to notice timeout.
 */

import {
  capPollDelayByDeadline,
  decidePollHttpStatus,
  decidePollNetworkFailure,
  nextPollDelayMs,
  parseStorePollErrorCode,
  remainingPollTimeMs,
  STORE_TRYON_POLL_MAX_DURATION_MS,
  type StoreTryOnEntitlementCode,
  type StoreTryOnPollFailReason,
} from '@/lib/store-tryon-poll-policy'

export type StoreTryOnPollHttpResult = {
  httpStatus: number
  retryAfterHeader: string | null
  body: unknown
}

export type StoreTryOnPollCompletedData = {
  status: string
  resultImageUrl?: string | null
  errorMessage?: string | null
  frame?: Record<string, unknown> | null
}

export type StoreTryOnPollTerminal =
  | { kind: 'completed'; data: StoreTryOnPollCompletedData }
  | { kind: 'confirmed_failed'; data: StoreTryOnPollCompletedData }
  | { kind: 'failed'; reason: StoreTryOnPollFailReason }
  | { kind: 'timed_out' }
  | { kind: 'entitlement'; code: StoreTryOnEntitlementCode }

export type StoreTryOnPollLoopOptions = {
  poll: (signal: AbortSignal) => Promise<StoreTryOnPollHttpResult>
  maxDurationMs?: number
  onTerminal: (result: StoreTryOnPollTerminal) => void
  onPollAttempt?: () => void
}

export function startStoreTryOnPollLoop(options: StoreTryOnPollLoopOptions): { stop: () => void } {
  const maxDurationMs = options.maxDurationMs ?? STORE_TRYON_POLL_MAX_DURATION_MS
  const startedAt = Date.now()
  let stopped = false
  let settled = false
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined
  let activeController: AbortController | undefined
  let attempt = 0
  let networkFailures = 0
  let serverErrors = 0

  const clearPollTimer = () => {
    if (pollTimer !== undefined) {
      clearTimeout(pollTimer)
      pollTimer = undefined
    }
  }

  const settle = (result: StoreTryOnPollTerminal) => {
    if (settled) return
    settled = true
    stopped = true
    clearPollTimer()
    if (deadlineTimer !== undefined) {
      clearTimeout(deadlineTimer)
      deadlineTimer = undefined
    }
    activeController?.abort()
    activeController = undefined
    options.onTerminal(result)
  }

  const timeOut = () => {
    settle({ kind: 'timed_out' })
  }

  const stop = () => {
    stopped = true
    clearPollTimer()
    if (deadlineTimer !== undefined) {
      clearTimeout(deadlineTimer)
      deadlineTimer = undefined
    }
    activeController?.abort()
    activeController = undefined
  }

  const schedule = (delayMs: number) => {
    if (stopped) return
    const remainingMs = remainingPollTimeMs(startedAt, Date.now(), maxDurationMs)
    if (remainingMs <= 0) {
      timeOut()
      return
    }
    const waitMs = capPollDelayByDeadline(delayMs, remainingMs)
    if (waitMs <= 0) {
      void run()
      return
    }
    pollTimer = setTimeout(() => {
      void run()
    }, waitMs)
  }

  const run = async () => {
    if (stopped) return
    const elapsedMs = Date.now() - startedAt
    if (elapsedMs >= maxDurationMs) {
      timeOut()
      return
    }

    options.onPollAttempt?.()
    activeController = new AbortController()
    try {
      const result = await options.poll(activeController.signal)
      if (stopped) return

      const code = parseStorePollErrorCode(result.body)
      const success =
        result.body && typeof result.body === 'object' && 'success' in result.body
          ? Boolean((result.body as { success?: unknown }).success)
          : undefined

      const decision = decidePollHttpStatus({
        status: result.httpStatus,
        code,
        success,
        retryAfterHeader: result.retryAfterHeader,
        serverErrorCount: serverErrors,
        elapsedMs: Date.now() - startedAt,
        maxDurationMs,
      })

      if (decision.action === 'entitlement') {
        settle({ kind: 'entitlement', code: decision.code })
        return
      }

      if (decision.action === 'fail') {
        if (decision.reason === 'timed_out') {
          timeOut()
          return
        }
        settle({ kind: 'failed', reason: decision.reason })
        return
      }

      if (decision.action === 'retry') {
        if (result.httpStatus >= 500 || success === false) serverErrors += 1
        attempt += 1
        schedule(decision.delayMs)
        return
      }

      const body = result.body as {
        success?: boolean
        data?: StoreTryOnPollCompletedData
      } | null
      const data = body?.data
      const status = String(data?.status || '').toLowerCase()
      if (status === 'completed') {
        settle({
          kind: 'completed',
          data: data || { status: 'completed' },
        })
        return
      }
      if (status === 'failed') {
        settle({
          kind: 'confirmed_failed',
          data: data || { status: 'failed' },
        })
        return
      }

      attempt += 1
      schedule(nextPollDelayMs(attempt))
    } catch {
      if (stopped) return
      networkFailures += 1
      const decision = decidePollNetworkFailure({
        networkFailureCount: networkFailures,
        elapsedMs: Date.now() - startedAt,
        maxDurationMs,
      })
      if (decision.action === 'fail') {
        if (decision.reason === 'timed_out') {
          timeOut()
          return
        }
        settle({ kind: 'failed', reason: decision.reason })
        return
      }
      attempt += 1
      schedule(decision.delayMs)
    } finally {
      activeController = undefined
    }
  }

  deadlineTimer = setTimeout(timeOut, maxDurationMs)
  schedule(nextPollDelayMs(0))

  return { stop }
}

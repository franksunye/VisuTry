import { useEffect, useRef } from 'react'

interface TryOnPollTask {
  status: string
  resultImageUrl?: string
  error?: string
  errorMessage?: string
  progress?: number
}
interface TryOnPollResponse {
  success?: boolean
  data?: TryOnPollTask
}

interface UseTryOnTaskPollingOptions {
  taskId: string | null
  enabled: boolean
  onCompleted: (task: TryOnPollTask) => void
  onFailed: (task: TryOnPollTask) => void
  onProgress?: (task: TryOnPollTask) => void
  onTimeout: () => void
  onError?: (error: unknown) => void
  pollIntervalMs?: number
  timeoutMs?: number
  fetcher?: typeof fetch
}

const DEFAULT_POLL_INTERVAL_MS = 3_000
const DEFAULT_TIMEOUT_MS = 5 * 60_000

/**
 * Poll one Try-On task with a single in-flight request and a wall-clock deadline.
 * The next delay starts only after the previous request settles.
 */
export function useTryOnTaskPolling({
  taskId,
  enabled,
  onCompleted,
  onFailed,
  onProgress,
  onTimeout,
  onError,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetcher = globalThis.fetch,
}: UseTryOnTaskPollingOptions) {
  const callbacksRef = useRef({ onCompleted, onFailed, onProgress, onTimeout, onError })
  callbacksRef.current = { onCompleted, onFailed, onProgress, onTimeout, onError }

  useEffect(() => {
    if (!taskId || !enabled) return

    let stopped = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined
    let activeController: AbortController | undefined
    const deadline = Date.now() + timeoutMs

    const clearTimers = () => {
      if (pollTimer) clearTimeout(pollTimer)
      if (deadlineTimer) clearTimeout(deadlineTimer)
    }

    const stop = () => {
      stopped = true
      clearTimers()
      activeController?.abort()
    }

    const timeOut = () => {
      if (stopped) return
      stop()
      callbacksRef.current.onTimeout()
    }

    const scheduleNext = (poll: () => Promise<void>) => {
      if (stopped) return
      const remainingMs = deadline - Date.now()
      if (remainingMs <= 0) {
        timeOut()
        return
      }
      pollTimer = setTimeout(() => void poll(), Math.min(pollIntervalMs, remainingMs))
    }

    const poll = async () => {
      if (stopped) return

      activeController = new AbortController()
      try {
        const response = await fetcher('/api/try-on/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId }),
          signal: activeController.signal,
        })
        const payload = (await response.json()) as TryOnPollResponse

        if (stopped || !payload.success || !payload.data) return

        const task = payload.data
        if (task.status === 'COMPLETED' && task.resultImageUrl) {
          stop()
          callbacksRef.current.onCompleted(task)
          return
        }
        if (task.status === 'FAILED') {
          stop()
          callbacksRef.current.onFailed(task)
          return
        }
        if (task.status === 'PROCESSING' || task.status === 'PENDING') {
          callbacksRef.current.onProgress?.(task)
        }
      } catch (error) {
        if (!stopped) callbacksRef.current.onError?.(error)
      } finally {
        activeController = undefined
        if (!stopped) scheduleNext(poll)
      }
    }

    deadlineTimer = setTimeout(timeOut, timeoutMs)
    scheduleNext(poll)

    return stop
  }, [enabled, fetcher, pollIntervalMs, taskId, timeoutMs])
}

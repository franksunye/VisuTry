import { act, renderHook } from '@testing-library/react'
import { useTryOnTaskPolling } from '@/hooks/useTryOnTaskPolling'

function jsonResponse(payload: unknown): Response {
  return { json: jest.fn().mockResolvedValue(payload) } as unknown as Response
}

describe('useTryOnTaskPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('never starts a second request while the previous poll is in flight', async () => {
    let resolveFirst!: (response: Response) => void
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })
    const fetcher = jest.fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValue(jsonResponse({ success: true, data: { status: 'PROCESSING' } }))

    renderHook(() => useTryOnTaskPolling({
      taskId: 'task-1',
      enabled: true,
      fetcher: fetcher as typeof fetch,
      onCompleted: jest.fn(),
      onFailed: jest.fn(),
      onTimeout: jest.fn(),
    }))

    await act(async () => {
      jest.advanceTimersByTime(15_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFirst(jsonResponse({ success: true, data: { status: 'PROCESSING' } }))
      await Promise.resolve()
    })
    await act(async () => {
      jest.advanceTimersByTime(2_999)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('stops immediately after a completed task', async () => {
    const onCompleted = jest.fn()
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({
      success: true,
      data: { status: 'COMPLETED', resultImageUrl: 'https://example.com/result.png' },
    }))

    renderHook(() => useTryOnTaskPolling({
      taskId: 'task-1',
      enabled: true,
      fetcher: fetcher as typeof fetch,
      onCompleted,
      onFailed: jest.fn(),
      onTimeout: jest.fn(),
    }))

    await act(async () => {
      jest.advanceTimersByTime(3_000)
      await Promise.resolve()
    })
    expect(onCompleted).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(30_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('uses a wall-clock deadline and aborts a slow active request', async () => {
    const onTimeout = jest.fn()
    let capturedSignal: AbortSignal | undefined
    const fetcher = jest.fn((_url: string | URL | Request, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal
      return new Promise<Response>(() => undefined)
    })

    renderHook(() => useTryOnTaskPolling({
      taskId: 'task-1',
      enabled: true,
      fetcher: fetcher as typeof fetch,
      pollIntervalMs: 1_000,
      timeoutMs: 5_000,
      onCompleted: jest.fn(),
      onFailed: jest.fn(),
      onTimeout,
    }))

    await act(async () => {
      jest.advanceTimersByTime(1_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(4_000)
    })
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(capturedSignal?.aborted).toBe(true)
  })
})

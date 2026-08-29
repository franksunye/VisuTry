import { startStoreTryOnPollLoop } from '@/lib/store-tryon-poll-loop'
import {
  STORE_TRYON_POLL_MAX_DURATION_MS,
  STORE_TRYON_POLL_SCHEDULER_TOLERANCE_MS,
} from '@/lib/store-tryon-poll-policy'

function processingResult() {
  return {
    httpStatus: 200,
    retryAfterHeader: null,
    body: { success: true, data: { status: 'processing' } },
  }
}

function completedResult() {
  return {
    httpStatus: 200,
    retryAfterHeader: null,
    body: {
      success: true,
      data: { status: 'completed', resultImageUrl: 'https://cdn.example/result.webp' },
    },
  }
}

describe('Store Try-On poll loop hard deadline', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reaches a terminal timed_out state within max duration plus scheduler tolerance', async () => {
    const startedAt = Date.now()
    const poll = jest.fn().mockResolvedValue(processingResult())
    const onTerminal = jest.fn()
    const onPollAttempt = jest.fn()

    startStoreTryOnPollLoop({
      poll,
      onTerminal,
      onPollAttempt,
      maxDurationMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })

    await jest.advanceTimersByTimeAsync(STORE_TRYON_POLL_MAX_DURATION_MS)
    expect(onTerminal).toHaveBeenCalledWith({ kind: 'timed_out' })
    expect(Date.now() - startedAt).toBeLessThanOrEqual(
      STORE_TRYON_POLL_MAX_DURATION_MS + STORE_TRYON_POLL_SCHEDULER_TOLERANCE_MS,
    )
  })

  it('does not poll after the hard deadline fires', async () => {
    const poll = jest.fn().mockResolvedValue(processingResult())
    const onTerminal = jest.fn()
    const onPollAttempt = jest.fn()

    startStoreTryOnPollLoop({
      poll,
      onTerminal,
      onPollAttempt,
      maxDurationMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })

    await jest.advanceTimersByTimeAsync(STORE_TRYON_POLL_MAX_DURATION_MS)
    expect(onTerminal).toHaveBeenCalledWith({ kind: 'timed_out' })
    const attemptsAtTimeout = onPollAttempt.mock.calls.length
    expect(attemptsAtTimeout).toBeGreaterThan(0)

    await jest.advanceTimersByTimeAsync(60_000)
    expect(onPollAttempt).toHaveBeenCalledTimes(attemptsAtTimeout)
    expect(poll).toHaveBeenCalledTimes(attemptsAtTimeout)
  })

  it('lets completion before the deadline win over timeout', async () => {
    const poll = jest.fn()
      .mockResolvedValueOnce(processingResult())
      .mockResolvedValueOnce(completedResult())
    const onTerminal = jest.fn()
    const onPollAttempt = jest.fn()

    startStoreTryOnPollLoop({
      poll,
      onTerminal,
      onPollAttempt,
      maxDurationMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })

    await jest.advanceTimersByTimeAsync(0)
    expect(onPollAttempt).toHaveBeenCalledTimes(1)
    expect(onTerminal).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(7_000)
    expect(onTerminal).toHaveBeenCalledWith({
      kind: 'completed',
      data: { status: 'completed', resultImageUrl: 'https://cdn.example/result.webp' },
    })

    const attempts = onPollAttempt.mock.calls.length
    await jest.advanceTimersByTimeAsync(STORE_TRYON_POLL_MAX_DURATION_MS)
    expect(onTerminal).toHaveBeenCalledTimes(1)
    expect(onPollAttempt).toHaveBeenCalledTimes(attempts)
  })

  it('times out even when the next backoff would have landed after 120s', async () => {
    const poll = jest.fn().mockResolvedValue(processingResult())
    const onTerminal = jest.fn()

    startStoreTryOnPollLoop({
      poll,
      onTerminal,
      maxDurationMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })

    // Successive delays 0+7+14+25+40 = 86s. The next 60s delay would land at 146s
    // without a hard deadline. The independent timer must fire at 120s.
    await jest.advanceTimersByTimeAsync(86_000)
    expect(onTerminal).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(34_000)
    expect(onTerminal).toHaveBeenCalledWith({ kind: 'timed_out' })
  })
})

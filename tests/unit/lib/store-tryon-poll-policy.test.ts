import {
  decidePollHttpStatus,
  decidePollNetworkFailure,
  nextPollDelayMs,
  parseRetryAfterMs,
  STORE_TRYON_POLL_MAX_DURATION_MS,
  STORE_TRYON_POLL_MAX_NETWORK_FAILURES,
  STORE_TRYON_POLL_MAX_SERVER_ERRORS,
} from '@/lib/store-tryon-poll-policy'

describe('Store Try-On poll policy', () => {
  it('uses a bounded backoff sequence instead of a permanent 7s interval', () => {
    expect(nextPollDelayMs(0)).toBe(0)
    expect(nextPollDelayMs(1)).toBe(7_000)
    expect(nextPollDelayMs(2)).toBe(14_000)
    expect(nextPollDelayMs(5)).toBe(60_000)
    expect(nextPollDelayMs(9)).toBe(60_000)
  })

  it('fails after the max polling duration', () => {
    expect(decidePollHttpStatus({
      status: 200,
      serverErrorCount: 0,
      elapsedMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })).toEqual({ action: 'fail', reason: 'timed_out' })
  })

  it('maps 401/403 to entitlement continuation and 404 to a terminal failure', () => {
    expect(decidePollHttpStatus({
      status: 401,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'entitlement' })
    expect(decidePollHttpStatus({
      status: 404,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'not_found' })
  })

  it('retries 429 with Retry-After and 5xx with a limited budget', () => {
    expect(decidePollHttpStatus({
      status: 429,
      retryAfterHeader: '12',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'retry', delayMs: 12_000 })

    expect(decidePollHttpStatus({
      status: 500,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    }).action).toBe('retry')

    expect(decidePollHttpStatus({
      status: 502,
      serverErrorCount: STORE_TRYON_POLL_MAX_SERVER_ERRORS - 1,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'server_error' })
  })

  it('fails after repeated network errors', () => {
    expect(decidePollNetworkFailure({
      networkFailureCount: STORE_TRYON_POLL_MAX_NETWORK_FAILURES,
      elapsedMs: 8_000,
    })).toEqual({ action: 'fail', reason: 'network' })
  })

  it('parses Retry-After seconds', () => {
    expect(parseRetryAfterMs('8')).toBe(8_000)
    expect(parseRetryAfterMs(null)).toBeNull()
  })
})

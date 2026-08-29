import {
  capPollDelayByDeadline,
  decidePollHttpStatus,
  decidePollNetworkFailure,
  isUnknownPollFailure,
  nextPollDelayMs,
  parseRetryAfterMs,
  parseStorePollErrorCode,
  remainingPollTimeMs,
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

  it('caps scheduled delays so they cannot land after the hard deadline', () => {
    expect(remainingPollTimeMs(0, 86_000)).toBe(34_000)
    expect(capPollDelayByDeadline(60_000, 34_000)).toBe(34_000)
    expect(capPollDelayByDeadline(7_000, 0)).toBe(0)
  })

  it('fails after the max polling duration', () => {
    expect(decidePollHttpStatus({
      status: 200,
      serverErrorCount: 0,
      elapsedMs: STORE_TRYON_POLL_MAX_DURATION_MS,
    })).toEqual({ action: 'fail', reason: 'timed_out' })
  })

  it('classifies poll errors by Store code, not HTTP 401/403 alone', () => {
    expect(decidePollHttpStatus({
      status: 401,
      code: 'AUTH_REQUIRED',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'entitlement', code: 'AUTH_REQUIRED' })

    expect(decidePollHttpStatus({
      status: 402,
      code: 'CONSUMER_CREDITS_REQUIRED',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'entitlement', code: 'CONSUMER_CREDITS_REQUIRED' })

    expect(decidePollHttpStatus({
      status: 401,
      code: 'SESSION_EXPIRED',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'session_restart' })

    expect(decidePollHttpStatus({
      status: 401,
      code: 'SESSION_UNAUTHORIZED',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'session_restart' })

    expect(decidePollHttpStatus({
      status: 403,
      code: 'MERCHANT_INACTIVE',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'unavailable' })

    expect(decidePollHttpStatus({
      status: 403,
      code: 'CAPABILITY_DISABLED',
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'unavailable' })

    expect(decidePollHttpStatus({
      status: 401,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'session_restart' })

    expect(decidePollHttpStatus({
      status: 403,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'unavailable' })

    expect(decidePollHttpStatus({
      status: 404,
      serverErrorCount: 0,
      elapsedMs: 1_000,
    })).toEqual({ action: 'fail', reason: 'not_found' })
  })

  it('parses machine-readable Store error codes from poll bodies', () => {
    expect(parseStorePollErrorCode({ success: false, code: 'SESSION_EXPIRED', error: 'gone' })).toBe('SESSION_EXPIRED')
    expect(parseStorePollErrorCode({ success: true })).toBeNull()
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

  it('fails after repeated network errors and treats them as unknown status', () => {
    expect(decidePollNetworkFailure({
      networkFailureCount: STORE_TRYON_POLL_MAX_NETWORK_FAILURES,
      elapsedMs: 8_000,
    })).toEqual({ action: 'fail', reason: 'network' })
    expect(isUnknownPollFailure('network')).toBe(true)
    expect(isUnknownPollFailure('server_error')).toBe(true)
    expect(isUnknownPollFailure('timed_out')).toBe(true)
    expect(isUnknownPollFailure('not_found')).toBe(false)
  })

  it('parses Retry-After seconds', () => {
    expect(parseRetryAfterMs('8')).toBe(8_000)
    expect(parseRetryAfterMs(null)).toBeNull()
  })
})

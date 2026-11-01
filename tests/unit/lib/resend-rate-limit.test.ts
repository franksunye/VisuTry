/** @jest-environment node */
import type { sendRetentionDeletedEmail as SendDeletedEmail } from '@/lib/resend'

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const user = {
  id: 'retention-user',
  email: 'retention@example.com',
  name: 'Retention User',
  expiryDate: new Date('2026-11-01T02:00:00.000Z'),
}

function response(status: number, body: object, retryAfter: string | null = null): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => name.toLowerCase() === 'retry-after' ? retryAfter : null },
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('Resend rate-limit protection', () => {
  let sendDeletedEmail: typeof SendDeletedEmail
  const originalApiKey = process.env.RESEND_API_KEY
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    jest.useFakeTimers({ now: new Date('2026-11-01T02:35:00.000Z') })
    process.env.RESEND_API_KEY = 're_local_test_only'
    global.fetch = jest.fn()
    sendDeletedEmail = require('@/lib/resend').sendRetentionDeletedEmail
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalApiKey
  })

  it('paces concurrent sends to at most four requests per second per instance', async () => {
    const requestTimes: number[] = []
    ;(global.fetch as jest.Mock).mockImplementation(async () => {
      requestTimes.push(Date.now())
      return response(200, { id: `email-${requestTimes.length}` })
    })

    const sends = Array.from({ length: 12 }, (_, i) =>
      sendDeletedEmail({ ...user, id: `user-${i}` }),
    )
    await jest.runAllTimersAsync()
    expect((await Promise.all(sends)).every(result => result.success)).toBe(true)
    expect(requestTimes).toHaveLength(12)
    for (let i = 1; i < requestTimes.length; i++) {
      expect(requestTimes[i] - requestTimes[i - 1]).toBeGreaterThanOrEqual(250)
    }
  })

  it('retries a rejected 429 after Retry-After without duplicating successful sends', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(429, { message: 'Too many requests' }, '1'))
      .mockResolvedValueOnce(response(200, { id: 'accepted' }))

    const sending = sendDeletedEmail(user)
    await jest.advanceTimersByTimeAsync(1250)
    expect(await sending).toEqual({ success: true, emailId: 'accepted' })
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).template.id).toBe('after-deletion')
    expect((global.fetch as jest.Mock).mock.calls[1][1].body).toBe((global.fetch as jest.Mock).mock.calls[0][1].body)
  })

  it('bounds repeated 429 retries and reports failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(response(429, { message: 'Rate limited' }))

    const sending = sendDeletedEmail(user)
    await jest.runAllTimersAsync()
    expect(await sending).toEqual({ success: false, error: 'Rate limited' })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('does not retry prematurely when the provider requires a longer wait', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(response(429, { message: 'Rate limited' }, '60'))
    expect(await sendDeletedEmail(user)).toEqual({
      success: false,
      error: 'Resend rate limit retry-after exceeds 10000ms budget',
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it.each([400, 500])('never retries an HTTP %s response of uncertain admission', async status => {
    ;(global.fetch as jest.Mock).mockResolvedValue(response(status, { message: 'Rejected' }))
    expect(await sendDeletedEmail(user)).toEqual({ success: false, error: 'Rejected' })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry an ambiguous network failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Connection reset'))
    expect(await sendDeletedEmail(user)).toEqual({ success: false, error: 'Connection reset' })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

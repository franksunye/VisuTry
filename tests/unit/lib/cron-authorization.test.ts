/** @jest-environment node */

import { isAuthorizedCronRequest } from '@/lib/cron/authorize'

function request(token?: string) {
  return new Request('https://www.visutry.com/api/cron/cleanup-expired-tasks', {
    headers: token ? { authorization: token } : {},
  })
}

describe('Cron authentication', () => {
  it('rejects absent configuration, including a spoofed Bearer undefined', () => {
    expect(isAuthorizedCronRequest(request('Bearer undefined'), undefined)).toBe(false)
    expect(isAuthorizedCronRequest(request(), '')).toBe(false)
  })

  it('requires the exact configured bearer token', () => {
    expect(isAuthorizedCronRequest(request('Bearer other'), 'configured')).toBe(false)
    expect(isAuthorizedCronRequest(request('Bearer configured'), 'configured')).toBe(true)
  })
})

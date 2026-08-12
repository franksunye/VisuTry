/** @jest-environment node */

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }))
jest.mock('next-intl/middleware', () => jest.fn())
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn() },
  getRequestContext: jest.fn(() => ({})),
}))

import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('middleware public Skill paths', () => {
  it('does not locale-redirect stable public Skill URLs', async () => {
    const response = await middleware(new NextRequest('http://localhost/skills/commerce-analyst'))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})

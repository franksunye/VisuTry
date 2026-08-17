/** @jest-environment node */

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }))
jest.mock('next-intl/middleware', () => jest.fn())
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn() },
  getRequestContext: jest.fn(() => ({})),
}))

import { NextRequest } from 'next/server'
import { middleware, config } from '@/middleware'

describe('middleware public Skill paths', () => {
  it('does not locale-redirect stable public Skill URLs', async () => {
    const response = await middleware(new NextRequest('http://localhost/skills/merchant'))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})

describe('middleware matcher scope', () => {
  const matcher = config.matcher.join(' ')

  it('still authenticates admin and locale-detects the site root', () => {
    expect(config.matcher).toContain('/')
    expect(config.matcher).toContain('/admin/:path*')
  })

  it('excludes locale-prefixed pages, APIs, static assets, skills, and sitemaps', () => {
    expect(matcher).toContain('en|id|ar|ru|de|ja|es|pt|fr')
    expect(matcher).toContain('api')
    expect(matcher).toContain('_next')
    expect(matcher).toContain('skills')
    expect(matcher).toContain('static')
    expect(matcher).toContain('sitemaps')
  })
})

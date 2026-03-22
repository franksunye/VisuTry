jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn(async () => ({ ok: true, status: 200 }))),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: { providers: [] },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}))

jest.mock('@/lib/proxy-setup', () => ({}))

import { GET, POST } from '@/app/api/auth/[...nextauth]/route'
import NextAuth from 'next-auth'
import { logger } from '@/lib/logger'

const mockNextAuth = NextAuth as unknown as jest.Mock
const mockHandler = mockNextAuth.mock.results[0]?.value as jest.Mock
const mockLoggerInfo = (logger.info as unknown) as jest.Mock

describe('NextAuth route wrapper', () => {
  beforeEach(() => {
    mockHandler.mockClear()
    mockLoggerInfo.mockClear()
  })

  it('passes context to GET handler and logs direct auth0 sign-in entry', async () => {
    const request = {
      url: 'https://visutry.com/api/auth/signin/auth0?callbackUrl=%2Ftry-on',
      method: 'GET',
    } as any
    const context = { params: { nextauth: ['signin', 'auth0'] } }

    await GET(request, context)

    expect(mockHandler).toHaveBeenCalledWith(request, context)
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'auth',
      'OAuth sign-in request started',
      expect.objectContaining({
        provider: 'auth0',
        entryMethod: 'direct_auth_url',
        hasCallbackUrl: true,
        callbackUrl: '/try-on',
        path: '/api/auth/signin/auth0',
      })
    )
  })

  it('does not log for non-signin GET requests and still passes context', async () => {
    const request = {
      url: 'https://visutry.com/api/auth/session',
      method: 'GET',
    } as any
    const context = { params: { nextauth: ['session'] } }

    await GET(request, context)

    expect(mockHandler).toHaveBeenCalledWith(request, context)
    expect(mockLoggerInfo).not.toHaveBeenCalled()
  })

  it('passes context to POST handler (critical for signout flow)', async () => {
    const request = {
      url: 'https://visutry.com/api/auth/signout',
      method: 'POST',
    } as any
    const context = { params: { nextauth: ['signout'] } }

    await POST(request, context)

    expect(mockHandler).toHaveBeenCalledWith(request, context)
  })
})

import { getRequestContext, getRequestLanguageContext } from '@/lib/logger'

function requestWithHeaders(values: Record<string, string>): Request {
  return {
    method: 'GET',
    url: 'https://www.visutry.com/api/payment/create-session',
    headers: { get: (name: string) => values[name] || null },
  } as unknown as Request
}

describe('request language context', () => {
  it('captures a bounded Accept-Language value without copying unrelated headers', () => {
    const request = requestWithHeaders({
      'accept-language': 'ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      authorization: 'Bearer should-not-be-logged',
      cookie: 'session=should-not-be-logged',
    })

    const context = getRequestContext(request)

    expect(context.accept_language).toBe('ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7')
    expect(context).not.toHaveProperty('authorization')
    expect(context).not.toHaveProperty('cookie')
  })

  it('remains valid when Accept-Language is missing', () => {
    const context = getRequestContext(requestWithHeaders({}))

    expect(context.accept_language).toBeUndefined()
  })

  it('keeps the language-only context free of the existing IP field', () => {
    const request = requestWithHeaders({
      'accept-language': 'en-US',
      'x-forwarded-for': '203.0.113.10',
    })

    const context = getRequestLanguageContext(request)

    expect(context).toEqual({ accept_language: 'en-US' })
    expect(context).not.toHaveProperty('ip')
  })
})

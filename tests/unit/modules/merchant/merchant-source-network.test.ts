/** @jest-environment node */

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }))
jest.mock('node:http', () => ({ request: jest.fn() }))
jest.mock('node:https', () => ({ request: jest.fn() }))

import { EventEmitter } from 'node:events'
import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import {
  fetchMerchantSourceDocument,
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
  MERCHANT_SOURCE_MAX_REDIRECTS,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
  resolveAndPinMerchantSourceUrl,
} from '@/modules/merchant/application/merchant-source-network'

const mockLookup = lookup as jest.Mock
const mockHttpRequest = httpRequest as jest.Mock
const mockHttpsRequest = httpsRequest as jest.Mock

function response(statusCode: number, body = '<html></html>', headers: Record<string, string> = { 'content-type': 'text/html' }) {
  const value = new EventEmitter() as EventEmitter & { statusCode?: number; headers: Record<string, string> }
  value.statusCode = statusCode
  value.headers = headers
  return { value, body }
}

function requestFor(result: ReturnType<typeof response>) {
  const request = Object.assign(new EventEmitter(), {
    setTimeout: jest.fn(),
    destroy: jest.fn(),
    end: jest.fn(() => {
      process.nextTick(() => {
        result.value.emit('data', Buffer.from(result.body))
        result.value.emit('end')
      })
    }),
  })
  return request
}

describe('bounded merchant source network', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects localhost, private IPv4, private IPv6, and mixed DNS answers', async () => {
    await expect(resolveAndPinMerchantSourceUrl('http://127.0.0.1/products/a')).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_URL' })
    await expect(resolveAndPinMerchantSourceUrl('http://[::1]/products/a')).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_URL' })

    mockLookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }])
    await expect(resolveAndPinMerchantSourceUrl('https://catalog.example.test/products/a')).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_URL' })

    mockLookup.mockResolvedValueOnce([{ address: '2001:db8::10', family: 6 }, { address: 'fc00::1', family: 6 }])
    await expect(resolveAndPinMerchantSourceUrl('https://catalog.example.test/products/a')).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_URL' })
  })

  it('pins a validated public address and sends no credentials or cookies', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    const result = response(200, '<html>ok</html>')
    const request = requestFor(result)
    mockHttpsRequest.mockImplementation((_options: unknown, callback: (value: typeof result.value) => void) => {
      process.nextTick(() => callback(result.value))
      return request
    })

    const document = await fetchMerchantSourceDocument('https://catalog.example.test/products/a')

    expect(document.body).toContain('ok')
    expect(request.setTimeout).toHaveBeenCalledWith(MERCHANT_SOURCE_FETCH_TIMEOUT_MS, expect.any(Function))
    expect(mockHttpsRequest).toHaveBeenCalledWith(expect.objectContaining({
      hostname: '93.184.216.34',
      servername: 'catalog.example.test',
      rejectUnauthorized: true,
      headers: { Accept: 'text/html, application/xhtml+xml;q=0.9', Host: 'catalog.example.test' },
    }), expect.any(Function))
  })

  it('revalidates same-origin redirects and bounds redirect count', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    const first = response(302, '', { location: '/products/a' })
    const second = response(200, '<html>final</html>')
    let call = 0
    mockHttpRequest.mockImplementation((_options: unknown, callback: (value: typeof first.value) => void) => {
      const current = call++ === 0 ? first : second
      const request = requestFor(current)
      process.nextTick(() => callback(current.value))
      return request
    })

    await expect(fetchMerchantSourceDocument('http://catalog.example.test/collection')).resolves.toMatchObject({ body: '<html>final</html>' })
    expect(mockLookup).toHaveBeenCalledTimes(2)

    call = 0
    mockHttpRequest.mockImplementation((_options: unknown, callback: (value: typeof first.value) => void) => {
      const redirect = response(302, '', { location: '/again' })
      const request = requestFor(redirect)
      process.nextTick(() => callback(redirect.value))
      return request
    })
    await expect(fetchMerchantSourceDocument('http://catalog.example.test/collection', { maxRedirects: MERCHANT_SOURCE_MAX_REDIRECTS })).rejects.toMatchObject({ code: 'TOO_MANY_REDIRECTS' })
  })

  it('bounds response size', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    const result = response(200, 'x'.repeat(MERCHANT_SOURCE_MAX_RESPONSE_BYTES + 1))
    const request = requestFor(result)
    mockHttpRequest.mockImplementation((_options: unknown, callback: (value: typeof result.value) => void) => {
      process.nextTick(() => callback(result.value))
      return request
    })

    await expect(fetchMerchantSourceDocument('http://catalog.example.test/products/a')).rejects.toMatchObject({ code: 'SOURCE_TOO_LARGE' })
    expect(request.destroy).toHaveBeenCalled()
  })
})

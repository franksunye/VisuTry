/** @jest-environment node */

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }))
jest.mock('node:https', () => ({ request: jest.fn() }))

import { EventEmitter } from 'node:events'
import { lookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
import { fetchPinnedCimdDocument, isDisallowedCimdAddress, resolveAndPinCimdHost } from '@/modules/merchant/application/merchant-cimd-network'

const mockLookup = lookup as jest.Mock
const mockHttpsRequest = httpsRequest as jest.Mock

describe('CIMD pinned network transport', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each(['10.0.0.1', '127.0.0.1', '169.254.1.1', '192.168.1.1', '::1', 'fc00::1', 'fe80::1', '::ffff:c0a8:1'])('rejects private or reserved address %s', (address) => {
    expect(isDisallowedCimdAddress(address)).toBe(true)
  })

  it('rejects literal private hosts, localhost, and mixed public/private DNS answers', async () => {
    await expect(resolveAndPinCimdHost('https://127.0.0.1/client.json')).rejects.toThrow()
    await expect(resolveAndPinCimdHost('https://localhost/client.json')).rejects.toThrow()
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }])
    await expect(resolveAndPinCimdHost('https://client.example/client.json')).rejects.toThrow()
  })

  it('pins the validated IP while preserving HTTPS hostname verification and SNI', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    const response = new EventEmitter() as EventEmitter & { statusCode?: number; headers: Record<string, string> }
    response.statusCode = 200
    response.headers = { 'content-type': 'application/json', 'content-length': '2' }
    const request = Object.assign(new EventEmitter(), {
      setTimeout: jest.fn(),
      destroy: jest.fn(),
      end: jest.fn(() => {
        process.nextTick(() => {
          response.emit('data', Buffer.from('{}'))
          response.emit('end')
        })
      }),
    })
    mockHttpsRequest.mockImplementation((_options: unknown, callback: (value: typeof response) => void) => {
      process.nextTick(() => callback(response))
      return request
    })
    const pinned = await resolveAndPinCimdHost('https://client.example/client.json')
    const result = await fetchPinnedCimdDocument(pinned)
    expect(result.body).toBe('{}')
    expect(mockLookup).toHaveBeenCalledTimes(1)
    expect(mockHttpsRequest).toHaveBeenCalledWith(expect.objectContaining({
      hostname: '93.184.216.34',
      family: 4,
      servername: 'client.example',
      rejectUnauthorized: true,
      agent: false,
      headers: expect.objectContaining({ Host: 'client.example' }),
    }), expect.any(Function))
  })
})

/** @jest-environment node */

const mockGet = jest.fn()

jest.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => mockGet(...args),
}))

jest.mock('@/lib/blob/private-signed-url', () => ({
  pathnameFromPrivateBlobUrl: (value: string) => {
    const prefix = 'https://tryon-media.test/'
    return value.startsWith(prefix) ? value.slice(prefix.length) : null
  },
}))

import { tryOnProviderMediaInput } from '@/lib/tryon-media-loader'
import { loadTryOnMediaFile, serveLegacyTryOnMedia } from '@/lib/tryon-media-response'

describe('Try-On private source media delivery', () => {
  const envKeys = [
    'TRY_ON_BLOB_STORE_ID',
    'TRY_ON_BLOB_READ_WRITE_TOKEN',
    'FACE_ANALYSIS_BLOB_READ_WRITE_TOKEN',
    'RPIVATE_BLOB_READ_WRITE_TOKEN',
  ] as const
  const originalEnv: Partial<Record<(typeof envKeys)[number], string | undefined>> = {}

  beforeAll(() => {
    for (const key of envKeys) originalEnv[key] = process.env[key]
  })

  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of envKeys) delete process.env[key]
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'private-tryon-token'
  })

  afterAll(() => {
    for (const key of envKeys) {
      const value = originalEnv[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  function privateBlobResult(bytes: number[], contentType = 'image/jpeg') {
    return {
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(bytes))
          controller.close()
        },
      }),
      blob: { contentType },
    }
  }

  it('loads a private Blob source through the bound store instead of public fetch', async () => {
    mockGet.mockResolvedValue(privateBlobResult([1, 2, 3, 4]))
    const fetchSpy = jest.spyOn(global, 'fetch')

    const file = await loadTryOnMediaFile(
      'https://tryon-media.test/tryon/user/user-1/source.jpg',
      'source.jpg',
    )

    expect(mockGet).toHaveBeenCalledWith('https://tryon-media.test/tryon/user/user-1/source.jpg', {
      access: 'private',
      token: 'private-tryon-token',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(file.type).toBe('image/jpeg')
    expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual([1, 2, 3, 4])

    fetchSpy.mockRestore()
  })

  it('converts a private Blob source into an ephemeral provider data URI', async () => {
    mockGet.mockResolvedValue(privateBlobResult([1, 2, 3], 'image/png'))

    const input = await tryOnProviderMediaInput(
      'https://tryon-media.test/tryon/user/user-1/source.png',
    )

    expect(input).toBe('data:image/png;base64,AQID')
    expect(mockGet).toHaveBeenCalledWith('https://tryon-media.test/tryon/user/user-1/source.png', {
      access: 'private',
      token: 'private-tryon-token',
    })
  })

  it('uses the existing production private-store token alias during migration', async () => {
    delete process.env.TRY_ON_BLOB_READ_WRITE_TOKEN
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'legacy-private-store-token'
    mockGet.mockResolvedValue(privateBlobResult([1], 'image/png'))

    await loadTryOnMediaFile(
      'https://tryon-media.test/tryon/user/user-1/source.png',
      'source.png',
    )

    expect(mockGet).toHaveBeenCalledWith('https://tryon-media.test/tryon/user/user-1/source.png', {
      access: 'private',
      token: 'legacy-private-store-token',
    })
  })

  it('retains store-bound auth when no dedicated private-store token exists', async () => {
    delete process.env.TRY_ON_BLOB_READ_WRITE_TOKEN
    mockGet.mockResolvedValue(privateBlobResult([1], 'image/png'))

    await loadTryOnMediaFile(
      'https://tryon-media.test/tryon/user/user-1/source.png',
      'source.png',
    )

    expect(mockGet).toHaveBeenCalledWith('https://tryon-media.test/tryon/user/user-1/source.png', {
      access: 'private',
      storeId: 'store_tryon',
    })
  })

  it('preserves legacy public provider URLs without proxying them', async () => {
    const input = await tryOnProviderMediaInput('https://public.example.com/tryon/user/source.jpg')

    expect(input).toBe('https://public.example.com/tryon/user/source.jpg')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('serves private source bytes same-origin after application authorization', async () => {
    mockGet.mockResolvedValue(privateBlobResult([9, 8, 7], 'image/png'))

    const response = await serveLegacyTryOnMedia(
      'https://tryon-media.test/tryon/item/user-1/frame.png',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('location')).toBeNull()
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([9, 8, 7])
  })

  it('serves legacy data-url bytes through the same media response boundary', async () => {
    const response = await serveLegacyTryOnMedia('data:image/png;base64,CQgH')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([9, 8, 7])
  })

  it('keeps legacy HTTP media compatible through a redirect', async () => {
    const legacyUrl = 'https://legacy.example.com/tryon/result.jpg'
    const response = await serveLegacyTryOnMedia(legacyUrl)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(legacyUrl)
  })

  it('rejects unsupported private media content types', async () => {
    mockGet.mockResolvedValue(privateBlobResult([1, 2], 'text/plain'))

    await expect(loadTryOnMediaFile(
      'https://tryon-media.test/tryon/user/user-1/source.txt',
      'source.txt',
    )).rejects.toThrow('unsupported content type')
  })
})

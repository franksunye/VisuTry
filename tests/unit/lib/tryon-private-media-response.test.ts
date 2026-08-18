/** @jest-environment node */

const mockGet = jest.fn()

jest.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => mockGet(...args),
}))

import { tryOnProviderMediaInput } from '@/lib/tryon-media-loader'
import { loadTryOnMediaFile, serveLegacyTryOnMedia } from '@/lib/tryon-media-response'

describe('Try-On private source media delivery', () => {
  const previousStoreId = process.env.TRY_ON_BLOB_STORE_ID

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
  })

  afterAll(() => {
    if (previousStoreId === undefined) delete process.env.TRY_ON_BLOB_STORE_ID
    else process.env.TRY_ON_BLOB_STORE_ID = previousStoreId
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
      'https://abc.private.blob.vercel-storage.com/tryon/user/user-1/source.jpg',
      'source.jpg',
    )

    expect(mockGet).toHaveBeenCalledWith('tryon/user/user-1/source.jpg', {
      access: 'private',
      storeId: 'store_tryon',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(file.type).toBe('image/jpeg')
    expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual([1, 2, 3, 4])

    fetchSpy.mockRestore()
  })

  it('converts a private Blob source into an ephemeral provider data URI', async () => {
    mockGet.mockResolvedValue(privateBlobResult([1, 2, 3], 'image/png'))

    const input = await tryOnProviderMediaInput(
      'https://abc.private.blob.vercel-storage.com/tryon/user/user-1/source.png',
    )

    expect(input).toBe('data:image/png;base64,AQID')
    expect(mockGet).toHaveBeenCalledWith('tryon/user/user-1/source.png', {
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
      'https://abc.private.blob.vercel-storage.com/tryon/item/user-1/frame.png',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('location')).toBeNull()
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([9, 8, 7])
  })

  it('rejects unsupported private media content types', async () => {
    mockGet.mockResolvedValue(privateBlobResult([1, 2], 'text/plain'))

    await expect(loadTryOnMediaFile(
      'https://abc.private.blob.vercel-storage.com/tryon/user/user-1/source.txt',
      'source.txt',
    )).rejects.toThrow('unsupported content type')
  })
})

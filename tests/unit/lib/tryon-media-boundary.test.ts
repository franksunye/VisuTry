import { toCompareTaskResponse } from '@/lib/compare-tryon'
import {
  serveLegacyTryOnMedia,
  tryOnClientMetadata,
  tryOnMediaPath,
  tryOnMediaUrls,
} from '@/lib/tryon-media'

describe('Try-On protected media boundary', () => {
  it('serializes owner media as application-owned routes', () => {
    expect(tryOnMediaUrls({
      id: 'task/with space',
      userImageUrl: 'https://blob.example/user.jpg',
      itemImageUrl: 'https://blob.example/item.png',
      resultImageUrl: 'https://blob.example/result.webp',
    })).toEqual({
      userImageUrl: '/api/try-on/task%2Fwith%20space/media/user',
      itemImageUrl: '/api/try-on/task%2Fwith%20space/media/item',
      glassesImageUrl: null,
      resultImageUrl: '/api/try-on/task%2Fwith%20space/media/result',
    })
  })

  it('keeps absent media absent instead of inventing a route', () => {
    expect(tryOnMediaUrls({ id: 'task-1' })).toEqual({
      userImageUrl: null,
      itemImageUrl: null,
      glassesImageUrl: null,
      resultImageUrl: null,
    })
  })

  it('never exposes a raw result URL through compare/style task DTOs', () => {
    const response = toCompareTaskResponse({
      id: 'task-1',
      status: 'COMPLETED',
      resultImageUrl: 'https://public.blob.vercel-storage.com/raw-result.png',
      metadata: {
        framePresetId: 'unknown-preset',
        framePresetName: 'Frame',
        framePresetStyle: 'Classic',
      },
    })

    expect(response.resultImageUrl).toBe(tryOnMediaPath('task-1', 'result'))
    expect(JSON.stringify(response)).not.toContain('blob.vercel-storage.com')
  })

  it('allowlists client metadata and removes internal media URLs/data URLs', () => {
    const metadata = tryOnClientMetadata({
      serviceType: 'grsai',
      source: 'face-analysis-top-picks',
      framePresetName: 'Classic Frame',
      uploadDiagnostics: {
        userImageUrl: 'https://public.blob.vercel-storage.com/raw-user.jpg',
      },
      originalResultUrl: 'data:image/png;base64,SECRET',
    })

    expect(metadata).toEqual({
      serviceType: 'grsai',
      source: 'face-analysis-top-picks',
      framePresetName: 'Classic Frame',
    })
    expect(JSON.stringify(metadata)).not.toContain('blob.vercel-storage.com')
    expect(JSON.stringify(metadata)).not.toContain('data:image')
  })

  it('redirects legacy HTTP media after auth instead of proxying image bytes', async () => {
    const response = await serveLegacyTryOnMedia('https://public.blob.vercel-storage.com/result.png')

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://public.blob.vercel-storage.com/result.png')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('preserves legacy Gemini data-url results behind the media route', async () => {
    const response = await serveLegacyTryOnMedia('data:image/png;base64,AQIDBA==')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3, 4])
  })

  it('rejects non-image legacy data urls', async () => {
    await expect(
      serveLegacyTryOnMedia('data:text/plain;base64,AQIDBA=='),
    ).rejects.toThrow('Unsupported Try-On data URL')
  })
})

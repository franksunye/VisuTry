import { toCompareTaskResponse } from '@/lib/compare-tryon'
import {
  decodeLegacyTryOnDataUrl,
  parseLegacyTryOnHttpUrl,
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

  it('canonicalizes private, legacy public, and data-url results identically', () => {
    const sources = [
      'https://storage.example.test/tryon/result/task-1.png',
      'https://legacy.example.com/tryon/result/task-1.png',
      'data:image/png;base64,AQIDBA==',
    ]

    for (const source of sources) {
      const response = tryOnMediaUrls({ id: 'task-1', resultImageUrl: source })
      expect(response.resultImageUrl).toBe(tryOnMediaPath('task-1', 'result'))
      expect(JSON.stringify(response)).not.toContain(source)
    }
  })

  it('never exposes a raw result URL through compare/style task DTOs', () => {
    const response = toCompareTaskResponse({
      id: 'task-1',
      status: 'COMPLETED',
      resultImageUrl: 'https://storage.example.test/raw-result.png',
      metadata: {
        framePresetId: 'unknown-preset',
        framePresetName: 'Frame',
        framePresetStyle: 'Classic',
      },
    })

    expect(response.resultImageUrl).toBe(tryOnMediaPath('task-1', 'result'))
    expect(JSON.stringify(response)).not.toContain('storage.example.test')
  })

  it('allowlists client metadata and removes internal media URLs/data URLs', () => {
    const metadata = tryOnClientMetadata({
      serviceType: 'grsai',
      source: 'face-analysis-top-picks',
      framePresetName: 'Classic Frame',
      uploadDiagnostics: {
      userImageUrl: 'https://storage.example.test/raw-user.jpg',
      },
      originalResultUrl: 'data:image/png;base64,SECRET',
    })

    expect(metadata).toEqual({
      serviceType: 'grsai',
      source: 'face-analysis-top-picks',
      framePresetName: 'Classic Frame',
    })
    expect(JSON.stringify(metadata)).not.toContain('storage.example.test')
    expect(JSON.stringify(metadata)).not.toContain('data:image')
  })

  it('accepts legacy HTTP(S) media targets for post-auth redirects', () => {
    expect(parseLegacyTryOnHttpUrl('https://storage.example.test/result.png').href)
      .toBe('https://storage.example.test/result.png')
    expect(() => parseLegacyTryOnHttpUrl('ftp://example.com/result.png')).toThrow(
      'Unsupported Try-On media URL',
    )
  })

  it('decodes legacy Gemini data-url results without exposing the data URL', () => {
    const decoded = decodeLegacyTryOnDataUrl('data:image/png;base64,AQIDBA==')

    expect(decoded?.contentType).toBe('image/png')
    expect(Array.from(new Uint8Array(decoded?.bytes ?? new ArrayBuffer(0)))).toEqual([1, 2, 3, 4])
  })

  it('rejects non-image legacy data urls', () => {
    expect(() => decodeLegacyTryOnDataUrl('data:text/plain;base64,AQIDBA=='))
      .toThrow('Unsupported Try-On data URL')
  })
})

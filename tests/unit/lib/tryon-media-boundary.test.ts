import { toCompareTaskResponse } from '@/lib/compare-tryon'
import { tryOnMediaPath, tryOnMediaUrls } from '@/lib/tryon-media'

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
})

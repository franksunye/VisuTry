import { adminTryOnMediaPath, adminTryOnMediaUrls } from '@/lib/tryon-media'

describe('Admin Try-On protected media boundary', () => {
  it('uses admin-authenticated application media paths', () => {
    expect(adminTryOnMediaUrls({
      id: 'task-1',
      userImageUrl: 'https://public.blob.vercel-storage.com/user.jpg',
      itemImageUrl: 'https://public.blob.vercel-storage.com/item.png',
      resultImageUrl: 'data:image/png;base64,AQIDBA==',
    })).toEqual({
      userImageUrl: adminTryOnMediaPath('task-1', 'user'),
      itemImageUrl: adminTryOnMediaPath('task-1', 'item'),
      glassesImageUrl: null,
      resultImageUrl: adminTryOnMediaPath('task-1', 'result'),
    })
  })
})

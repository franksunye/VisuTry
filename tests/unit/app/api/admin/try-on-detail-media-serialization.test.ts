const mockRequireAdmin = jest.fn()
const mockFindFirst = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@vercel/blob', () => ({ del: jest.fn() }))

import { GET } from '@/app/api/admin/try-on/[id]/route'

describe('Admin Try-On detail media serialization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true })
  })

  it('does not expose raw task media or original result data URLs', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'task-1',
      origin: 'CONSUMER',
      userImageUrl: 'https://public.blob.vercel-storage.com/raw-user.jpg',
      itemImageUrl: 'https://public.blob.vercel-storage.com/raw-item.png',
      glassesImageUrl: null,
      resultImageUrl: 'https://public.blob.vercel-storage.com/raw-result.png',
      metadata: {
        serviceType: 'gemini',
        originalResultUrl: 'data:image/png;base64,SECRET',
        uploadDiagnostics: {
          userImageUrl: 'https://public.blob.vercel-storage.com/raw-user.jpg',
          itemImageUrl: 'https://public.blob.vercel-storage.com/raw-item.png',
          identicalUploadUrls: false,
        },
      },
      user: null,
    })

    const response = await GET(new Request('http://localhost/api/admin/try-on/task-1') as any, {
      params: { id: 'task-1' },
    })
    const payload = await response.json()
    const serialized = JSON.stringify(payload)

    expect(payload.data.userImageUrl).toBe('/api/admin/try-on/task-1/media/user')
    expect(payload.data.itemImageUrl).toBe('/api/admin/try-on/task-1/media/item')
    expect(payload.data.resultImageUrl).toBe('/api/admin/try-on/task-1/media/result')
    expect(payload.data.metadata.originalResultUrl).toBeUndefined()
    expect(payload.data.metadata.uploadDiagnostics.userImageUrl).toBe('/api/admin/try-on/task-1/media/user')
    expect(serialized).not.toContain('blob.vercel-storage.com')
    expect(serialized).not.toContain('data:image')
  })
})

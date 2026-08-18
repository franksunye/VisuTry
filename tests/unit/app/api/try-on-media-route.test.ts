const mockRequireAuth = jest.fn()
const mockFindUnique = jest.fn()
const mockServeLegacyTryOnMedia = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

jest.mock('@/lib/tryon-media', () => ({
  serveLegacyTryOnMedia: (...args: unknown[]) => mockServeLegacyTryOnMedia(...args),
}))

import { GET } from '@/app/api/try-on/[id]/media/[kind]/route'

describe('GET /api/try-on/[id]/media/[kind]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    mockServeLegacyTryOnMedia.mockResolvedValue(new Response('image', {
      status: 200,
      headers: { 'content-type': 'image/png' },
    }))
  })

  it('requires authentication before reading the task', async () => {
    const response = new Response('unauthorized', { status: 401 })
    mockRequireAuth.mockResolvedValue({ ok: false, response })

    const result = await GET(new Request('http://localhost/api/try-on/task-1/media/user') as any, {
      params: { id: 'task-1', kind: 'user' },
    })

    expect(result.status).toBe(401)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('rejects access to another users media', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-2',
      userImageUrl: 'https://public.blob.vercel-storage.com/user.jpg',
      itemImageUrl: null,
      glassesImageUrl: null,
      resultImageUrl: null,
    })

    const result = await GET(new Request('http://localhost/api/try-on/task-1/media/user') as any, {
      params: { id: 'task-1', kind: 'user' },
    })

    expect(result.status).toBe(403)
    expect(mockServeLegacyTryOnMedia).not.toHaveBeenCalled()
  })

  it('serves owner result media through the protected proxy', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-1',
      userImageUrl: 'https://public.blob.vercel-storage.com/user.jpg',
      itemImageUrl: 'https://public.blob.vercel-storage.com/item.png',
      glassesImageUrl: null,
      resultImageUrl: 'https://public.blob.vercel-storage.com/result.png',
    })

    const result = await GET(new Request('http://localhost/api/try-on/task-1/media/result') as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(200)
    expect(mockServeLegacyTryOnMedia).toHaveBeenCalledWith('https://public.blob.vercel-storage.com/result.png')
  })

  it('returns 404 for unsupported media kinds', async () => {
    const result = await GET(new Request('http://localhost/api/try-on/task-1/media/other') as any, {
      params: { id: 'task-1', kind: 'other' },
    })

    expect(result.status).toBe(404)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })
})

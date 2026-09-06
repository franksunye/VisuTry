const mockRequireAuth = jest.fn()
const mockFindUnique = jest.fn()
const mockServeLegacyTryOnMedia = jest.fn()

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

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

jest.mock('@/lib/tryon-media-response', () => ({
  serveLegacyTryOnMedia: (...args: unknown[]) => mockServeLegacyTryOnMedia(...args),
}))

jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import { GET } from '@/app/api/try-on/[id]/media/[kind]/route'

describe('GET /api/try-on/[id]/media/[kind]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    mockServeLegacyTryOnMedia.mockResolvedValue({ status: 200 })
  })

  it('requires authentication before reading the task', async () => {
    mockRequireAuth.mockResolvedValue({ ok: false, response: { status: 401 } })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'user' },
    })

    expect(result.status).toBe(401)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('rejects access to another users media', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-2',
      userImageUrl: 'https://storage.example.test/user.jpg',
      itemImageUrl: null,
      glassesImageUrl: null,
      resultImageUrl: null,
    })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'user' },
    })

    expect(result.status).toBe(403)
    expect(mockServeLegacyTryOnMedia).not.toHaveBeenCalled()
  })

  it('serves owner result media through the protected proxy', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-1',
      userImageUrl: 'https://storage.example.test/user.jpg',
      itemImageUrl: 'https://storage.example.test/item.png',
      glassesImageUrl: null,
      resultImageUrl: 'https://storage.example.test/result.png',
    })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(200)
    expect(mockServeLegacyTryOnMedia).toHaveBeenCalledWith('https://storage.example.test/result.png')
  })

  it('passes through an image response from the shared private-media reader', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-1',
      userImageUrl: 'https://public.example.com/user.jpg',
      itemImageUrl: null,
      glassesImageUrl: null,
      resultImageUrl: 'https://storage.example.test/tryon/result.png',
    })
    mockServeLegacyTryOnMedia.mockResolvedValue({
      status: 200,
      headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'image/png' : null },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(200)
    expect(result.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('returns an explicit failure when the owner has no result media', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-1',
      userImageUrl: 'https://public.example.com/user.jpg',
      itemImageUrl: 'https://public.example.com/item.png',
      glassesImageUrl: null,
      resultImageUrl: null,
    })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(404)
    expect(mockServeLegacyTryOnMedia).not.toHaveBeenCalled()
  })

  it('returns an explicit media failure when the shared reader fails', async () => {
    mockFindUnique.mockResolvedValue({
      userId: 'user-1',
      userImageUrl: 'https://public.example.com/user.jpg',
      itemImageUrl: null,
      glassesImageUrl: null,
      resultImageUrl: 'https://storage.example.test/tryon/result.png',
    })
    mockServeLegacyTryOnMedia.mockRejectedValue(new Error('private Blob read failed'))

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(502)
    expect(await result.json()).toEqual({ success: false, error: 'Media unavailable' })
  })

  it('returns 404 for unsupported media kinds', async () => {
    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'other' },
    })

    expect(result.status).toBe(404)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })
})

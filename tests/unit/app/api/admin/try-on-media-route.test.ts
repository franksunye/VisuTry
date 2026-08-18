const mockRequireAdmin = jest.fn()
const mockFindFirst = jest.fn()
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
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}))

jest.mock('@/lib/tryon-media-response', () => ({
  serveLegacyTryOnMedia: (...args: unknown[]) => mockServeLegacyTryOnMedia(...args),
}))

import { GET } from '@/app/api/admin/try-on/[id]/media/[kind]/route'

describe('GET /api/admin/try-on/[id]/media/[kind]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true })
    mockServeLegacyTryOnMedia.mockResolvedValue({ status: 200 })
  })

  it('requires admin auth before reading the task', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: false, response: { status: 401 } })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'user' },
    })

    expect(result.status).toBe(401)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('serves only consumer task media through the protected proxy', async () => {
    mockFindFirst.mockResolvedValue({
      userImageUrl: 'https://public.blob.vercel-storage.com/user.jpg',
      itemImageUrl: 'https://public.blob.vercel-storage.com/item.png',
      glassesImageUrl: null,
      resultImageUrl: 'https://public.blob.vercel-storage.com/result.png',
    })

    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'result' },
    })

    expect(result.status).toBe(200)
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'task-1', origin: 'CONSUMER' },
    }))
    expect(mockServeLegacyTryOnMedia).toHaveBeenCalledWith('https://public.blob.vercel-storage.com/result.png')
  })

  it('returns 404 for unsupported media kinds', async () => {
    const result = await GET({} as any, {
      params: { id: 'task-1', kind: 'other' },
    })

    expect(result.status).toBe(404)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })
})

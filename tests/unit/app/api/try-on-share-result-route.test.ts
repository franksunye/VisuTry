/** @jest-environment node */

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

import { GET } from '@/app/api/share/try-on/[id]/result/route'

describe('GET /api/share/try-on/[id]/result', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockServeLegacyTryOnMedia.mockResolvedValue(new Response('image', {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    }))
  })

  it('publicly serves only the completed result storage reference', async () => {
    const privateResultUrl = 'https://abc.private.blob.vercel-storage.com/tryon/result/user-1/task-1.png'
    mockFindUnique.mockResolvedValue({
      status: 'COMPLETED',
      resultImageUrl: privateResultUrl,
    })

    const response = await GET({} as Request, { params: { id: 'task-1' } })

    expect(response.status).toBe(200)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      select: {
        status: true,
        resultImageUrl: true,
      },
    })
    expect(mockServeLegacyTryOnMedia).toHaveBeenCalledWith(privateResultUrl)
  })

  it('does not expose incomplete tasks', async () => {
    mockFindUnique.mockResolvedValue({
      status: 'PROCESSING',
      resultImageUrl: 'https://public.example.com/result.png',
    })

    const response = await GET({} as Request, { params: { id: 'task-1' } })

    expect(response.status).toBe(404)
    expect(mockServeLegacyTryOnMedia).not.toHaveBeenCalled()
  })

  it('returns 404 when a completed task has no result', async () => {
    mockFindUnique.mockResolvedValue({
      status: 'COMPLETED',
      resultImageUrl: null,
    })

    const response = await GET({} as Request, { params: { id: 'task-1' } })

    expect(response.status).toBe(404)
    expect(mockServeLegacyTryOnMedia).not.toHaveBeenCalled()
  })
})

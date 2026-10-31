const mockRequireAdmin = jest.fn()
const mockFindFirst = jest.fn()

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
      delete: jest.fn(),
    },
  },
}))

jest.mock('@vercel/blob', () => ({ del: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))

import { GET, DELETE } from '@/app/api/admin/try-on/[id]/route'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

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

    const response = await GET({} as any, {
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

describe('Admin Try-On delete retains the task on Blob failure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.BLOB_READ_WRITE_TOKEN = 'public-test-token'
    mockRequireAdmin.mockResolvedValue({ ok: true })
    mockFindFirst.mockResolvedValue({
      id: 'task-1', origin: 'CONSUMER',
      userImageUrl: 'https://old.public.blob.vercel-storage.com/tryon/user/u.jpg',
      itemImageUrl: 'https://old.public.blob.vercel-storage.com/tryon/item/i.jpg',
      resultImageUrl: null, glassesImageUrl: null, metadata: {},
    })
    ;(del as jest.Mock).mockResolvedValue(undefined)
    ;(prisma.tryOnTask.delete as jest.Mock).mockResolvedValue({})
  })
  afterEach(() => { delete process.env.BLOB_READ_WRITE_TOKEN })

  it('uses the historical public token and deletes DB only after Blobs', async () => {
    const response = await DELETE({} as any, { params: { id: 'task-1' } })
    expect(response.status).toBe(200)
    expect(del).toHaveBeenCalledWith(expect.stringContaining('.public.blob.vercel-storage.com'),
      { token: 'public-test-token' })
    expect((del as jest.Mock).mock.invocationCallOrder.at(-1)).toBeLessThan(
      (prisma.tryOnTask.delete as jest.Mock).mock.invocationCallOrder[0])
  })

  it('fails without deleting the DB row if a Blob fails', async () => {
    ;(del as jest.Mock).mockRejectedValue(new Error('Access denied'))
    const response = await DELETE({} as any, { params: { id: 'task-1' } })
    expect(response.status).toBe(500)
    expect(prisma.tryOnTask.delete).not.toHaveBeenCalled()
  })
})

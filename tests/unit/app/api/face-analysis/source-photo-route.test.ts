/** @jest-environment node */

import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/face-analysis/[id]/photo/route'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))
jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: { findFirst: jest.fn() },
  },
}))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn() },
}))
jest.mock('@/lib/blob/private-signed-url', () => ({
  pathnameFromPrivateBlobUrl: (value: string) => {
    try {
      const url = new URL(value)
      if (!url.hostname.endsWith('.private.blob.vercel-storage.com')) return null
      const pathname = decodeURIComponent(url.pathname.replace(/^\//, ''))
      return pathname && !pathname.includes('*') ? pathname : null
    } catch {
      return null
    }
  },
}))

describe('GET /api/face-analysis/[id]/photo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'user-1' })
  })

  it('returns the original photo only for an owned, completed, unlocked analysis', async () => {
    ;(prisma.faceAnalysisTask.findFirst as jest.Mock).mockResolvedValue({
      userImageUrl: 'https://blob.example.com/face.jpg',
    })
    global.fetch = jest.fn().mockResolvedValue(new Response(
      new Uint8Array([1, 2, 3]),
      { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '3' } },
    ))

    const response = await GET(
      new NextRequest('http://localhost/api/face-analysis/analysis-1/photo'),
      { params: { id: 'analysis-1' } },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
    expect(prisma.faceAnalysisTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'analysis-1',
        userId: 'user-1',
        reportUnlocked: true,
      }),
    }))
  })

  it('proxies a private photo as same-origin image bytes for landmark detection', async () => {
    const previousStoreId = process.env.FACE_ANALYSIS_BLOB_STORE_ID
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_test'

    ;(prisma.faceAnalysisTask.findFirst as jest.Mock).mockResolvedValue({
      userImageUrl: 'https://store.private.blob.vercel-storage.com/face-analysis/user/photo.jpg',
      metadata: { blobAccess: 'private', blobPathname: 'face-analysis/user/photo.jpg' },
      expiresAt: new Date(Date.now() + 60_000),
    })
    ;(get as jest.Mock).mockResolvedValue({
      stream: new Blob([new Uint8Array([4, 5, 6])]).stream(),
      blob: { contentType: 'image/jpeg' },
    })
    global.fetch = jest.fn()

    const response = await GET(
      new NextRequest('http://localhost/api/face-analysis/analysis-private/photo'),
      { params: { id: 'analysis-private' } },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([4, 5, 6]))
    expect(get).toHaveBeenCalledWith('face-analysis/user/photo.jpg', {
      access: 'private',
      storeId: 'store_test',
    })
    expect(global.fetch).not.toHaveBeenCalled()

    if (previousStoreId === undefined) delete process.env.FACE_ANALYSIS_BLOB_STORE_ID
    else process.env.FACE_ANALYSIS_BLOB_STORE_ID = previousStoreId
  })

  it('does not reveal a photo for a task the current user cannot access', async () => {
    ;(prisma.faceAnalysisTask.findFirst as jest.Mock).mockResolvedValue(null)
    global.fetch = jest.fn()

    const response = await GET(
      new NextRequest('http://localhost/api/face-analysis/analysis-2/photo'),
      { params: { id: 'analysis-2' } },
    )

    expect(response.status).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects a non-image upstream response', async () => {
    ;(prisma.faceAnalysisTask.findFirst as jest.Mock).mockResolvedValue({
      userImageUrl: 'https://blob.example.com/not-an-image',
    })
    global.fetch = jest.fn().mockResolvedValue(new Response(
      'not an image',
      { headers: { 'Content-Type': 'text/plain' } },
    ))

    const response = await GET(
      new NextRequest('http://localhost/api/face-analysis/analysis-3/photo'),
      { params: { id: 'analysis-3' } },
    )

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Face Analysis photo is unavailable',
    })
  })

  it('returns the authentication response without querying task data', async () => {
    ;(requireAuth as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ success: false }, { status: 401 }),
    })

    const response = await GET(
      new NextRequest('http://localhost/api/face-analysis/analysis-4/photo'),
      { params: { id: 'analysis-4' } },
    )

    expect(response.status).toBe(401)
    expect(prisma.faceAnalysisTask.findFirst).not.toHaveBeenCalled()
  })
})

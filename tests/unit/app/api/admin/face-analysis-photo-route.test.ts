/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as getAdminPhoto } from '@/app/api/admin/face-analysis/[id]/photo/route'
import { GET as getAdminTask } from '@/app/api/admin/face-analysis/[id]/route'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { createPrivateBlobGetUrl } from '@/lib/blob/private-signed-url'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: { findUnique: jest.fn() },
  },
}))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn() },
}))
jest.mock('@vercel/blob', () => ({ del: jest.fn() }))
jest.mock('@/lib/blob/private-signed-url', () => ({
  createPrivateBlobGetUrl: jest.fn(),
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
  privateBlobRedirect: (url: string) => new Response(null, {
    status: 307,
    headers: { Location: url, 'Cache-Control': 'private, no-store' },
  }),
}))

describe('GET /api/admin/face-analysis/[id]/photo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('redirects a private photo without requiring unlock or owner match', async () => {
    const previousStoreId = process.env.FACE_ANALYSIS_BLOB_STORE_ID
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_test'

    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue({
      userImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/face-analysis/user/photo.jpg',
      metadata: { blobAccess: 'private', blobPathname: 'face-analysis/user/photo.jpg' },
      expiresAt: new Date(Date.now() - 60_000),
    })
    ;(createPrivateBlobGetUrl as jest.Mock).mockResolvedValue({
      url: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/face-analysis/user/photo.jpg?signature=1',
      validUntil: Date.now() + 60_000,
    })

    const response = await getAdminPhoto(
      new NextRequest('http://localhost/api/admin/face-analysis/analysis-private/photo'),
      { params: { id: 'analysis-private' } },
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('signature=1')
    expect(createPrivateBlobGetUrl).toHaveBeenCalledWith(expect.objectContaining({
      pathname: 'face-analysis/user/photo.jpg',
      businessExpiresAt: null,
      storeId: 'store_test',
    }))
    expect(prisma.faceAnalysisTask.findUnique).toHaveBeenCalledWith({
      where: { id: 'analysis-private' },
      select: { userImageUrl: true, metadata: true, expiresAt: true },
    })

    if (previousStoreId === undefined) delete process.env.FACE_ANALYSIS_BLOB_STORE_ID
    else process.env.FACE_ANALYSIS_BLOB_STORE_ID = previousStoreId
  })

  it('returns 404 when the task has no photo', async () => {
    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await getAdminPhoto(
      new NextRequest('http://localhost/api/admin/face-analysis/missing/photo'),
      { params: { id: 'missing' } },
    )

    expect(response.status).toBe(404)
  })

  it('returns the authentication response without querying task data', async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ success: false }, { status: 403 }),
    })

    const response = await getAdminPhoto(
      new NextRequest('http://localhost/api/admin/face-analysis/analysis-1/photo'),
      { params: { id: 'analysis-1' } },
    )

    expect(response.status).toBe(403)
    expect(prisma.faceAnalysisTask.findUnique).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/face-analysis/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('rewrites the private blob URL to the admin photo proxy', async () => {
    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      userImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/face-analysis/user/photo.jpg',
      reportUnlocked: false,
      user: { id: 'user-1', name: 'Kirsten', email: 'kirsten@example.com' },
    })

    const response = await getAdminTask(
      new NextRequest('http://localhost/api/admin/face-analysis/analysis-1'),
      { params: { id: 'analysis-1' } },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.userImageUrl).toBe('/api/admin/face-analysis/analysis-1/photo')
    expect(body.data.userImageUrl).not.toContain('blob.vercel-storage.com')
  })
})

/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as getAdminPhoto } from '@/app/api/admin/face-analysis/[id]/photo/route'
import { GET as getAdminTask } from '@/app/api/admin/face-analysis/[id]/route'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { serveFaceAnalysisSourcePhoto } from '@/lib/face-analysis-source-photo'

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
jest.mock('@/lib/face-analysis-source-photo', () => ({
  adminFaceAnalysisPhotoPath: (taskId: string) => `/api/admin/face-analysis/${encodeURIComponent(taskId)}/photo`,
  serveFaceAnalysisSourcePhoto: jest.fn(),
}))

describe('GET /api/admin/face-analysis/[id]/photo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('serves a private photo through the same-origin proxy without requiring unlock or owner match', async () => {
    const task = {
      userImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/face-analysis/user/photo.jpg',
      metadata: { blobAccess: 'private', blobPathname: 'face-analysis/user/photo.jpg' },
      expiresAt: new Date(Date.now() - 60_000),
    }
    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue(task)
    ;(serveFaceAnalysisSourcePhoto as jest.Mock).mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
      },
    }))

    const response = await getAdminPhoto(
      new NextRequest('http://localhost/api/admin/face-analysis/analysis-private/photo'),
      { params: { id: 'analysis-private' } },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('location')).toBeNull()
    expect(serveFaceAnalysisSourcePhoto).toHaveBeenCalledWith(task, { respectBusinessExpiry: false })
    expect(prisma.faceAnalysisTask.findUnique).toHaveBeenCalledWith({
      where: { id: 'analysis-private' },
      select: { userImageUrl: true, metadata: true, expiresAt: true },
    })
  })

  it('returns 404 when the task has no photo', async () => {
    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await getAdminPhoto(
      new NextRequest('http://localhost/api/admin/face-analysis/missing/photo'),
      { params: { id: 'missing' } },
    )

    expect(response.status).toBe(404)
    expect(serveFaceAnalysisSourcePhoto).not.toHaveBeenCalled()
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
    expect(serveFaceAnalysisSourcePhoto).not.toHaveBeenCalled()
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

/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as getAdminPhoto } from '@/app/api/admin/face-analysis/[id]/photo/route'
import { GET as getAdminTask, DELETE as deleteAdminTask } from '@/app/api/admin/face-analysis/[id]/route'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { serveFaceAnalysisSourcePhoto } from '@/lib/face-analysis-source-photo'
import { del } from '@vercel/blob'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: { findUnique: jest.fn(), delete: jest.fn() },
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

describe('DELETE /api/admin/face-analysis/[id] Blob-first safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'private-test-token'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, userId: 'admin-1' })
    ;(prisma.faceAnalysisTask.findUnique as jest.Mock).mockResolvedValue({
      id: 'analysis-1', userId: 'user-1',
      userImageUrl: 'https://store.private.blob.vercel-storage.com/face-analysis/user/photo.jpg',
      metadata: { blobPathname: 'face-analysis/user/photo.jpg' },
    })
    ;(del as jest.Mock).mockResolvedValue(undefined)
    ;(prisma.faceAnalysisTask.delete as jest.Mock).mockResolvedValue({})
  })
  afterEach(() => {
    delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
    delete process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
  })

  it('deletes the private Blob before the row and reports actual completion', async () => {
    const response = await deleteAdminTask(new NextRequest('http://localhost/api/admin/face-analysis/analysis-1'),
      { params: { id: 'analysis-1' } })
    expect(response.status).toBe(200)
    expect(del).toHaveBeenCalledWith(expect.stringContaining('.private.blob.vercel-storage.com'),
      { token: 'private-test-token' })
    expect((del as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (prisma.faceAnalysisTask.delete as jest.Mock).mock.invocationCallOrder[0])
  })

  it('returns error and leaves the DB record intact on Blob failure', async () => {
    ;(del as jest.Mock).mockRejectedValue(new Error('Access denied'))
    const response = await deleteAdminTask(new NextRequest('http://localhost/api/admin/face-analysis/analysis-1'),
      { params: { id: 'analysis-1' } })
    expect(response.status).toBe(500)
    expect(prisma.faceAnalysisTask.delete).not.toHaveBeenCalled()
  })
})

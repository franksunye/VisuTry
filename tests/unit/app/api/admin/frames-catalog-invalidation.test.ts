/** @jest-environment node */

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/glasses-catalog-cache', () => ({
  revalidateGlassesCatalog: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    glassesFrame: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { revalidateGlassesCatalog } from '@/lib/glasses-catalog-cache'
import { POST as createFrame } from '@/app/api/admin/frames/route'
import { PUT as updateFrame, DELETE as deleteFrame } from '@/app/api/admin/frames/[id]/route'

const admin = requireAdmin as jest.Mock
const revalidate = revalidateGlassesCatalog as jest.Mock

describe('admin frame mutations invalidate glasses catalog cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('revalidates after a successful create', async () => {
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.glassesFrame.create as jest.Mock).mockResolvedValue({
      id: 'frame-1',
      name: 'Soft Square',
    })

    const request = new NextRequest('http://localhost/api/admin/frames', {
      method: 'POST',
      body: JSON.stringify({
        id: 'frame-1',
        name: 'Soft Square',
        imageUrl: '/frame.jpg',
      }),
    })
    const response = await createFrame(request)

    expect(response.status).toBe(200)
    expect(revalidate).toHaveBeenCalledTimes(1)
  })

  it('does not revalidate when create validation fails', async () => {
    const request = new NextRequest('http://localhost/api/admin/frames', {
      method: 'POST',
      body: JSON.stringify({ name: 'Missing id' }),
    })
    const response = await createFrame(request)

    expect(response.status).toBe(400)
    expect(revalidate).not.toHaveBeenCalled()
  })

  it('revalidates after a successful update', async () => {
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockResolvedValue({
      id: 'frame-1',
      isActive: true,
    })
    ;(prisma.glassesFrame.update as jest.Mock).mockResolvedValue({
      id: 'frame-1',
      name: 'Updated',
    })

    const request = new NextRequest('http://localhost/api/admin/frames/frame-1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated',
        imageUrl: '/frame.jpg',
      }),
    })
    const response = await updateFrame(request, { params: { id: 'frame-1' } })

    expect(response.status).toBe(200)
    expect(revalidate).toHaveBeenCalledTimes(1)
  })

  it('revalidates after a successful delete', async () => {
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockResolvedValue({ id: 'frame-1' })
    ;(prisma.glassesFrame.delete as jest.Mock).mockResolvedValue({ id: 'frame-1' })

    const request = new NextRequest('http://localhost/api/admin/frames/frame-1', {
      method: 'DELETE',
    })
    const response = await deleteFrame(request, { params: { id: 'frame-1' } })

    expect(response.status).toBe(200)
    expect(revalidate).toHaveBeenCalledTimes(1)
  })
})

/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/try-on/pending-tasks/route'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: {
    error: jest.fn(),
  },
}))

describe('GET /api/try-on/pending-tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'user-1' })
  })

  it('requires a valid Try-On type', async () => {
    const response = await GET(new NextRequest('http://localhost/api/try-on/pending-tasks'))

    expect(response.status).toBe(400)
    expect(prisma.tryOnTask.findFirst).not.toHaveBeenCalled()
  })

  it('filters recovery by authenticated user and current Try-On type', async () => {
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue(null)

    const response = await GET(new NextRequest(
      'http://localhost/api/try-on/pending-tasks?type=glasses'
    ))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
    expect(prisma.tryOnTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user-1',
        type: 'GLASSES',
      }),
    }))
  })
})

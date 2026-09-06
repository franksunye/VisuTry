/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/try-on/poll/route'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getTryOnResult } from '@/lib/tryon-service'
import { settleTryOnTaskQuota } from '@/lib/quota'
import { tryOnMediaPath } from '@/lib/tryon-media'

jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: { tryOnTask: { findUnique: jest.fn() } },
}))
jest.mock('@/lib/tryon-service', () => ({ getTryOnResult: jest.fn() }))
jest.mock('@/lib/quota', () => ({ settleTryOnTaskQuota: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn() },
}))

describe('POST /api/try-on/poll media contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'user-1' })
    ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(getTryOnResult as jest.Mock).mockResolvedValue({
      status: 'COMPLETED',
      resultImageUrl: 'https://storage.example.test/tryon/result.png',
      progress: 100,
    })
  })

  it('returns the same canonical result proxy used by recovery DTOs', async () => {
    const response = await POST(new NextRequest('http://localhost/api/try-on/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 'task-1' }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.resultImageUrl).toBe(tryOnMediaPath('task-1', 'result'))
    expect(JSON.stringify(payload)).not.toContain('storage.example.test')
    expect(settleTryOnTaskQuota).toHaveBeenCalledWith('task-1', 'user-1', expect.anything())
  })

  it('does not poll another user task', async () => {
    ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-2' })

    const response = await POST(new NextRequest('http://localhost/api/try-on/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 'task-1' }),
    }))

    expect(response.status).toBe(403)
    expect(getTryOnResult).not.toHaveBeenCalled()
    expect(settleTryOnTaskQuota).not.toHaveBeenCalled()
  })
})

/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/share/[id]/route'
import { prisma } from '@/lib/prisma'
import { publicTryOnShareResultPath } from '@/lib/tryon-media'

const mockFindUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: { tryOnTask: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}))

describe('GET /api/share/[id] media contract', () => {
  it('does not expose persisted source or result storage references', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'task-1',
      type: 'GLASSES',
      status: 'COMPLETED',
      userImageUrl: 'https://storage.example.test/tryon/user.png',
      itemImageUrl: 'https://storage.example.test/tryon/item.png',
      glassesImageUrl: null,
      resultImageUrl: 'data:image/png;base64,AQID',
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      user: { name: 'User', image: null },
    })

    const response = await GET(new NextRequest('http://localhost/api/share/task-1'), {
      params: { id: 'task-1' },
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.userImageUrl).toBeNull()
    expect(payload.data.itemImageUrl).toBeNull()
    expect(payload.data.glassesImageUrl).toBeNull()
    expect(payload.data.resultImageUrl).toBe(publicTryOnShareResultPath('task-1'))
    expect(JSON.stringify(payload)).not.toContain('storage.example.test')
    expect(JSON.stringify(payload)).not.toContain('data:image')
  })
})

/** @jest-environment node */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GET } from '@/app/api/try-on/pending-tasks/route'

const mockRequireAuth = jest.fn()
const mockFindFirst = jest.fn()
const mockFindMany = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAuth: () => mockRequireAuth(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  getRequestContext: () => ({ requestId: 'synthetic-recovery' }),
  logger: { error: jest.fn() },
}))

jest.mock('@/config/try-on-types', () => ({
  isValidTryOnType: (type: string) => type === 'GLASSES',
}))

function request(type = 'GLASSES') {
  return {
    nextUrl: new URL(`http://localhost/api/try-on/pending-tasks?type=${type}`),
  } as unknown as NextRequest
}

const older = (id: string, outcome: string) => ({
  id,
  status: 'PROCESSING',
  createdAt: new Date('2026-10-22T01:00:00.000Z'),
  metadata: {
    serviceType: 'grsai',
    isAsync: true,
    dispatchOutcome: outcome,
    userImageUrl: 'private://MUST-NOT-RETURN',
  },
})

describe('Consumer pending-task recovery beyond 30 minutes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ ok: true, userId: 'user-A' })
    mockFindFirst.mockResolvedValue(null)
    mockFindMany.mockResolvedValue([])
  })

  it('returns a private bounded view of old UNKNOWN/SUBMITTING alongside the recent task', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'recent-id',
      status: 'PROCESSING',
      createdAt: new Date(),
      metadata: { serviceType: 'gemini', isAsync: true },
    })
    mockFindMany.mockResolvedValue([older('unknown-id', 'UNKNOWN'), older('submitting-id', 'SUBMITTING')])

    const response = await GET(request())
    const rows = await response.json()

    expect(response.status).toBe(200)
    expect(rows.map((row: { taskId: string }) => row.taskId)).toEqual([
      'recent-id', 'unknown-id', 'submitting-id',
    ])
    expect(rows.map((row: { requiresReconciliation: boolean }) => row.requiresReconciliation))
      .toEqual([false, true, true])
    expect(JSON.stringify(rows)).not.toContain('private://')
    expect(JSON.stringify(rows)).not.toContain('dispatchOutcome')
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 5,
      where: expect.objectContaining({
        userId: 'user-A',
        origin: 'CONSUMER',
        type: 'GLASSES',
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lte: expect.any(Date) },
        OR: [
          { metadata: { path: ['dispatchOutcome'], equals: 'UNKNOWN' } },
          { metadata: { path: ['dispatchOutcome'], equals: 'SUBMITTING' } },
        ],
      }),
    }))
  })

  it('makes a >30-minute ambiguous task recoverable even when no recent task exists', async () => {
    mockFindMany.mockResolvedValue([older('unconfirmed-31m', 'UNKNOWN')])
    const response = await GET(request())
    expect(await response.json()).toEqual([expect.objectContaining({
      taskId: 'unconfirmed-31m',
      requiresReconciliation: true,
    })])
  })

  it('keeps terminal tasks and other users/origins out of the query contract', async () => {
    await GET(request())
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user-A',
        origin: 'CONSUMER',
        status: { in: ['PENDING', 'PROCESSING'] },
      }),
    }))
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user-A',
        origin: 'CONSUMER',
        status: { in: ['PENDING', 'PROCESSING'] },
      }),
    }))
  })

  it('does not query tasks without authentication', async () => {
    mockRequireAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ success: false }, { status: 401 }),
    })
    const response = await GET(request())
    expect(response.status).toBe(401)
    expect(mockFindFirst).not.toHaveBeenCalled()
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it('rejects invalid Try-On type before any database read', async () => {
    const response = await GET(request('NOT_A_TYPE'))
    expect(response.status).toBe(400)
    expect(mockFindFirst).not.toHaveBeenCalled()
    expect(mockFindMany).not.toHaveBeenCalled()
  })
})

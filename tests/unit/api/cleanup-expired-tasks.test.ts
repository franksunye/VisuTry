import { GET } from '@/app/api/cron/cleanup-expired-tasks/route'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { sendRetentionDeletedEmail } from '@/lib/resend'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status ?? 200 })),
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { findMany: jest.fn(), deleteMany: jest.fn() },
    faceAnalysisTask: { findMany: jest.fn(), deleteMany: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@vercel/blob', () => ({ del: jest.fn() }))

jest.mock('@/lib/resend', () => ({
  sendRetentionDeletedEmail: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockedPrisma = prisma as unknown as {
  tryOnTask: { findMany: jest.Mock; deleteMany: jest.Mock }
  faceAnalysisTask: { findMany: jest.Mock; deleteMany: jest.Mock }
  user: { update: jest.Mock }
  $transaction: jest.Mock
}

function authorizedRequest() {
  return {
    headers: {
      get: jest.fn().mockReturnValue('Bearer test-cron-secret'),
    },
  } as any
}

describe('cleanup-expired-tasks cron', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    mockedPrisma.tryOnTask.findMany.mockResolvedValue([])
    mockedPrisma.faceAnalysisTask.findMany.mockResolvedValue([])
    mockedPrisma.tryOnTask.deleteMany.mockReturnValue({ operation: 'try-on-delete' })
    mockedPrisma.faceAnalysisTask.deleteMany.mockReturnValue({ operation: 'face-analysis-delete' })
    mockedPrisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 0 }])
    mockedPrisma.user.update.mockResolvedValue({})
    ;(del as jest.Mock).mockResolvedValue(undefined)
    ;(sendRetentionDeletedEmail as jest.Mock).mockResolvedValue({ success: true })
  })

  it('deletes expired face-analysis blobs and records', async () => {
    const expiresAt = new Date('2026-07-01T00:00:00.000Z')
    mockedPrisma.faceAnalysisTask.findMany.mockResolvedValue([
      {
        id: 'analysis-1',
        userId: 'user-1',
        userImageUrl: 'https://blob.example/face.jpg',
        expiresAt,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          lastRetentionDeletedEmailSent: null,
        },
      },
    ])
    mockedPrisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 1 }])

    const response = (await GET(authorizedRequest())) as any

    expect(del).toHaveBeenCalledWith(['https://blob.example/face.jpg'])
    expect(mockedPrisma.faceAnalysisTask.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['analysis-1'] } },
    })
    expect(response.status).toBe(200)
    expect(response.body.results.faceAnalysisTasksDeleted).toBe(1)
  })

  it('retains database records when blob deletion fails', async () => {
    mockedPrisma.faceAnalysisTask.findMany.mockResolvedValue([
      {
        id: 'analysis-1',
        userId: 'user-1',
        userImageUrl: 'https://blob.example/face.jpg',
        expiresAt: new Date('2026-07-01T00:00:00.000Z'),
        user: {
          id: 'user-1',
          email: null,
          name: null,
          lastRetentionDeletedEmailSent: null,
        },
      },
    ])
    ;(del as jest.Mock).mockRejectedValue(new Error('blob unavailable'))

    const response = (await GET(authorizedRequest())) as any

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
    expect(response.status).toBe(500)
    expect(response.body.error).toContain('records retained for retry')
  })
})

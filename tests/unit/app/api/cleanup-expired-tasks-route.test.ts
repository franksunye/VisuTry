/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cron/cleanup-expired-tasks/route'
import { cleanupExpiredTryOnTasks } from '@/lib/retention'
import { cleanupExpiredFaceAnalysis } from '@/lib/retention/cleanup-expired-face-analysis'
import { prisma } from '@/lib/prisma'
import { recordCronRun } from '@/lib/cron/record-run'
import { sendRetentionDeletedEmail } from '@/lib/resend'

jest.mock('@/lib/retention', () => ({ cleanupExpiredTryOnTasks: jest.fn() }))
jest.mock('@/lib/retention/cleanup-expired-face-analysis', () => ({ cleanupExpiredFaceAnalysis: jest.fn() }))
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findMany: jest.fn(), update: jest.fn() } } }))
jest.mock('@/lib/cron/authorize', () => ({ isAuthorizedCronRequest: jest.fn(() => true) }))
jest.mock('@/lib/cron/record-run', () => ({ recordCronRun: jest.fn() }))
jest.mock('@/lib/function-observability', () => ({ withFunctionObservation: (_name: string, _owner: string, handler: unknown) => handler }))
jest.mock('@/lib/resend', () => ({ sendRetentionDeletedEmail: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }))

const tryOn = cleanupExpiredTryOnTasks as jest.Mock
const face = cleanupExpiredFaceAnalysis as jest.Mock
const sendDeleted = sendRetentionDeletedEmail as jest.Mock

describe('cleanup-expired-tasks Cron: independent retention domains', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    tryOn.mockResolvedValue({ scanned: 0, deleted: 0, failed: 0, blockedRetried: 0, deletedUserIds: [] })
    face.mockResolvedValue({ scanned: 1, deleted: 1, failed: 0, blockedRetried: 0, deletedUserIds: ['face-owner'] })
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    sendDeleted.mockResolvedValue({ success: true, emailId: 'email-1' })
  })

  it('includes Face Analysis retention and user notifications in the single Hobby Cron', async () => {
    const response = await GET(new NextRequest('https://www.visutry.com/api/cron/cleanup-expired-tasks'))
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.results.faceAnalysisDeleted).toBe(1)
    expect(face).toHaveBeenCalledTimes(1)
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['face-owner'] } },
    }))
    expect(recordCronRun).toHaveBeenCalledWith('cleanup-expired-tasks', 'success', expect.any(Number))
  })

  it('reports partial failure without aborting other cleanup domains', async () => {
    face.mockRejectedValue(new Error('Face DB temporarily unavailable'))
    const response = await GET(new NextRequest('https://www.visutry.com/api/cron/cleanup-expired-tasks'))
    const payload = await response.json()
    expect(response.status).toBe(500)
    expect(payload.results.faceAnalysisOk).toBe(false)
    expect(tryOn).toHaveBeenCalledTimes(2)
    expect(recordCronRun).toHaveBeenCalledWith('cleanup-expired-tasks', 'partial_failure', expect.any(Number))
  })

  it('sends once for users with confirmed deletions and then records success', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'face-owner', email: 'face@example.com', name: 'Face', lastRetentionDeletedEmailSent: null },
    ])
    const response = await GET(new NextRequest('https://www.visutry.com/api/cron/cleanup-expired-tasks'))
    expect(response.status).toBe(200)
    expect(sendDeleted).toHaveBeenCalledTimes(1)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'face-owner' },
      data: { lastRetentionDeletedEmailSent: expect.any(Date) },
    })
  })

  it('does not roll back a confirmed deletion or mark email sent when Resend fails', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'face-owner', email: 'face@example.com', name: 'Face', lastRetentionDeletedEmailSent: null },
    ])
    sendDeleted.mockResolvedValue({ success: false, error: 'Rate limited' })
    const response = await GET(new NextRequest('https://www.visutry.com/api/cron/cleanup-expired-tasks'))
    const payload = await response.json()
    expect(response.status).toBe(500)
    expect(payload.results.faceAnalysisDeleted).toBe(1)
    expect(payload.results.emailsFailed).toBe(1)
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(recordCronRun).toHaveBeenCalledWith('cleanup-expired-tasks', 'partial_failure', expect.any(Number))
  })
})

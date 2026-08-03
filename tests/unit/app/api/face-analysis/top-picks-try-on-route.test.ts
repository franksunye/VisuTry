/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/face-analysis/top-picks-try-on/route'
import { requireAuthWithUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { submitTryOnTask } from '@/lib/tryon-service'
import { readFile } from 'node:fs/promises'

jest.mock('@/lib/api-auth', () => ({ requireAuthWithUser: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: { findFirst: jest.fn() },
    tryOnTask: { findFirst: jest.fn(), findMany: jest.fn() },
  },
}))
jest.mock('@/lib/quota', () => ({ getRemainingQuotaCount: jest.fn() }))
jest.mock('@/lib/tryon-service', () => ({ submitTryOnTask: jest.fn() }))
jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }))
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

const presetIds = [
  'rectangle-classic',
  'browline-classic',
  'wayfarer-classic',
  'geometric-classic',
]

function storedTask(
  presetId: string,
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED',
  index: number,
  attempt = 1,
) {
  return {
    id: `${presetId}-${attempt}`,
    status,
    resultImageUrl: status === 'COMPLETED' ? `https://example.com/${presetId}.jpg` : null,
    errorMessage: status === 'FAILED' ? 'Generation failed' : null,
    createdAt: new Date(`2026-08-03T00:00:0${index + attempt}.000Z`),
    metadata: {
      source: 'face-analysis-top-picks',
      faceAnalysisTaskId: 'analysis-1',
      batchId: 'face-top-picks-analysis-1-v1',
      framePresetIds: presetIds,
      framePresetId: presetId,
      framePresetName: presetId,
      framePresetStyle: presetId,
      batchIndex: index,
      attempt,
    },
  }
}

describe('/api/face-analysis/top-picks-try-on', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAuthWithUser as jest.Mock).mockResolvedValue({
      ok: true,
      user: { id: 'user-1' },
    })
    ;(prisma.faceAnalysisTask.findFirst as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      userImageUrl: 'https://example.com/user.jpg',
      detectedShape: 'square',
    })
    ;(getRemainingQuotaCount as jest.Mock).mockReturnValue(30)
  })

  it('recovers the latest persisted batch for the owned Analysis task', async () => {
    const completedTasks = presetIds.map((id, index) => storedTask(id, 'COMPLETED', index))
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue({
      metadata: { batchId: 'face-top-picks-analysis-1-v1' },
    })
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue(completedTasks)

    const response = await GET(new NextRequest(
      'http://localhost/api/face-analysis/top-picks-try-on?faceAnalysisTaskId=analysis-1',
    ))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data).toMatchObject({
      batchId: 'face-top-picks-analysis-1-v1',
      recovered: true,
      creditsUsed: 4,
    })
    expect(payload.data.tasks).toHaveLength(4)
    expect(payload.data.tasks.every((task: { status: string }) => task.status === 'completed')).toBe(true)
  })

  it('returns an existing partial batch instead of generating four more tasks', async () => {
    const partialTasks = presetIds.map((id, index) => (
      storedTask(id, index === 3 ? 'FAILED' : 'COMPLETED', index)
    ))
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue({
      metadata: { batchId: 'face-top-picks-analysis-1-v1' },
    })
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue(partialTasks)

    const response = await POST(new NextRequest(
      'http://localhost/api/face-analysis/top-picks-try-on',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceAnalysisTaskId: 'analysis-1', framePresetIds: presetIds }),
      },
    ))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.recovered).toBe(true)
    expect(payload.data.tasks.filter((task: { status: string }) => task.status === 'completed')).toHaveLength(3)
    expect(submitTryOnTask).not.toHaveBeenCalled()
  })

  it('retries only failed presets when completing a partial batch', async () => {
    const partialTasks = presetIds.map((id, index) => (
      storedTask(id, index === 3 ? 'FAILED' : 'COMPLETED', index)
    ))
    const retriedTasks = [
      ...partialTasks,
      storedTask(presetIds[3], 'PROCESSING', 3, 2),
    ]
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue({
      metadata: { batchId: 'face-top-picks-analysis-1-v1' },
    })
    ;(prisma.tryOnTask.findMany as jest.Mock)
      .mockResolvedValueOnce(partialTasks)
      .mockResolvedValueOnce(retriedTasks)
    ;(readFile as jest.Mock).mockResolvedValue(Buffer.from('preset'))
    ;(submitTryOnTask as jest.Mock).mockResolvedValue({
      taskId: 'retry-task',
      status: 'submitted',
      serviceType: 'grsai',
      isAsync: true,
    })
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => new Blob(['photo'], { type: 'image/jpeg' }),
    })) as jest.Mock

    const response = await POST(new NextRequest(
      'http://localhost/api/face-analysis/top-picks-try-on',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceAnalysisTaskId: 'analysis-1',
          framePresetIds: presetIds,
          mode: 'complete',
        }),
      },
    ))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(submitTryOnTask).toHaveBeenCalledTimes(1)
    expect(submitTryOnTask).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(File),
      expect.any(File),
      'GLASSES',
      expect.any(String),
      expect.objectContaining({
        clientSubmissionId: 'face-top-picks-analysis-1-v1:geometric-classic:2',
        enforceIdempotency: true,
        metadata: expect.objectContaining({ framePresetId: 'geometric-classic', attempt: 2 }),
      }),
    )
    expect(payload.data.tasks.find((task: { preset: { id: string } }) => (
      task.preset.id === 'geometric-classic'
    )).status).toBe('processing')
  })
})

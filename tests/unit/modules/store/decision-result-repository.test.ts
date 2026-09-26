/** @jest-environment node */

const mockTransaction = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

import { createPrismaDecisionResultRepository } from '@/modules/store/infrastructure/prisma/decision-result-repository'

describe('Decision Result Prisma repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates one canonical result and an opaque hashed share', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'result-1', payload: {} })
    const shareCreate = jest.fn().mockResolvedValue({ id: 'share-1' })
    const tx = {
      decisionResult: { findUnique: jest.fn().mockResolvedValue(null), create, update: jest.fn() },
      decisionResultShare: { create: shareCreate },
    }
    mockTransaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx))

    const expiresAt = new Date('2026-09-27T00:00:00.000Z')
    const result = await createPrismaDecisionResultRepository().upsertRecommendation({
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
      merchantSessionId: 'session-1',
      expiresAt,
      journey: { experienceId: 'experience-1', experienceType: 'STORE', experienceSlug: 'store', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
      faceFit: { faceShape: 'oval', alternativeShapes: [], preferredWidthClass: 'medium', geometryQualityBand: 'high', qualityScore: 90, signalCount: 3 },
      rankingVersion: 'rank-v1',
      frames: [{ frameId: 'frame-1', sku: 'SKU-1', name: 'Round', productUrl: null, score: 92, reason: 'Balanced' }],
    })

    expect(result.resultId).toBe('result-1')
    expect(result.shareToken).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(shareCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchantId: 'merchant-1',
        decisionResultId: 'result-1',
        expiresAt,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    })
    const tokenHash = shareCreate.mock.calls[0][0].data.tokenHash as string
    expect(tokenHash).not.toBe(result.shareToken)
  })

  it('updates the existing result snapshot without creating a second result', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'result-1' })
    const existing = {
      id: 'result-1',
      payload: {
        journey: { experienceType: 'STORE', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
        selectedFrameIds: ['frame-1'],
        favoriteFrameIds: [],
        tryOnResults: [],
      },
    }
    const tx = {
      decisionResult: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn(), update },
      decisionResultShare: { create: jest.fn() },
    }
    mockTransaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx))

    await createPrismaDecisionResultRepository().updateSessionSnapshot({
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      favoriteFrameId: 'frame-2',
      tryOnResult: { taskId: 'task-1', frameId: 'frame-2', status: 'COMPLETED', completedAt: '2026-09-26T00:00:00.000Z' },
    })

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'result-1' },
      data: expect.objectContaining({
        payload: expect.objectContaining({
          selectedFrameIds: ['frame-1'],
          favoriteFrameIds: ['frame-2'],
          tryOnResults: [{ taskId: 'task-1', frameId: 'frame-2', status: 'COMPLETED', completedAt: '2026-09-26T00:00:00.000Z' }],
        }),
      }),
    }))
    expect(tx.decisionResult.create).not.toHaveBeenCalled()
  })
})

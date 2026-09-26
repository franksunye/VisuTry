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
      decisionResultShare: { create: shareCreate, updateMany: jest.fn() },
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

  it('replaces an existing recommendation baseline, resets downstream state, and revokes old shares', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'result-1' })
    const existing = {
      id: 'result-1',
      payload: {
        journey: { experienceType: 'STORE', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
        faceFit: { faceShape: 'round', alternativeShapes: [], preferredWidthClass: 'wide', geometryQualityBand: 'high', qualityScore: 70, signalCount: 2 },
        recommendation: { rankingVersion: 'rank-old', frames: [{ frameId: 'frame-old', sku: 'OLD', name: 'Old', productUrl: null, score: 80, reason: 'old' }] },
        selectedFrameIds: ['frame-1'],
        favoriteFrameIds: ['frame-1'],
        tryOnResults: [{ taskId: 'task-old', frameId: 'frame-1', status: 'COMPLETED', completedAt: '2026-09-25T00:00:00.000Z' }],
        compare: { startedAt: '2026-09-25T00:00:00.000Z', frameIds: ['frame-1', 'frame-2'] },
      },
    }
    const revokeShares = jest.fn().mockResolvedValue({ count: 1 })
    const shareCreate = jest.fn().mockResolvedValue({ id: 'share-new' })
    const tx = {
      decisionResult: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn(), update },
      decisionResultShare: { create: shareCreate, updateMany: revokeShares },
    }
    mockTransaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx))

    const result = await createPrismaDecisionResultRepository().upsertRecommendation({
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
      merchantSessionId: 'session-1',
      expiresAt: new Date('2026-09-27T00:00:00.000Z'),
      journey: { experienceId: 'experience-1', experienceType: 'STORE', experienceSlug: 'store', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
      faceFit: { faceShape: 'oval', alternativeShapes: [], preferredWidthClass: 'medium', geometryQualityBand: 'high', qualityScore: 95, signalCount: 4 },
      rankingVersion: 'rank-new',
      frames: [{ frameId: 'frame-new', sku: 'NEW', name: 'New', productUrl: null, score: 95, reason: 'new' }],
    })

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'result-1' },
      data: expect.objectContaining({
        payload: expect.objectContaining({
          faceFit: expect.objectContaining({ faceShape: 'oval' }),
          recommendation: expect.objectContaining({ rankingVersion: 'rank-new', frames: [{ frameId: 'frame-new', sku: 'NEW', name: 'New', productUrl: null, score: 95, reason: 'new' }] }),
          selectedFrameIds: [],
          favoriteFrameIds: [],
          tryOnResults: [],
          compare: null,
        }),
      }),
    }))
    expect(revokeShares).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-1', decisionResultId: 'result-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    expect(shareCreate).toHaveBeenCalled()
    expect(result.resultId).toBe('result-1')
    expect(tx.decisionResult.create).not.toHaveBeenCalled()
  })
})

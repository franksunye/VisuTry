/** @jest-environment node */

import type { NextRequest } from 'next/server'
import { POST } from '@/app/api/face-analysis/submit/route'

const mockRequireAuthWithUser = jest.fn()
const mockCheckUserQuota = jest.fn()
const mockGetNextQuotaSource = jest.fn()
const mockDeductUserQuota = jest.fn()
const mockSubmitFaceAnalysis = jest.fn()
const mockFindTask = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAuthWithUser: (...args: unknown[]) => mockRequireAuthWithUser(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: {
      findUnique: (...args: unknown[]) => mockFindTask(...args),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  getRequestContext: () => ({ requestId: 'critical-test' }),
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/quota', () => ({
  checkUserQuota: (...args: unknown[]) => mockCheckUserQuota(...args),
  getNextQuotaSource: (...args: unknown[]) => mockGetNextQuotaSource(...args),
  deductUserQuota: (...args: unknown[]) => mockDeductUserQuota(...args),
}))

jest.mock('@/lib/face-analysis-service', () => ({
  submitFaceAnalysis: (...args: unknown[]) => mockSubmitFaceAnalysis(...args),
  serializeFaceAnalysisTask: (task: unknown) => task,
}))

jest.mock('@/lib/face-landmark-metrics', () => ({
  normalizeGeometryAnalysis: (value: unknown) => value,
}))

const user = {
  id: 'user-1',
  isPremium: false,
  premiumExpiresAt: null,
  currentSubscriptionType: null,
  premiumUsageCount: 0,
  creditsPurchased: 0,
  creditsUsed: 0,
  freeTrialsUsed: 0,
}

function makeRequest() {
  const formData = new FormData()
  formData.set('userImage', new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' }))
  formData.set('clientSubmissionId', 'submission-critical-1')
  formData.set('geometryAnalysis', JSON.stringify({ status: 'success', qualityScore: 0.94 }))

  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as unknown as NextRequest
}

describe('Face Analysis submit critical invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuthWithUser.mockResolvedValue({ ok: true, user })
    mockCheckUserQuota.mockReturnValue({ allowed: true })
    mockGetNextQuotaSource.mockReturnValue('free_trial')
    mockDeductUserQuota.mockResolvedValue(undefined)
    mockFindTask.mockResolvedValue({
      id: 'task-1',
      status: 'COMPLETED',
      reportUnlocked: false,
    })
    mockSubmitFaceAnalysis.mockResolvedValue({
      status: 'completed',
      taskId: 'task-1',
      reportUnlocked: false,
      basicResult: { faceShape: 'oval', confidence: 0.9 },
    })
  })

  it('returns the auth response before touching quota, AI, or billing state', async () => {
    mockRequireAuthWithUser.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
    expect(mockCheckUserQuota).not.toHaveBeenCalled()
    expect(mockSubmitFaceAnalysis).not.toHaveBeenCalled()
    expect(mockDeductUserQuota).not.toHaveBeenCalled()
  })

  it('rejects exhausted quota without running analysis or deducting anything', async () => {
    mockCheckUserQuota.mockReturnValue({ allowed: false, reason: 'No remaining quota' })

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.success).toBe(false)
    expect(mockSubmitFaceAnalysis).not.toHaveBeenCalled()
    expect(mockDeductUserQuota).not.toHaveBeenCalled()
  })

  it('keeps a free-trial report locked and deducts exactly once only after completion', async () => {
    mockGetNextQuotaSource.mockReturnValue('free_trial')

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockSubmitFaceAnalysis).toHaveBeenCalledWith(
      user,
      expect.any(File),
      expect.objectContaining({
        clientSubmissionId: 'submission-critical-1',
        reportUnlocked: false,
      }),
    )
    expect(mockDeductUserQuota).toHaveBeenCalledTimes(1)
    expect(mockDeductUserQuota).toHaveBeenCalledWith('user-1', expect.anything())
  })

  it('marks credit-funded reports unlocked and still deducts exactly once', async () => {
    mockGetNextQuotaSource.mockReturnValue('credit')
    mockSubmitFaceAnalysis.mockResolvedValue({
      status: 'completed',
      taskId: 'task-1',
      reportUnlocked: true,
      basicResult: { faceShape: 'oval', confidence: 0.9 },
    })

    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    expect(mockSubmitFaceAnalysis).toHaveBeenCalledWith(
      user,
      expect.any(File),
      expect.objectContaining({ reportUnlocked: true }),
    )
    expect(mockDeductUserQuota).toHaveBeenCalledTimes(1)
  })

  it('never deducts quota when analysis fails before completion', async () => {
    mockSubmitFaceAnalysis.mockRejectedValue(new Error('provider failed'))

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(mockDeductUserQuota).not.toHaveBeenCalled()
  })
})

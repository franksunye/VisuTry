/** @jest-environment node */

import type { User } from '@prisma/client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'
import { submitFaceAnalysis } from '@/lib/face-analysis-service'

const mockPut = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockKie = jest.fn()
const mockGrsai = jest.fn()
const mockSelectProvider = jest.fn()

jest.mock('@vercel/blob', () => ({ put: (...args: unknown[]) => mockPut(...args), get: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: { faceAnalysisTask: {
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  } },
}))
jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('@/config/retention', () => ({ calculateExpiresAt: () => new Date('2027-01-01T00:00:00Z') }))
jest.mock('@/lib/generation/ai-provider-routing', () => ({
  selectFaceAnalysisProvider: () => mockSelectProvider(),
}))
jest.mock('@/lib/kie-face-analysis', () => ({
  KIE_FACE_ANALYSIS_MODEL: 'gemini-3-8-flash-openai',
  analyzeFaceWithKie: (...args: unknown[]) => mockKie(...args),
}))
jest.mock('@/lib/grsai-face-analysis', () => ({
  analyzeFaceWithGrsAi: (...args: unknown[]) => mockGrsai(...args),
}))
jest.mock('@/lib/face-analysis-blob-access', () => ({
  resolveFaceAnalysisBlobAccessMode: () => 'public-poc',
  getFaceAnalysisBlobOptions: () => ({ access: 'public' }),
  getFaceAnalysisBlobStoreId: () => undefined,
}))

const geometry: FaceGeometryAnalysis = {
  version: 'landmark-v1',
  status: 'measured',
  source: 'mediapipe-face-landmarker',
  faceDetected: true,
  faceCount: 1,
  qualityScore: 87,
  measuredShape: 'diamond',
  measuredConfidence: 0.86,
  ratios: {
    faceAspectRatio: 1.31, cheekToFaceWidth: 0.92, jawToCheekWidth: 0.71,
    foreheadToCheekWidth: 0.73, eyeLineTiltDeg: 1.1, symmetryOffset: 0.02,
    noseBridgeToFaceWidth: 0.16,
  },
  signals: ['Cheekbones are the widest area'],
  warnings: [],
}
const user = { id: 'test-user' } as User
const image = () => new File([new Uint8Array([1, 2, 3])], 'synthetic.jpg', { type: 'image/jpeg' })

describe('Face Analysis algorithm-only service fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelectProvider.mockReturnValue('kie')
    mockPut.mockResolvedValue({ url: 'https://example.com/blob.jpg', pathname: 'face-analysis/test-user/blob.jpg' })
    mockCreate.mockResolvedValue({ id: 'task-1' })
    mockUpdate.mockResolvedValue({ id: 'task-1' })
  })

  it('completes Kie 503 with measured shape and a single provider attempt', async () => {
    mockKie.mockRejectedValue(new Error('Kie provider 503'))
    const result = await submitFaceAnalysis(user, image(), { geometry, reportUnlocked: true })
    expect(result.status).toBe('completed')
    expect(result.basicResult?.faceShape).toBe('diamond')
    expect(result.basicResult?.confidence).toBe(0.86)
    expect(result.basicResult?.analysisSource).toBe('algorithm-only')
    expect(result.fullResult?.analysisSource).toBe('algorithm-only')
    expect(mockKie).toHaveBeenCalledTimes(1)
    expect(mockGrsai).not.toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const data = mockUpdate.mock.calls[0][0].data
    expect(data.status).toBe('COMPLETED')
    expect(data.detectedShape).toBe('diamond')
    expect(data.reportUnlocked).toBe(true)
    expect(data.metadata.analysisSource).toBe('algorithm-only')
  })

  it('keeps the existing locked report and full report storage semantics', async () => {
    mockKie.mockRejectedValue(new Error('provider unavailable'))
    const result = await submitFaceAnalysis(user, image(), { geometry, reportUnlocked: false })
    expect(result.status).toBe('completed')
    expect(result.fullResult).toBeUndefined()
    expect(mockUpdate.mock.calls[0][0].data.fullResult.analysisSource).toBe('algorithm-only')
    expect(mockUpdate.mock.calls[0][0].data.reportUnlocked).toBe(false)
  })

  it('fails closed if MediaPipe measurements are missing or unreliable', async () => {
    mockKie.mockRejectedValue(new Error('Kie provider 503'))
    await expect(submitFaceAnalysis(user, image(), {
      geometry: { ...geometry, status: 'unavailable', qualityScore: 0 },
    })).rejects.toThrow('Kie provider 503')
    expect(mockKie).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate.mock.calls[0][0].data.status).toBe('FAILED')
  })

  it('keeps a successful Kie result AI-assisted', async () => {
    mockKie.mockResolvedValue(JSON.stringify({
      faceShape: 'square', confidence: 0.93,
      summary: 'AI summary', keyFeatures: ['Strong jawline'],
      bestFrames: ['round'], framesToAvoid: ['square'], styleGuide: 'Choose round.',
    }))
    const result = await submitFaceAnalysis(user, image(), { geometry })
    expect(result.basicResult?.faceShape).toBe('square')
    expect(result.basicResult?.analysisSource).toBe('ai-assisted')
    expect(mockUpdate.mock.calls[0][0].data.metadata.analysisSource).toBe('ai-assisted')
  })

  it('also uses landmark-only fallback for a Grsai failure', async () => {
    mockSelectProvider.mockReturnValue('grsai')
    mockGrsai.mockRejectedValue(new Error('Grsai unavailable'))
    const result = await submitFaceAnalysis(user, image(), { geometry })
    expect(result.basicResult?.analysisSource).toBe('algorithm-only')
    expect(mockGrsai).toHaveBeenCalledTimes(1)
    expect(mockKie).not.toHaveBeenCalled()
  })
})

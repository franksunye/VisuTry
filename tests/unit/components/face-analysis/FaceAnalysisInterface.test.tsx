import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'

const mockUpdate = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        remainingTrials: 4,
        isPremiumActive: false,
      },
    },
    update: mockUpdate,
  }),
}))

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/upload/ImageUpload', () => ({ ImageUpload: () => null }))
jest.mock('@/components/try-on/LoadingState', () => ({ LoadingState: () => null }))
jest.mock('@/components/face-analysis/FaceAnalysisStepper', () => ({
  FaceAnalysisStepper: () => null,
}))
jest.mock('@/components/face-analysis/FaceAnalysisResult', () => ({
  FaceAnalysisResult: () => null,
}))
jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceGeometryFromFile: jest.fn(),
}))
jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackFaceAnalysisUnlockSuccess: jest.fn(),
    trackFaceAnalysisStart: jest.fn(),
    trackFaceAnalysisComplete: jest.fn(),
    trackFaceAnalysisFailed: jest.fn(),
    trackFaceAnalysisUpload: jest.fn(),
    trackBeginCheckout: jest.fn(),
    trackViewPricing: jest.fn(),
  },
  getUserType: () => 'free',
}))

const completedTask = {
  id: 'task-1',
  status: 'completed',
  reportUnlocked: true,
  basicResult: {
    faceShape: 'oval',
    confidence: 0.9,
  },
}

describe('FaceAnalysisInterface payment return recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.mockResolvedValue(undefined)
    window.history.replaceState(
      null,
      '',
      '/en/face-analysis?unlock=success&taskId=task-1'
    )
    mockSearchParams = new URLSearchParams(window.location.search)
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, data: completedTask }),
    }) as jest.Mock
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('consumes unlock=success before refreshing and does not refresh again after remount', async () => {
    const firstRender = render(<FaceAnalysisInterface />)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(window.location.search).toBe('?taskId=task-1')

    firstRender.unmount()
    mockSearchParams = new URLSearchParams(window.location.search)
    render(<FaceAnalysisInterface />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'

const mockUpdate = jest.fn()
const mockAnalyzeGeometry = jest.fn()
const mockConsumePhotoHandoff = jest.fn()
let mockSearchParams = new URLSearchParams()
let mockSession = {
  user: {
    id: 'user-1',
    remainingTrials: 1,
    isPremiumActive: false,
    creditsPurchased: 0,
    creditsUsed: 0,
    freeTrialsUsed: 0,
  },
}

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, update: mockUpdate }),
}))

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/upload/ImageUpload', () => ({
  ImageUpload: ({
    currentImage,
    onImageSelect,
  }: {
    currentImage?: string
    onImageSelect: (file: File, preview: string) => void
  }) => (
    <div data-testid="critical-image-upload" data-current-image={currentImage ?? ''}>
      <button
        type="button"
        onClick={() =>
          onImageSelect(
            new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' }),
            'blob:critical-photo',
          )
        }
      >
        select-critical-photo
      </button>
    </div>
  ),
}))

jest.mock('@/components/try-on/LoadingState', () => ({ LoadingState: () => null }))
jest.mock('@/components/face-analysis/FaceAnalysisStepper', () => ({
  FaceAnalysisStepper: () => null,
}))
jest.mock('@/components/face-analysis/FaceAnalysisResult', () => ({
  FaceAnalysisResult: ({ task, onUnlock }: { task: { id: string }; onUnlock: () => void }) => (
    <div>
      <span>critical-result:{task.id}</span>
      <button type="button" onClick={onUnlock}>unlock-report</button>
    </div>
  ),
}))

jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceGeometryFromFile: (...args: unknown[]) => mockAnalyzeGeometry(...args),
}))
jest.mock('@/lib/face-analysis-photo-handoff', () => ({
  consumeFaceAnalysisPhotoHandoff: (...args: unknown[]) => mockConsumePhotoHandoff(...args),
}))
jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackFaceAnalysisUnlockSuccess: jest.fn(),
    trackFaceAnalysisStart: jest.fn(),
    trackFaceAnalysisComplete: jest.fn(),
    trackFaceAnalysisFailed: jest.fn(),
    trackFaceAnalysisUpload: jest.fn(),
    trackFaceAnalysisPhotoHandoffRestored: jest.fn(),
    trackBeginCheckout: jest.fn(),
    trackViewPricing: jest.fn(),
  },
  getAcquisitionContext: () => null,
  getUserType: () => 'free',
}))

const completedTask = {
  id: 'task-critical-1',
  status: 'completed',
  userImageUrl: 'https://example.com/photo.jpg',
  reportUnlocked: false,
  basicResult: {
    faceShape: 'oval',
    confidence: 0.91,
  },
}

describe('Face Analysis critical business journey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.mockResolvedValue(undefined)
    mockAnalyzeGeometry.mockResolvedValue({ status: 'success', qualityScore: 0.95 })
    mockConsumePhotoHandoff.mockResolvedValue(null)
    mockSession = {
      user: {
        id: 'user-1',
        remainingTrials: 1,
        isPremiumActive: false,
        creditsPurchased: 0,
        creditsUsed: 0,
        freeTrialsUsed: 0,
      },
    }
    window.history.replaceState(null, '', '/en/face-analysis')
    mockSearchParams = new URLSearchParams(window.location.search)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('keeps upload -> geometry -> submit -> completed report wired together', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          status: 'completed',
          task: completedTask,
        },
      }),
    }) as jest.Mock

    render(<FaceAnalysisInterface />)

    fireEvent.click(screen.getByRole('button', { name: 'select-critical-photo' }))
    fireEvent.click(screen.getByRole('button', { name: 'analyze.button' }))

    expect(await screen.findByText('critical-result:task-critical-1')).toBeInTheDocument()
    expect(mockAnalyzeGeometry).toHaveBeenCalledTimes(1)

    const submitCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/face-analysis/submit',
    )
    expect(submitCall).toBeTruthy()
    expect(submitCall[1]?.method).toBe('POST')
    expect(submitCall[1]?.body).toBeInstanceOf(FormData)

    const body = submitCall[1].body as FormData
    expect(body.get('userImage')).toBeInstanceOf(File)
    expect(body.get('clientSubmissionId')).toEqual(expect.any(String))
    expect(body.get('geometryAnalysis')).toContain('qualityScore')
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(window.location.search).toBe('?taskId=task-critical-1')
  })

  it('blocks analysis when quota is exhausted and routes the primary action to pricing', () => {
    mockSession = {
      user: {
        id: 'user-1',
        remainingTrials: 0,
        isPremiumActive: false,
        creditsPurchased: 0,
        creditsUsed: 0,
        freeTrialsUsed: 1,
      },
    }

    render(<FaceAnalysisInterface />)

    const pricingLink = screen.getByRole('link', { name: 'footer.getCredits' })
    expect(pricingLink).toHaveAttribute('href', '/en/pricing')
    expect(screen.queryByRole('button', { name: 'analyze.button' })).not.toBeInTheDocument()
  })

  it('preserves the report-unlock checkout contract for a locked completed task', async () => {
    window.history.replaceState(null, '', '/en/face-analysis?taskId=task-critical-1')
    mockSearchParams = new URLSearchParams(window.location.search)

    global.fetch = jest.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/face-analysis/task-critical-1') {
        return {
          json: async () => ({ success: true, data: completedTask }),
        }
      }
      if (url === '/api/payment/create-session' && options?.method === 'POST') {
        return {
          json: async () => ({ success: false, error: 'stop-before-navigation' }),
        }
      }
      throw new Error(`Unexpected request: ${url}`)
    }) as jest.Mock

    render(<FaceAnalysisInterface />)

    expect(await screen.findByText('critical-result:task-critical-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'unlock-report' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payment/create-session',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    const checkoutCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/payment/create-session',
    )
    const checkoutBody = JSON.parse(checkoutCall[1].body as string)

    expect(checkoutBody.productType).toBe('CREDITS_PACK')
    expect(checkoutBody.unlockTaskId).toBe('task-critical-1')
    expect(checkoutBody.locale).toBe('en')
    expect(checkoutBody.successUrl).toContain('/en/face-analysis?unlock=success')
    expect(checkoutBody.successUrl).toContain('taskId=task-critical-1')
    expect(checkoutBody.cancelUrl).toContain('/en/face-analysis?unlock=cancel')
  })
})

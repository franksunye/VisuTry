import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'

const mockUpdate = jest.fn()
const mockConsumePhotoHandoff = jest.fn()
const mockGetUserType = jest.fn(
  (_isPremiumActive: boolean, _creditsRemaining: number, _isAuthenticated: boolean) => 'free',
)
let mockSearchParams = new URLSearchParams()
let mockSession = {
  user: {
    id: 'user-1',
    remainingTrials: 4,
    isPremiumActive: false,
    creditsPurchased: 0,
    creditsUsed: 0,
    freeTrialsUsed: 0,
  },
}

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
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

jest.mock('@/components/upload/ImageUpload', () => ({
  ImageUpload: ({ currentImage }: { currentImage?: string }) => (
    <div data-testid="image-upload" data-current-image={currentImage ?? ''} />
  ),
}))
jest.mock('@/components/try-on/LoadingState', () => ({ LoadingState: () => null }))
jest.mock('@/components/face-analysis/FaceAnalysisStepper', () => ({
  FaceAnalysisStepper: () => null,
}))
jest.mock('@/components/face-analysis/FaceAnalysisResult', () => ({
  FaceAnalysisResult: () => <div>Personalized result</div>,
}))
jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceGeometryFromFile: jest.fn(),
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
  getCheckoutAttribution: () => ({
    landing_locale: 'en',
    site_locale: 'en',
    checkout_locale: 'en',
  }),
  getUserType: (...args: [boolean, number, boolean]) => mockGetUserType(...args),
}))

const completedTask = {
  id: 'task-1',
  status: 'completed',
  userImageUrl: 'https://example.com/photo.jpg',
  reportUnlocked: true,
  basicResult: {
    faceShape: 'oval',
    confidence: 0.9,
  },
}

describe('FaceAnalysisInterface continuation recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.mockResolvedValue(undefined)
    mockConsumePhotoHandoff.mockResolvedValue(null)
    mockSession = {
      user: {
        id: 'user-1',
        remainingTrials: 4,
        isPremiumActive: false,
        creditsPurchased: 0,
        creditsUsed: 0,
        freeTrialsUsed: 0,
      },
    }
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

  it('restores a one-time detector photo and removes the handoff token from the URL', async () => {
    const file = new File(['optimized portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    mockConsumePhotoHandoff.mockResolvedValue(file)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:restored-face-photo'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    })
    window.history.replaceState(
      null,
      '',
      '/en/face-analysis?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-1',
    )
    mockSearchParams = new URLSearchParams(window.location.search)

    const view = render(<FaceAnalysisInterface />)

    await waitFor(() => {
      expect(screen.getByTestId('image-upload')).toHaveAttribute(
        'data-current-image',
        'blob:restored-face-photo',
      )
    })
    expect(mockConsumePhotoHandoff).toHaveBeenCalledWith('handoff-1')
    expect(window.location.search).toBe('?source=free-face-shape-detector&faceShape=oval')

    view.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:restored-face-photo')
  })

  it('identifies the registered user credit as the included analysis credit', () => {
    window.history.replaceState(null, '', '/en/face-analysis')
    mockSearchParams = new URLSearchParams(window.location.search)

    render(<FaceAnalysisInterface />)

    expect(screen.getByText('analyze.includedCreditNote')).toBeInTheDocument()
    expect(screen.queryByText('analyze.creditNote')).not.toBeInTheDocument()
    expect(mockGetUserType).toHaveBeenCalledWith(false, 0, true)
  })

  it('distinguishes purchased credits from the included account credit', () => {
    mockSession = {
      user: {
        id: 'user-1',
        remainingTrials: 4,
        isPremiumActive: false,
        creditsPurchased: 5,
        creditsUsed: 2,
        freeTrialsUsed: 0,
      },
    }
    window.history.replaceState(null, '', '/en/face-analysis')
    mockSearchParams = new URLSearchParams(window.location.search)

    render(<FaceAnalysisInterface />)

    expect(screen.getByText('analyze.creditNote')).toBeInTheDocument()
    expect(screen.queryByText('analyze.includedCreditNote')).not.toBeInTheDocument()
    expect(mockGetUserType).toHaveBeenCalledWith(false, 3, true)
  })

  it('does not show a generic no-credit banner after a completed result is loaded', async () => {
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
    window.history.replaceState(null, '', '/en/face-analysis?taskId=task-1')
    mockSearchParams = new URLSearchParams(window.location.search)

    render(<FaceAnalysisInterface />)

    expect(await screen.findByText('Personalized result')).toBeInTheDocument()
    expect(screen.queryByText('footer.noCredits')).not.toBeInTheDocument()
  })
})

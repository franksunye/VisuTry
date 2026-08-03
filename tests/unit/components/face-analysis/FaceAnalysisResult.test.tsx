import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FaceAnalysisResult } from '@/components/face-analysis/FaceAnalysisResult'
import { FaceAnalysisTaskResponse } from '@/types/face-analysis'
import { buildFullResult, parseFaceAnalysisContent } from '@/lib/face-analysis-parser'
import { analytics } from '@/lib/analytics'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'completed') return 'Completed'
    if (key === 'yourPhoto') return 'Your uploaded photo'
    if (key === 'wireframeCaption') return 'Illustrative overlay'
    if (key === 'keyFeatures') return 'Key Features'
    if (key === 'frameSearch.title') return 'Shopping for frames?'
    if (key === 'frameSearch.description') return 'Search these styles'
    if (key === 'frameSearch.opensGoogle') return 'Opens Google'
    if (key === 'frameSearch.searchStyle') return `Search ${values?.style} frames`
    if (key === 'title') return 'Complete Your Personalized Frame Decision'
    if (key === 'feature1') return 'Detailed recommendations'
    if (key === 'feature2') return 'Try-on credits included'
    if (key === 'feature3') return 'One-time unlock'
    if (key === 'price') return 'One-time price'
    if (key === 'button') return 'Unlock My Recommendations'
    if (key === 'redirecting') return 'Redirecting'
    return key
  },
}))

const full = buildFullResult(parseFaceAnalysisContent(JSON.stringify({
  faceShape: 'square',
  confidence: 0.92,
  summary: 'Strong angular face with balanced proportions.',
  keyFeatures: ['Strong jawline', 'Balanced forehead and jaw width'],
  bestFrames: [],
  framesToAvoid: [],
  styleGuide: 'Choose softer frame shapes to balance angles.',
})))

function makeTask(overrides: Partial<FaceAnalysisTaskResponse> = {}): FaceAnalysisTaskResponse {
  return {
    id: 'task-1',
    status: 'completed',
    userImageUrl: 'https://example.com/photo.jpg',
    detectedShape: 'square',
    confidence: 0.92,
    basicResult: {
      faceShape: 'square',
      faceShapeDisplayName: 'Square Face',
      confidence: 0.92,
      summary: 'Strong angular face with balanced proportions.',
      keyFeatures: ['Strong jawline', 'Balanced forehead and jaw width'],
    },
    fullResult: full,
    lockedTeaser: null,
    reportUnlocked: true,
    createdAt: '2026-06-08T00:00:00Z',
    ...overrides,
  }
}

describe('FaceAnalysisResult', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/face-analysis/top-picks-try-on?')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: null }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${String(input)}`)
    }) as jest.Mock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('renders the premium full report sections when unlocked', async () => {
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={5} />)

    expect(screen.getByText('Your AI Face Shape Report')).toBeInTheDocument()
    expect(screen.getByText('Face Analysis Details')).toBeInTheDocument()
    expect(screen.getByText('Frames to Wear')).toBeInTheDocument()
    expect(screen.getByText('Frames to Avoid')).toBeInTheDocument()
    expect(screen.getByText('Personal Style Guide')).toBeInTheDocument()
    expect(screen.getByText('Try On Your Top Picks')).toBeInTheDocument()
    expect(screen.queryByText(/Each AI glasses try-on uses 1 credit per generated photo/i)).not.toBeInTheDocument()
    expect(screen.queryByAltText('Style guide preview')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download report/i })).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /try top picks on your photo/i })).toBeEnabled()
  })

  it('starts top picks generation when credits are available', async () => {
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={5} />)

    expect(await screen.findByRole('button', { name: /try top picks on your photo/i })).toBeEnabled()
    expect(screen.queryByText('5 credits')).not.toBeInTheDocument()
    expect(screen.queryByText(/failed generations are not charged/i)).not.toBeInTheDocument()
  })

  it('links top picks to pricing when credits are insufficient', async () => {
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={2} />)

    const link = await screen.findByRole('link', { name: /continue with my top picks/i })
    expect(link).toHaveAttribute('href', '/en/pricing?source=face-analysis-top-picks')
    expect(screen.getByText(/generate all four recommended looks/i)).toBeInTheDocument()
    expect(screen.getByText(/requires 4 credits/i)).toBeInTheDocument()
  })

  it('renders a locked premium preview when the report is not unlocked', () => {
    render(
      <FaceAnalysisResult
        task={makeTask({
          fullResult: null,
          reportUnlocked: false,
          lockedTeaser: {
            bestFrames: ['Round frames', 'Aviator frames'],
            framesToAvoid: ['Narrow rectangle'],
            catalogRecommendedStyles: ['round', 'aviator'],
          },
        })}
        onUnlock={jest.fn()}
      />
    )

    expect(screen.getByText('Unlock your complete report')).toBeInTheDocument()
    expect(screen.getByText('Preview: best frame directions')).toBeInTheDocument()
    expect(screen.getAllByText('Complete Your Personalized Frame Decision').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /unlock to download/i })).not.toBeInTheDocument()
  })

  it('keeps the locked result focused on unlocking personalized recommendations', () => {
    render(
      <FaceAnalysisResult
        task={makeTask({
          fullResult: null,
          reportUnlocked: false,
          lockedTeaser: {
            bestFrames: ['Round frames'],
            framesToAvoid: ['Narrow rectangle'],
            catalogRecommendedStyles: ['round'],
          },
        })}
        onUnlock={jest.fn()}
      />
    )

    expect(screen.queryByRole('link', { name: /try any frame instead/i })).not.toBeInTheDocument()
    expect(screen.getAllByText('Complete Your Personalized Frame Decision').length).toBeGreaterThan(0)
  })

  it('tracks the recommendation continuation before opening pricing', async () => {
    const trackPricing = jest.spyOn(analytics, 'trackFaceAnalysisTopPicksPricingClick')
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={2} />)

    const link = await screen.findByRole('link', { name: /continue with my top picks/i })
    link.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(link)

    expect(trackPricing).toHaveBeenCalledWith('task-1', 4, 'generate')
  })

  it('polls processing top picks at most once per seven-second cycle', async () => {
    jest.useFakeTimers()

    const processingTasks = Array.from({ length: 4 }, (_, index) => ({
      taskId: `try-on-${index + 1}`,
      status: 'processing' as const,
      resultImageUrl: null,
      errorMessage: null,
      preset: {
        id: `preset-${index + 1}`,
        name: `Preset ${index + 1}`,
        style: 'round',
      },
    }))

    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('/api/face-analysis/top-picks-try-on?')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: null }),
        }
      }
      if (url === '/api/face-analysis/top-picks-try-on') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              batchId: 'batch-1',
              requiredCredits: 4,
              creditsUsed: 0,
              tasks: processingTasks,
            },
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: 'processing',
            resultImageUrl: null,
            error: null,
          },
        }),
      }
    })
    global.fetch = fetchMock as jest.Mock

    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={5} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try top picks on your photo/i })).toBeEnabled()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /top picks/i }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const pollCalls = () =>
      fetchMock.mock.calls.filter(([input]) => String(input) === '/api/try-on/poll').length

    expect(pollCalls()).toBe(4)

    await act(async () => {
      jest.advanceTimersByTime(6999)
      await Promise.resolve()
    })
    expect(pollCalls()).toBe(4)

    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(pollCalls()).toBe(8)
  })

  it('recovers a completed batch into the in-page compare state without a generate button', async () => {
    const completedTasks = Array.from({ length: 4 }, (_, index) => ({
      taskId: `try-on-${index + 1}`,
      status: 'completed' as const,
      resultImageUrl: `https://example.com/result-${index + 1}.jpg`,
      errorMessage: null,
      preset: {
        id: `preset-${index + 1}`,
        name: `Preset ${index + 1}`,
        style: 'round',
      },
    }))
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          batchId: 'batch-complete',
          requiredCredits: 4,
          creditsUsed: 4,
          recovered: true,
          tasks: completedTasks,
        },
      }),
    })) as jest.Mock

    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={26} />)

    expect(await screen.findByText('Compare your top picks')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore more styles/i })).toHaveAttribute(
      'href',
      '/en/style-explorer?source=face-analysis&taskId=task-1',
    )
    expect(screen.queryByRole('button', { name: /try top picks/i })).not.toBeInTheDocument()
  })

  it('submits only the completion mode after a recovered partial batch', async () => {
    const partialTasks = Array.from({ length: 4 }, (_, index) => ({
      taskId: `try-on-${index + 1}`,
      status: index === 3 ? 'failed' as const : 'completed' as const,
      resultImageUrl: index === 3 ? null : `https://example.com/result-${index + 1}.jpg`,
      errorMessage: index === 3 ? 'Generation failed' : null,
      preset: {
        id: `preset-${index + 1}`,
        name: `Preset ${index + 1}`,
        style: 'round',
      },
    }))
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/face-analysis/top-picks-try-on?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              batchId: 'batch-partial',
              requiredCredits: 4,
              creditsUsed: 3,
              recovered: true,
              tasks: partialTasks,
            },
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({ success: true, data: { batchId: 'batch-partial', tasks: partialTasks } }),
      }
    })
    global.fetch = fetchMock as jest.Mock

    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={3} />)

    fireEvent.click(await screen.findByRole('button', { name: /complete your top picks/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([input]) => String(input) === '/api/face-analysis/top-picks-try-on')
      expect(postCall).toBeDefined()
      expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({ mode: 'complete' })
    })
  })
})

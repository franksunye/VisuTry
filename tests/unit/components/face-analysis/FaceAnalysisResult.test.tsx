import React from 'react'
import { render, screen } from '@testing-library/react'
import { FaceAnalysisResult } from '@/components/face-analysis/FaceAnalysisResult'
import { FaceAnalysisTaskResponse } from '@/types/face-analysis'
import { buildFullResult, parseFaceAnalysisContent } from '@/lib/face-analysis-parser'

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
    if (key === 'title') return 'Unlock Full AI Report'
    if (key === 'feature1') return 'Detailed recommendations'
    if (key === 'feature2') return 'Try-on credits included'
    if (key === 'feature3') return 'One-time unlock'
    if (key === 'price') return 'One-time price'
    if (key === 'button') return 'Unlock Now'
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
  it('renders the premium full report sections when unlocked', () => {
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
  })

  it('starts top picks generation when credits are available', () => {
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={5} />)

    expect(screen.getByRole('button', { name: /try top picks on your photo/i })).toBeEnabled()
    expect(screen.queryByText('5 credits')).not.toBeInTheDocument()
    expect(screen.queryByText(/failed generations are not charged/i)).not.toBeInTheDocument()
  })

  it('links top picks to pricing when credits are insufficient', () => {
    render(<FaceAnalysisResult task={makeTask()} onUnlock={jest.fn()} remainingCredits={2} />)

    const link = screen.getByRole('link', { name: /get credits to try top picks/i })
    expect(link).toHaveAttribute('href', '/en/pricing')
    expect(screen.queryByText(/You need/i)).not.toBeInTheDocument()
    expect(screen.queryByText('2 credits')).not.toBeInTheDocument()
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
    expect(screen.getAllByText('Unlock Full AI Report').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /unlock to download/i })).not.toBeInTheDocument()
  })
})

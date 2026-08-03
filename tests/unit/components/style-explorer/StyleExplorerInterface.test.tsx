import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StyleExplorerInterface } from '@/components/style-explorer/StyleExplorerInterface'
import { analytics } from '@/lib/analytics'

const updateSession = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { remainingTrials: 10 } },
    update: updateSession,
  }),
}))

jest.mock('@/components/OptimizedImage', () => ({
  __esModule: true,
  default: ({ alt = '' }: { alt?: string }) => <span aria-label={alt || undefined} />,
}))

describe('StyleExplorerInterface Face Analysis handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn().mockReturnValue('blob:restored-face-analysis-photo'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    })
    jest.spyOn(analytics, 'trackCustomEvent').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('restores the owned Face Analysis photo and enables generation', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/try-on/glasses/style-explorer/current') {
        return {
          ok: true,
          json: async () => ({ success: true, data: null }),
        } as Response
      }
      if (url === '/api/face-analysis/analysis-1/photo') {
        return {
          ok: true,
          blob: async () => new Blob(['photo'], { type: 'image/jpeg' }),
        } as Response
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }) as jest.Mock

    render(
      <StyleExplorerInterface
        initialRemainingCredits={10}
        faceAnalysisTaskId="analysis-1"
      />,
    )

    expect(screen.getByText('Loading your Face Analysis photo…')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Loaded from your Face Analysis')
    expect(screen.getByAltText('Uploaded your photo')).toHaveAttribute(
      'src',
      'blob:restored-face-analysis-photo',
    )
    expect(screen.getByRole('button', { name: 'Explore 4 Looks' })).toBeEnabled()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/face-analysis/analysis-1/photo',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove your photo' }))

    expect(screen.getByText('Click or drag to upload')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:restored-face-analysis-photo')
    expect((global.fetch as jest.Mock).mock.calls.filter(
      ([input]) => String(input) === '/api/face-analysis/analysis-1/photo',
    )).toHaveLength(1)
  })

  it('falls back to upload with a clear message when restoration fails', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/try-on/glasses/style-explorer/current') {
        return {
          ok: true,
          json: async () => ({ success: true, data: null }),
        } as Response
      }
      if (url === '/api/face-analysis/missing-analysis/photo') {
        return { ok: false, status: 404 } as Response
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }) as jest.Mock

    render(
      <StyleExplorerInterface
        initialRemainingCredits={10}
        faceAnalysisTaskId="missing-analysis"
      />,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't restore your Face Analysis photo. Please upload it again.",
    )
    expect(screen.getByRole('button', { name: 'Explore 4 Looks' })).toBeDisabled()
    expect(screen.getByText('Click or drag to upload')).toBeInTheDocument()
  })

  it('keeps the ordinary Style Explorer entry in its normal upload state', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/try-on/glasses/style-explorer/current') {
        return {
          ok: true,
          json: async () => ({ success: true, data: null }),
        } as Response
      }
      throw new Error(`Unexpected fetch: ${String(input)}`)
    }) as jest.Mock

    render(<StyleExplorerInterface initialRemainingCredits={10} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('Click or drag to upload')).toBeInTheDocument()
    expect(screen.queryByText(/Face Analysis photo/i)).not.toBeInTheDocument()
  })
})

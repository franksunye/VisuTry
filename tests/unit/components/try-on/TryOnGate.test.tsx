import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { TryOnGate } from '@/components/try-on/TryOnGate'

const mockUseSession = jest.fn()
const mockTryOnMounted = jest.fn()
const mockTryOnUnmounted = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('@/components/payments/AutoRefreshWrapper', () => ({
  AutoRefreshWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/payments/ConversionPaywallBoundary', () => ({
  ConversionPaywallBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/try-on/TryOnInterface', () => {
  const React = jest.requireActual<typeof import('react')>('react')

  return {
    TryOnInterface: function MockTryOnInterface() {
      const [hasResult, setHasResult] = React.useState(false)
      React.useEffect(() => {
        mockTryOnMounted()
        return () => mockTryOnUnmounted()
      }, [])

      return (
        <div>
          <button type="button" onClick={() => setHasResult(true)}>Complete mock generation</button>
          {hasResult && <div role="img" aria-label="Generated try-on result">/mock-result.png</div>}
        </div>
      )
    },
  }
})

const sessionWithCredits = (remainingTrials: number) => ({
  user: { id: 'synthetic-user', remainingTrials },
})

const renderGate = () => (
  <TryOnGate tryOnType="GLASSES" landing={<div>Public upload landing</div>} />
)

describe('TryOnGate session refresh safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the public landing on initial loading without a validated session', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    render(renderGate())

    expect(screen.getByText('Public upload landing')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Complete mock generation' })).not.toBeInTheDocument()
  })

  it('keeps a completed result mounted through NextAuth update() and quota exhaustion', () => {
    mockUseSession.mockReturnValue({ data: sessionWithCredits(1), status: 'authenticated' })
    const { rerender } = render(renderGate())

    fireEvent.click(screen.getByRole('button', { name: 'Complete mock generation' }))
    expect(screen.getByRole('img', { name: 'Generated try-on result' })).toBeInTheDocument()
    expect(mockTryOnMounted).toHaveBeenCalledTimes(1)

    // A successful generation calls update(); NextAuth can expose loading and
    // temporarily clear data before returning with one less free credit.
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    rerender(renderGate())
    expect(screen.getByRole('img', { name: 'Generated try-on result' })).toBeInTheDocument()
    expect(screen.queryByText('Public upload landing')).not.toBeInTheDocument()
    expect(mockTryOnUnmounted).not.toHaveBeenCalled()

    mockUseSession.mockReturnValue({ data: sessionWithCredits(0), status: 'authenticated' })
    rerender(renderGate())
    expect(screen.getByRole('img', { name: 'Generated try-on result' })).toBeInTheDocument()
    expect(screen.getByText('Continue your try-on')).toBeInTheDocument()
    expect(mockTryOnMounted).toHaveBeenCalledTimes(1)
    expect(mockTryOnUnmounted).not.toHaveBeenCalled()

    // Actual logout still fails closed and discards the previous user's UI.
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    rerender(renderGate())
    expect(screen.getByText('Public upload landing')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Generated try-on result' })).not.toBeInTheDocument()
    expect(mockTryOnUnmounted).toHaveBeenCalledTimes(1)

    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    rerender(renderGate())
    expect(screen.getByText('Public upload landing')).toBeInTheDocument()
  })
})

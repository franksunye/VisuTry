import React from 'react'
import { render, screen } from '@testing-library/react'
import { DetectorAdvisorContinuation } from '@/components/face-analysis/DetectorAdvisorContinuation'

let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/components/auth/LoginButton', () => ({
  LoginButton: ({
    label,
    preserveCurrentUrl,
    eventName,
    eventParameters,
  }: {
    label: string
    preserveCurrentUrl: boolean
    eventName: string
    eventParameters: { source: string }
  }) => (
    <button
      data-testid="contextual-login"
      data-preserve-url={String(preserveCurrentUrl)}
      data-event-name={eventName}
      data-event-source={eventParameters.source}
    >
      {label}
    </button>
  ),
}))

describe('DetectorAdvisorContinuation', () => {
  beforeEach(() => { mockSearchParams = new URLSearchParams() })

  it('keeps the detected shape and preserved callback URL visible for a qualified guest', () => {
    mockSearchParams = new URLSearchParams('source=free-face-shape-detector&faceShape=round&photoHandoff=test-photo')
    render(<DetectorAdvisorContinuation locale="en" fallback={<div>generic landing</div>} />)

    expect(screen.getByTestId('detector-advisor-continuation')).toBeInTheDocument()
    expect(screen.getByText(/Round face/)).toBeInTheDocument()
    expect(screen.getByText(/held temporarily in this browser/)).toBeInTheDocument()
    const login = screen.getByTestId('contextual-login')
    expect(login).toHaveAttribute('data-preserve-url', 'true')
    expect(login).toHaveAttribute('data-event-name', 'face_analysis_signin_click')
    expect(login).toHaveAttribute('data-event-source', 'detector_continuation')
    expect(screen.queryByText('generic landing')).not.toBeInTheDocument()
  })

  it('does not claim a saved photo when IndexedDB handoff was unavailable', () => {
    mockSearchParams = new URLSearchParams('source=free-face-shape-detector&faceShape=square')
    render(<DetectorAdvisorContinuation locale="en" fallback={<div>generic landing</div>} />)

    expect(screen.getByText(/select it again after sign-in/)).toBeInTheDocument()
    expect(screen.getByText(/Square face/)).toBeInTheDocument()
  })

  it.each([
    ['ordinary organic Advisor landing', ''],
    ['unknown campaign source', 'source=campaign&faceShape=oval'],
    ['malformed faceShape', 'source=free-face-shape-detector&faceShape=not-a-face-shape'],
  ])('preserves the SEO landing for %s', (_description, query) => {
    mockSearchParams = new URLSearchParams(query)
    render(<DetectorAdvisorContinuation locale="en" fallback={<div>generic landing</div>} />)

    expect(screen.getByText('generic landing')).toBeInTheDocument()
    expect(screen.queryByTestId('detector-advisor-continuation')).not.toBeInTheDocument()
  })

  it('leaves non-English routes unchanged until their localized treatment is validated', () => {
    mockSearchParams = new URLSearchParams('source=free-face-shape-detector&faceShape=oval')
    render(<DetectorAdvisorContinuation locale="es" fallback={<div>existing Spanish landing</div>} />)

    expect(screen.getByText('existing Spanish landing')).toBeInTheDocument()
    expect(screen.queryByTestId('detector-advisor-continuation')).not.toBeInTheDocument()
  })
})

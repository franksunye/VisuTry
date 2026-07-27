import React from 'react'
import { render, screen } from '@testing-library/react'
import { FaceAnalysisGate } from '@/components/face-analysis/FaceAnalysisGate'

let mockSessionState: {
  data: Record<string, unknown> | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

jest.mock('next-auth/react', () => ({
  useSession: () => mockSessionState,
}))

jest.mock('@/components/face-analysis/FaceAnalysisInterface', () => ({
  FaceAnalysisInterface: () => <div>authenticated face analysis</div>,
}))

describe('FaceAnalysisGate', () => {
  it('shows the static landing while the initial session is unresolved', () => {
    mockSessionState = { data: null, status: 'loading' }

    render(<FaceAnalysisGate landing={<div>static landing</div>} loadingText="Loading" />)

    expect(screen.getByText('static landing')).toBeInTheDocument()
    expect(screen.queryByText('authenticated face analysis')).not.toBeInTheDocument()
  })

  it('keeps the authenticated interface mounted during session.update()', () => {
    mockSessionState = {
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    }

    const { rerender } = render(
      <FaceAnalysisGate landing={<div>static landing</div>} loadingText="Loading" />
    )

    mockSessionState = {
      data: { user: { id: 'user-1' } },
      status: 'loading',
    }
    rerender(<FaceAnalysisGate landing={<div>static landing</div>} loadingText="Loading" />)

    expect(screen.getByText('authenticated face analysis')).toBeInTheDocument()
    expect(screen.queryByText('static landing')).not.toBeInTheDocument()
  })
})

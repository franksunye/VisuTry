import { render, screen } from '@testing-library/react'
import StyleExplorerPage, { dynamic } from '@/app/[locale]/(consumer-app)/style-explorer/page'
import { StyleExplorerHandoffGate } from '@/components/style-explorer/StyleExplorerHandoffGate'

let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
  setRequestLocale: jest.fn(),
}))

jest.mock('@/components/i18n/RouteMessagesProvider', () => ({
  RouteMessagesProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/style-explorer/StyleExplorerMarketing', () => ({
  StyleExplorerMarketing: ({ signInHref }: { signInHref: string }) => (
    <div data-testid="static-marketing" data-sign-in-href={signInHref} />
  ),
}))

jest.mock('@/components/style-explorer/StyleExplorerGate', () => ({
  StyleExplorerGate: ({
    signInHref,
    faceAnalysisTaskId,
  }: {
    signInHref: string
    faceAnalysisTaskId?: string | null
  }) => (
    <div
      data-testid="style-explorer-gate"
      data-sign-in-href={signInHref}
      data-face-analysis-task-id={faceAnalysisTaskId || ''}
    />
  ),
}))

describe('Style Explorer page handoff context', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
    window.history.replaceState(null, '', '/en/style-explorer')
  })

  it('renders a static route without request-specific search params', () => {
    expect(dynamic).toBe('force-static')
    render(StyleExplorerPage({ params: { locale: 'en' } }))
    expect(screen.getByTestId('style-explorer-gate')).toHaveAttribute(
      'data-sign-in-href',
      '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer',
    )
  })

  it('preserves the Face Analysis source through authentication', () => {
    mockSearchParams = new URLSearchParams('source=face-analysis&taskId=analysis-1')
    window.history.replaceState(null, '', '/en/style-explorer?source=face-analysis&taskId=analysis-1')
    render(<StyleExplorerHandoffGate locale="en" />)

    const gate = screen.getByTestId('style-explorer-gate')
    expect(gate).toHaveAttribute('data-face-analysis-task-id', 'analysis-1')
    expect(gate).toHaveAttribute(
      'data-sign-in-href',
      '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer%3Fsource%3Dface-analysis%26taskId%3Danalysis-1',
    )
  })

  it('does not treat an unrecognized source as a Face Analysis handoff', () => {
    mockSearchParams = new URLSearchParams('source=other&taskId=analysis-1')
    window.history.replaceState(null, '', '/en/style-explorer?source=other&taskId=analysis-1')
    render(<StyleExplorerHandoffGate locale="en" />)

    const gate = screen.getByTestId('style-explorer-gate')
    expect(gate).toHaveAttribute('data-face-analysis-task-id', '')
    expect(gate).toHaveAttribute(
      'data-sign-in-href',
      '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer',
    )
  })

  it('does not forward ambiguous duplicate task IDs', () => {
    mockSearchParams = new URLSearchParams('source=face-analysis&taskId=a&taskId=b')
    window.history.replaceState(null, '', '/en/style-explorer?source=face-analysis&taskId=a&taskId=b')
    render(<StyleExplorerHandoffGate locale="en" />)
    expect(screen.getByTestId('style-explorer-gate')).toHaveAttribute('data-face-analysis-task-id', '')
  })
})

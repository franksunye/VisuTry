import React from 'react'
import { render, screen } from '@testing-library/react'
import StyleExplorerPage from '@/app/[locale]/(main)/style-explorer/page'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
  setRequestLocale: jest.fn(),
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
  it('preserves the Face Analysis source through authentication', () => {
    render(StyleExplorerPage({
      params: { locale: 'en' },
      searchParams: { source: 'face-analysis', taskId: 'analysis-1' },
    }))

    const gate = screen.getByTestId('style-explorer-gate')
    expect(gate).toHaveAttribute('data-face-analysis-task-id', 'analysis-1')
    expect(gate).toHaveAttribute(
      'data-sign-in-href',
      '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer%3Fsource%3Dface-analysis%26taskId%3Danalysis-1',
    )
  })

  it('does not treat an unrecognized source as a Face Analysis handoff', () => {
    render(StyleExplorerPage({
      params: { locale: 'en' },
      searchParams: { source: 'other', taskId: 'analysis-1' },
    }))

    const gate = screen.getByTestId('style-explorer-gate')
    expect(gate).toHaveAttribute('data-face-analysis-task-id', '')
    expect(gate).toHaveAttribute(
      'data-sign-in-href',
      '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer',
    )
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import { buildTryOnSignInHref, TryOnStartLink } from '@/components/try-on/TryOnStartLink'

const mockUseSearchParams = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

describe('static Try-On landing handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  it('produces a stable static sign-in CTA without handoff parameters', () => {
    render(<TryOnStartLink locale="en" type="glasses" label="Start trying on" />)
    expect(screen.getByRole('link', { name: /Start trying on/ })).toHaveAttribute(
      'href',
      '/en/auth/signin?callbackUrl=%2Fen%2Ftry-on%2Fglasses',
    )
  })

  it('preserves only allowed query parameters through the sign-in callback', () => {
    const query = new URLSearchParams({
      source: 'free-face-shape-detector',
      faceShape: 'oval',
      photoHandoff: 'handoff-123',
      ignored: 'secret',
    })
    mockUseSearchParams.mockReturnValue(query)

    render(<TryOnStartLink locale="en" type="glasses" label="Start trying on" />)
    const href = screen.getByRole('link', { name: /Start trying on/ }).getAttribute('href')!
    const callback = new URL(href, 'https://www.visutry.com').searchParams.get('callbackUrl')

    expect(callback).toBe('/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-123')
    expect(callback).not.toContain('ignored')
  })

  it('retains encoding and does not allow custom query values to replace the callback path', () => {
    const href = buildTryOnSignInHref('fr', 'glasses', new URLSearchParams({
      source: 'promo & store',
      photoHandoff: 'https://other.example/try-on',
    }))
    const callback = new URL(href, 'https://www.visutry.com').searchParams.get('callbackUrl')
    expect(callback).toBe('/fr/try-on/glasses?source=promo+%26+store&photoHandoff=https%3A%2F%2Fother.example%2Ftry-on')
  })
})

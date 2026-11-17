import React from 'react'
import { render, screen } from '@testing-library/react'
import { ModelTryOnSlides } from '@/components/marketing/ModelTryOnSlides'

const mockUseSearchParams = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, prefetch: _prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === 'a11y.alt') return `${values?.name ?? 'Example'} using VisuTry`
    return key
  },
}))

describe('ModelTryOnSlides AEO disclosures', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams({
      source: 'free-face-shape-detector',
      faceShape: 'oval',
      photoHandoff: 'handoff-test',
      ignored: 'not-allowed',
    }))
    jest.spyOn(window, 'setInterval').mockImplementation(
      () => 1 as unknown as ReturnType<typeof window.setInterval>,
    )
    jest.spyOn(window, 'clearInterval').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the physical-fit limitation on the glasses landing experience', () => {
    render(<ModelTryOnSlides locale="en" mode="glasses" />)

    expect(screen.getByText(/Visual preview only/i)).toBeInTheDocument()
    expect(screen.getByText(/frame width, bridge width, temple length/i)).toBeInTheDocument()
  })

  it('does not add the limitation to the face-analysis showcase', () => {
    render(<ModelTryOnSlides locale="en" mode="face" />)

    expect(screen.queryByText(/Visual preview only/i)).not.toBeInTheDocument()
  })

  it('sends the public glasses hero CTA directly to secure sign-in with allowlisted handoff', () => {
    render(<ModelTryOnSlides locale="en" mode="glasses" signInOnGlassesStart />)
    const primary = screen.getByRole('link', { name: 'modes.glasses.ctaLabel' })
    const href = primary.getAttribute('href')!
    const target = new URL(href, 'https://www.visutry.com')
    expect(target.pathname).toBe('/en/auth/signin')
    const callback = target.searchParams.get('callbackUrl')
    expect(callback).toBe('/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test')
    expect(callback).not.toContain('ignored')
  })

  it('preserves the original CTA for other showcase modes and default opt-out', () => {
    const { rerender } = render(<ModelTryOnSlides locale="en" mode="home" signInOnGlassesStart />)
    expect(screen.getByRole('link', { name: 'modes.home.ctaLabel' })).toHaveAttribute('href', '/en/try-on/glasses')
    rerender(<ModelTryOnSlides locale="en" mode="glasses" />)
    expect(screen.getByRole('link', { name: 'modes.glasses.ctaLabel' })).toHaveAttribute('href', '/en/try-on/glasses')
  })
  it('falls back to the English disclosure for an unknown locale', () => {
    render(<ModelTryOnSlides locale="unknown" mode="glasses" />)

    expect(screen.getByText(/seller's return policy/i)).toBeInTheDocument()
  })
})

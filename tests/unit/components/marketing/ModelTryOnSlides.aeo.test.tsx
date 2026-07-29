import React from 'react'
import { render, screen } from '@testing-library/react'
import { ModelTryOnSlides } from '@/components/marketing/ModelTryOnSlides'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ''} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
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
    jest.spyOn(window, 'setInterval').mockImplementation(() => 1 as unknown as number)
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

  it('falls back to the English disclosure for an unknown locale', () => {
    render(<ModelTryOnSlides locale="unknown" mode="glasses" />)

    expect(screen.getByText(/seller's return policy/i)).toBeInTheDocument()
  })
})

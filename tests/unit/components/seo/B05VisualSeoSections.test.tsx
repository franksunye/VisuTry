import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { B05VisualSeoSections, B05_VISUAL_SEO_PAGES } from '@/components/seo/B05VisualSeoSections'
import { B05_VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <span role="img" aria-label={alt ?? ''} data-src={src} />
  ),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a>,
}))

describe('B05VisualSeoSections', () => {
  it.each(B05_VISUAL_SEO_PAGES.flatMap((pagePath) => (
    ['hero', 'compare', 'fit'] as const
  ).map((stage) => [pagePath, stage] as const)))('renders the %s %s asset in the shared owner layout', (pagePath, stage) => {
    const asset = B05_VISUAL_SEO_ASSETS.find((item) => item.pagePath === pagePath && item.stage === stage)
    expect(asset).toBeDefined()

    render(<B05VisualSeoSections locale="en" pagePath={pagePath} stage={stage} />)

    expect(screen.getByRole('heading', { level: 2, name: asset?.heading })).toHaveClass('sr-only')
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', asset?.alt)
  })
})

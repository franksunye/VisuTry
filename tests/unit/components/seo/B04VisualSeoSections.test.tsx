import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { B04VisualSeoSections, B04_VISUAL_SEO_PAGES } from '@/components/seo/B04VisualSeoSections'
import { B04_VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'
import { VisualSeoAsset } from '@/components/seo/VisualSeoAsset'

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

describe('B04VisualSeoSections', () => {
  it.each(B04_VISUAL_SEO_PAGES.flatMap((pagePath) => (
    ['hero', 'compare', 'fit'] as const
  ).map((stage) => [pagePath, stage] as const)))('keeps the %s %s heading semantic but visually hidden', (pagePath, stage) => {
    const asset = B04_VISUAL_SEO_ASSETS.find((item) => item.pagePath === pagePath && item.stage === stage)
    expect(asset).toBeDefined()

    render(<B04VisualSeoSections locale="en" pagePath={pagePath} stage={stage} />)

    const heading = screen.getByRole('heading', { level: 2, name: asset?.heading })
    expect(heading).toHaveClass('sr-only')
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', asset?.alt)
  })

  it('preserves the default visible heading behavior for the shared asset renderer', () => {
    const asset = B04_VISUAL_SEO_ASSETS[0]

    render(<VisualSeoAsset asset={asset} variant="owner-editorial" />)

    expect(screen.getByRole('heading', { level: 2, name: asset.heading })).not.toHaveClass('sr-only')
  })
})

import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { B06VisualSeoSections, B06_VISUAL_SEO_FACE_SHAPES } from '@/components/seo/B06VisualSeoSections'
import { B06_VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'

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

describe('B06VisualSeoSections', () => {
  it.each(B06_VISUAL_SEO_FACE_SHAPES.flatMap((faceShape) => (
    ['characteristics', 'identify'] as const
  ).map((stage) => [faceShape, stage] as const)))('renders the %s %s asset with a semantic hidden asset heading', (faceShape, stage) => {
    const asset = B06_VISUAL_SEO_ASSETS.find((item) => item.pagePath === `/face-shapes/${faceShape}` && item.stage === stage)
    expect(asset).toBeDefined()

    render(<B06VisualSeoSections locale="en" faceShape={faceShape} stage={stage} />)

    expect(screen.getByRole('heading', { level: 2, name: asset?.heading })).toHaveClass('sr-only')
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', asset?.alt)
    expect(screen.getByRole('heading', { level: 2, name: new RegExp(stage === 'characteristics' ? 'What defines' : 'How to identify') })).not.toHaveClass('sr-only')
  })

  it('does not render B06 assets outside English or for unsupported face shapes', () => {
    const { rerender } = render(<B06VisualSeoSections locale="id" faceShape="round" stage="characteristics" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    rerender(<B06VisualSeoSections locale="en" faceShape="triangle" stage="characteristics" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'
import { analytics } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackBlogFunnelClick: jest.fn(),
  },
}))

describe('FaceAnalysisFunnelCTA', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('routes the default funnel from the free detector into virtual try-on', () => {
    render(
      <FaceAnalysisFunnelCTA
        locale="en"
        sourcePage="/en/blog/test-guide"
        ctaLocation="article_midpoint"
      />,
    )

    expect(screen.getByRole('link', { name: /Detect my face shape/i })).toHaveAttribute(
      'href',
      '/en/face-shape-detector',
    )
    expect(screen.getByRole('link', { name: /Try on glasses/i })).toHaveAttribute(
      'href',
      '/en/try-on/glasses',
    )
  })

  it('supports a detector-to-advisor hero path and records both destinations', () => {
    render(
      <FaceAnalysisFunnelCTA
        locale="en"
        sourcePage="/en/blog/ai-face-analysis-for-glasses-guide"
        ctaLocation="article_hero"
        primaryLabel="Find my face shape — free"
        secondaryAction="advisor"
        secondaryLabel="Get my glasses advice"
      />,
    )

    const detectorLink = screen.getByRole('link', { name: /Find my face shape/i })
    const advisorLink = screen.getByRole('link', { name: /Get my glasses advice/i })

    expect(detectorLink).toHaveAttribute('href', '/en/face-shape-detector')
    expect(advisorLink).toHaveAttribute('href', '/en/face-analysis')

    fireEvent.click(detectorLink)
    fireEvent.click(advisorLink)

    expect(analytics.trackBlogFunnelClick).toHaveBeenNthCalledWith(1, {
      sourcePage: '/en/blog/ai-face-analysis-for-glasses-guide',
      destination: 'face_shape_detector',
      ctaLocation: 'article_hero',
      locale: 'en',
    })
    expect(analytics.trackBlogFunnelClick).toHaveBeenNthCalledWith(2, {
      sourcePage: '/en/blog/ai-face-analysis-for-glasses-guide',
      destination: 'face_analysis',
      ctaLocation: 'article_hero',
      locale: 'en',
    })
  })
})

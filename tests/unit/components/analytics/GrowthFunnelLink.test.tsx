import { fireEvent, render, screen } from '@testing-library/react'
import { analytics } from '@/lib/analytics'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackCustomEvent: jest.fn(),
  },
  setGrowthContext: jest.fn(),
}))

describe('GrowthFunnelLink', () => {
  it('records the source page, destination, CTA, and intent cluster', () => {
    const { setGrowthContext } = require('@/lib/analytics')

    render(
      <GrowthFunnelLink
        href="/en/face-shape-detector"
        sourcePage="glasses-for-face-shape"
        destination="face-shape-detector"
        ctaLocation="hero-primary"
        queryCluster="glasses-for-face-shape"
        contentCluster="search-tool"
        productPath="face_shape_detector"
      >
        Detect my face shape
      </GrowthFunnelLink>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Detect my face shape' }))

    expect(setGrowthContext).toHaveBeenCalledWith({
      query_cluster: 'glasses-for-face-shape',
      content_cluster: 'search-tool',
      product_path: 'face_shape_detector',
    })
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('seo_funnel_click', {
      source_page: 'glasses-for-face-shape',
      destination: 'face-shape-detector',
      cta_location: 'hero-primary',
      query_cluster: 'glasses-for-face-shape',
      content_cluster: 'search-tool',
      product_path: 'face_shape_detector',
    })
  })
})

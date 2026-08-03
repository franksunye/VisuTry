import { fireEvent, render, screen } from '@testing-library/react'
import { analytics, setGrowthContext } from '@/lib/analytics'
import { ProductContinuationCtas } from '@/components/growth/ProductContinuationCtas'

jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow" />,
  Glasses: () => <span data-testid="glasses" />,
  Grid2X2: () => <span data-testid="grid" />,
  ScanFace: () => <span data-testid="scan" />,
  Sparkles: () => <span data-testid="sparkles" />,
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackCustomEvent: jest.fn(),
  },
  setGrowthContext: jest.fn(),
}))

describe('ProductContinuationCtas', () => {
  it('exposes detector, try-on, and compare continuation paths', () => {
    render(
      <ProductContinuationCtas
        locale="en"
        sourcePage="glasses-for-face-shape"
        queryCluster="glasses-for-face-shape"
        contentCluster="search-tool"
      />,
    )

    expect(screen.getByRole('link', { name: /detect my face shape/i })).toHaveAttribute(
      'href',
      '/en/face-shape-detector',
    )
    expect(screen.getByRole('link', { name: /open virtual try-on/i })).toHaveAttribute(
      'href',
      '/en/try-on/glasses?source_page=glasses-for-face-shape',
    )
    expect(screen.getByRole('link', { name: /compare frames/i })).toHaveAttribute(
      'href',
      '/en/try-on/glasses/compare?source_page=glasses-for-face-shape',
    )
  })

  it('records internal source page, growth context, and funnel click for compare', () => {
    render(
      <ProductContinuationCtas
        locale="en"
        sourcePage="style/round-face"
        queryCluster="glasses-by-face-shape"
      />,
    )

    fireEvent.click(screen.getByRole('link', { name: /compare frames/i }))

    expect(setGrowthContext).toHaveBeenCalledWith(
      expect.objectContaining({
        source_page: 'style/round-face',
        query_cluster: 'glasses-by-face-shape',
        product_path: 'frame_compare',
      }),
    )
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith(
      'seo_funnel_click',
      expect.objectContaining({
        source_page: 'style/round-face',
        destination: 'frame-compare',
        product_path: 'frame_compare',
      }),
    )
  })
})

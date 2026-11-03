import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { BusinessHeader } from '@/components/business/BusinessHeader'
import { BusinessFooter } from '@/components/business/BusinessFooter'
import { analytics } from '@/lib/analytics'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...props }: React.PropsWithChildren<{ href: string; prefetch?: boolean }>) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en/business',
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackBusinessCtaClicked: jest.fn(),
    trackCustomEvent: jest.fn(),
  },
}))

describe('Business-site self-service and Pilot CTA measurement surfaces', () => {
  beforeEach(() => jest.clearAllMocks())

  it('distinguishes desktop and mobile header CTAs', () => {
    render(<BusinessHeader />)
    const links = screen.getAllByRole('link', { name: /Start Free/ })

    fireEvent.click(links[0])
    fireEvent.click(links[1])

    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(1, { locale: 'en', ctaLocation: 'business_header_desktop', intentType: 'self_service_start' })
    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(2, { locale: 'en', ctaLocation: 'business_header_mobile', intentType: 'self_service_start' })
  })

  it('measures footer self-service separately from the optional Pilot link', () => {
    render(<BusinessFooter />)
    fireEvent.click(screen.getByRole('link', { name: 'Start Free' }))
    fireEvent.click(screen.getByRole('link', { name: '30-Day Pilot' }))

    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(1, { locale: 'en', ctaLocation: 'business_footer', intentType: 'self_service_start' })
    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(2, { locale: 'en', ctaLocation: 'business_footer', intentType: 'pilot_request' })
  })
})

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'

const trackCustomEvent = jest.fn()
const updateSession = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        remainingTrials: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
      },
    },
    update: updateSession,
  }),
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackCustomEvent: (...args: unknown[]) => trackCustomEvent(...args),
  },
  getAcquisitionContext: () => ({
    landing_page: '/en/try-on/glasses',
    page_path: '/en/try-on/glasses',
    landing_locale: 'en',
  }),
}))

describe('ConversionPaywallBoundary', () => {
  beforeEach(() => {
    trackCustomEvent.mockClear()
    updateSession.mockClear()
  })

  it('intercepts a pricing CTA and presents the one-time credits pack first', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Keep trying' })).toBeInTheDocument()
    expect(screen.getByText('30 Decision Credits')).toBeInTheDocument()
    expect(screen.getByText('$2.99')).toBeInTheDocument()
    expect(screen.getByText('One-time purchase')).toBeInTheDocument()
    expect(screen.getByText('No subscription')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View subscription plans/ })).toHaveAttribute('href', '/en/pricing')

    expect(trackCustomEvent).toHaveBeenCalledWith(
      'paywall_view',
      expect.objectContaining({
        source: 'try_on',
        product_type: 'CREDITS_PACK',
        credits_count: 30,
        price: 2.99,
      }),
    )
  })

  it('uses comparison-specific copy for Frame Compare', () => {
    render(
      <ConversionPaywallBoundary source="frame_compare">
        <a href="/en/pricing">Get credits</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get credits' }))

    expect(screen.getByRole('heading', { name: 'Keep comparing your options' })).toBeInTheDocument()
    expect(screen.getByText('Compare more frames')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
  })

  it('does not intercept unrelated links', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/dashboard">Dashboard</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trackCustomEvent).not.toHaveBeenCalledWith('paywall_view', expect.anything())
  })
})

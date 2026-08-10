import { render, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { analytics } from '@/lib/analytics'
import { PaymentConversionTracker } from '@/components/analytics/PaymentConversionTracker'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackPurchase: jest.fn(),
    trackCheckoutCancelled: jest.fn(),
  },
}))

const mockUseSession = useSession as jest.Mock
const mockTrackPurchase = analytics.trackPurchase as jest.Mock
const mockTrackCheckoutCancelled = analytics.trackCheckoutCancelled as jest.Mock

describe('PaymentConversionTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.dataLayer = []
    window.history.pushState({}, '', '/en/dashboard?payment=success&session_id=cs_test_123')
    mockUseSession.mockReturnValue({ status: 'authenticated' })
  })

  it('tracks a server-verified completed payment once', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'completed',
        data: {
          transactionId: 'cs_test_123',
          productType: 'CREDITS_PACK',
          value: 2.99,
          currency: 'USD',
          attribution: {
            landing_page: '/en/face-shape-detector',
            acquisition_source: 'google.com',
            acquisition_medium: 'organic',
            source_page: '/what-glasses-suit-my-face',
          },
        },
      }),
    } as Response)

    render(<PaymentConversionTracker />)

    await waitFor(() => {
      expect(mockTrackPurchase).toHaveBeenCalledWith(
        'cs_test_123',
        'CREDITS_PACK',
        2.99,
        {
          landing_page: '/en/face-shape-detector',
          acquisition_source: 'google.com',
          acquisition_medium: 'organic',
          source_page: '/what-glasses-suit-my-face',
        },
      )
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/payment/conversion?session_id=cs_test_123',
      { cache: 'no-store' },
    )
    expect(window.localStorage.getItem('visutry_purchase_tracked:cs_test_123')).toBeTruthy()
  })

  it('does nothing without a checkout session ID', () => {
    window.history.pushState({}, '', '/en/dashboard')
    global.fetch = jest.fn()

    render(<PaymentConversionTracker />)

    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockTrackPurchase).not.toHaveBeenCalled()
  })

  it('tracks a checkout cancellation once per return', () => {
    window.history.pushState(
      {},
      '',
      '/en/pricing?payment=cancelled&checkout_product=CREDITS_PACK&checkout_value=2.99',
    )
    global.fetch = jest.fn()

    const firstRender = render(<PaymentConversionTracker />)

    expect(mockTrackCheckoutCancelled).toHaveBeenCalledWith('CREDITS_PACK', 2.99)
    firstRender.unmount()

    render(<PaymentConversionTracker />)
    expect(mockTrackCheckoutCancelled).toHaveBeenCalledTimes(1)
  })
})

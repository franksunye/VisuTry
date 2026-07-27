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
  },
}))

const mockUseSession = useSession as jest.Mock
const mockTrackPurchase = analytics.trackPurchase as jest.Mock

describe('PaymentConversionTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
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
        },
      }),
    } as Response)

    render(<PaymentConversionTracker />)

    await waitFor(() => {
      expect(mockTrackPurchase).toHaveBeenCalledWith(
        'cs_test_123',
        'CREDITS_PACK',
        2.99,
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
})

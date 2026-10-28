import { render, screen, waitFor } from '@testing-library/react'
import { PaymentSuccessHandler } from '@/components/dashboard/PaymentSuccessHandler'

const mockUpdate = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))
jest.mock('next-auth/react', () => ({
  useSession: () => ({ update: mockUpdate }),
}))
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}))

describe('Premium checkout Dashboard return', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.set('payment', 'success')
    mockSearchParams.set('session_id', 'cs_test_premium')
    mockSearchParams.set('checkout_product', 'PREMIUM_MONTHLY')
    mockUpdate.mockResolvedValue(undefined)
  })

  afterEach(() => {
    global.fetch = originalFetch
    mockSearchParams.delete('payment')
    mockSearchParams.delete('session_id')
    mockSearchParams.delete('checkout_product')
  })

  it('accepts an authoritative Premium balance without waiting for Credits to increment', async () => {
    const onBalanceReady = jest.fn()
    const balance = {
      creditsPurchased: 0, creditsUsed: 0, freeTrialsUsed: 3,
      premiumUsageCount: 0, isPremiumActive: true,
      currentSubscriptionType: 'PREMIUM_MONTHLY',
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, data: balance }),
    }) as jest.Mock

    render(<PaymentSuccessHandler onBalanceReady={onBalanceReady} />)

    expect(await screen.findByText('Subscription activated')).toBeInTheDocument()
    expect(onBalanceReady).toHaveBeenCalledWith(balance)
    expect(global.fetch).toHaveBeenCalledWith('/api/user/balance', { cache: 'no-store' })
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
  })

  it('does not show activation after a session expires during checkout', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false }) as jest.Mock
    const onBalanceReady = jest.fn()

    render(<PaymentSuccessHandler onBalanceReady={onBalanceReady} />)

    expect(await screen.findByText('Sign in to continue')).toBeInTheDocument()
    expect(screen.queryByText('Subscription activated')).not.toBeInTheDocument()
    expect(onBalanceReady).not.toHaveBeenCalled()
  })
})

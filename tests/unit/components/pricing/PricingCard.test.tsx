import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingCard } from '@/components/pricing/PricingCard'
import { createMerchantContinuation, getMerchantContinuationFromUrl, merchantPricingPath } from '@/modules/store/domain/merchant-continuation'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        remainingTrials: 3,
        isPremiumActive: false,
      },
    },
    status: 'authenticated',
  }),
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackClickPurchase: jest.fn(),
    trackBeginCheckout: jest.fn(),
  },
  getCheckoutAttribution: () => ({
    landing_page: '/en/pricing',
    page_path: '/en/pricing',
    landing_locale: 'en',
    site_locale: 'en',
    pricing_locale: 'en',
    checkout_locale: 'en',
  }),
  getUserType: () => 'free',
}))

jest.mock('@/hooks/useQuota', () => ({
  useQuota: () => ({
    userType: 'free',
    remainingTrials: 3,
    isPremiumActive: false,
    isAuthenticated: true,
  }),
}))

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock alert
const mockAlert = jest.fn()
global.alert = mockAlert

describe('PricingCard', () => {
  const user = userEvent.setup()
  let consoleErrorSpy: jest.SpyInstance

  const mockPlan = {
    id: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    description: 'Best for regular users',
    price: '$9.99',
    period: 'month',
    originalPrice: '$11.99',
    features: [
      'Unlimited try-ons',
      'HD quality results',
      'Priority support',
      'Advanced filters'
    ],
    buttonText: 'Start Premium',
    popular: true,
    icon: <div data-testid="plan-icon">Icon</div>
  }

  const mockUser = {
    id: 'user-1',
    isPremiumActive: false,
    remainingTrials: 3
  }

  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/en/pricing')
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const firstArg = args[0]

      if (
        firstArg instanceof Error &&
        firstArg.message.includes('Not implemented: navigation')
      ) {
        return
      }

      if (
        typeof firstArg === 'string' &&
        (firstArg.includes('Payment failed:') || firstArg.includes('Error: Not implemented: navigation'))
      ) {
        return
      }
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { url: 'https://checkout.stripe.com/session123' }
      })
    } as Response)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Basic Rendering', () => {
    it('should render plan information correctly', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('Premium Monthly')).toBeInTheDocument()
      expect(screen.getByText('Best for regular users')).toBeInTheDocument()
      expect(screen.getByText('$9.99')).toBeInTheDocument()
      expect(screen.getByText('/ month')).toBeInTheDocument()
      expect(screen.getByTestId('plan-icon')).toBeInTheDocument()
    })

    it('should render all features with check icons', () => {
      const { container } = render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('Unlimited try-ons')).toBeInTheDocument()
      expect(screen.getByText('HD quality results')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
      expect(screen.getByText('Advanced filters')).toBeInTheDocument()
      
      const checkIcons = container.querySelectorAll('.text-green-500')
      expect(checkIcons).toHaveLength(4)
    })

    it('should render button with correct text', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Popular Plan Styling', () => {
    it('should show popular badge for popular plans', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })

    it('should apply popular styling without layout scaling', () => {
      const { container } = render(<PricingCard plan={mockPlan} currentUser={mockUser} />)
      const card = container.firstChild
      expect(card).toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200', 'z-10')
      expect(card).not.toHaveClass('scale-105')
    })

    it('should not show popular badge for non-popular plans', () => {
      const nonPopularPlan = { ...mockPlan, popular: false }
      render(<PricingCard plan={nonPopularPlan} currentUser={mockUser} />)

      expect(screen.queryByText('Most Popular')).not.toBeInTheDocument()
    })
  })

  describe('Pricing Display', () => {
    it('should show original price and savings when available', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('$11.99')).toBeInTheDocument()
      expect(screen.getByText('Save 17%')).toBeInTheDocument()
    })

    it('should not show original price when not provided', () => {
      const planWithoutOriginalPrice = { ...mockPlan, originalPrice: undefined }
      render(<PricingCard plan={planWithoutOriginalPrice} currentUser={mockUser} />)

      expect(screen.queryByText('Save 17%')).not.toBeInTheDocument()
    })
  })

  describe('Payment Flow', () => {
    it('should create payment session when button is clicked', async () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payment/create-session',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )

      const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit
      const body = JSON.parse(String(requestInit.body))
      expect(body).toMatchObject({
        productType: 'PREMIUM_MONTHLY',
        successUrl: `${window.location.origin}/en/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/en/pricing?payment=cancelled&checkout_product=PREMIUM_MONTHLY&checkout_value=9.99`,
        locale: 'en',
      })
      expect(body.attribution).toEqual(
        expect.objectContaining({
          landing_page: expect.any(String),
          page_path: expect.any(String),
        }),
      )
    })

    it('preserves the Face Analysis report context on the full Pricing page', async () => {
      window.history.replaceState(
        {},
        '',
        '/en/pricing?source=face-analysis-unlock&taskId=analysis-1',
      )
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK', buttonText: 'Buy Credits Pack' }

      render(<PricingCard plan={creditsPlan} currentUser={mockUser} />)
      await user.click(screen.getByRole('button', { name: 'Buy Credits Pack' }))

      const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit
      const body = JSON.parse(String(requestInit.body))
      expect(body).toMatchObject({
        productType: 'CREDITS_PACK',
        unlockTaskId: 'analysis-1',
        successUrl: `${window.location.origin}/en/face-analysis?unlock=success&taskId=analysis-1&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/en/pricing?source=face-analysis-unlock&taskId=analysis-1&payment=cancelled&checkout_product=CREDITS_PACK&checkout_value=9.99`,
      })
    })

    it('preserves Merchant Store continuation for success and cancel Checkout URLs', async () => {
      const continuation = createMerchantContinuation({
        locale: 'en',
        merchantSlug: 'ello-sunglasses',
        experienceType: 'STORE',
      })!
      window.history.replaceState(
        {},
        '',
        merchantPricingPath(continuation),
      )
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK', buttonText: 'Buy Credits Pack' }

      render(<PricingCard plan={creditsPlan} currentUser={mockUser} />)
      await user.click(screen.getByRole('button', { name: 'Buy Credits Pack' }))

      const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit
      const body = JSON.parse(String(requestInit.body))
      const successUrl = new URL(body.successUrl)
      const cancelUrl = new URL(body.cancelUrl)

      expect(successUrl.pathname).toBe('/en/success')
      expect(successUrl.searchParams.get('merchantContinuation')).not.toBeNull()
      expect(cancelUrl.pathname).toBe('/en/pricing')
      expect(cancelUrl.searchParams.get('merchantContinuation')).not.toBeNull()
      expect(cancelUrl.searchParams.get('payment')).toBe('cancelled')
      expect(cancelUrl.searchParams.get('checkout_product')).toBe('CREDITS_PACK')
      expect(cancelUrl.searchParams.get('checkout_value')).toBe('9.99')
      expect(getMerchantContinuationFromUrl(`${successUrl.pathname}${successUrl.search}`)).toEqual(continuation)
      expect(successUrl.searchParams.get('session_id')).toBe('{CHECKOUT_SESSION_ID}')
    })

    it.each([
      ['PREMIUM_MONTHLY', 'Start Premium'],
      ['PREMIUM_YEARLY', 'Start Premium'],
    ])('preserves the report context for %s purchases', async (productId, buttonText) => {
      window.history.replaceState(
        {},
        '',
        '/en/pricing?source=face-analysis-unlock&taskId=analysis-1',
      )
      const plan = { ...mockPlan, id: productId, buttonText }

      render(<PricingCard plan={plan} currentUser={mockUser} />)
      await user.click(screen.getByRole('button', { name: buttonText }))

      const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit
      const body = JSON.parse(String(requestInit.body))
      expect(body).toMatchObject({
        productType: productId,
        unlockTaskId: 'analysis-1',
        successUrl: `${window.location.origin}/en/face-analysis?unlock=success&taskId=analysis-1&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: expect.stringContaining('source=face-analysis-unlock&taskId=analysis-1'),
      })
    })

    it('should redirect to Stripe checkout on successful payment session creation', async () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
        expect(mockAlert).not.toHaveBeenCalled()
      })
    })

    it('should show loading state during payment processing', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { url: 'https://checkout.stripe.com/session123' }
          })
        } as Response), 100)
      ))

      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('should handle payment session creation failure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Payment session creation failed'
        })
      } as Response)

      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Payment failed, please try again')
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Payment failed, please try again')
      })
    })
  })

  describe('Current Plan State', () => {
    it('should show "Current Plan" for active premium monthly users', () => {
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={mockPlan} currentUser={premiumUser} />)

      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show "Current Plan" for active premium yearly users', () => {
      const yearlyPlan = { ...mockPlan, id: 'PREMIUM_YEARLY' }
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={yearlyPlan} currentUser={premiumUser} />)

      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should not show current plan state for non-premium plans', () => {
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK' }
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={creditsPlan} currentUser={premiumUser} />)

      expect(screen.queryByText('Current Plan')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('Plan-specific Information', () => {
    it('should explain credit lifetime separately from data retention', () => {
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK' }
      render(<PricingCard plan={creditsPlan} currentUser={mockUser} />)

      expect(
        screen.getByText(
          "Purchased credits do not expire. Images and generated results follow the plan's data-retention period.",
        ),
      ).toBeInTheDocument()
    })

    it('should show premium plan cancellation info', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('Cancel anytime, no long-term contract')).toBeInTheDocument()
    })

    it('should show yearly plan cancellation info', () => {
      const yearlyPlan = { ...mockPlan, id: 'PREMIUM_YEARLY' }
      render(<PricingCard plan={yearlyPlan} currentUser={mockUser} />)

      expect(screen.getByText('Cancel anytime, no long-term contract')).toBeInTheDocument()
    })

    it('should not show plan-specific info for other plans', () => {
      const otherPlan = { ...mockPlan, id: 'OTHER_PLAN' }
      render(<PricingCard plan={otherPlan} currentUser={mockUser} />)

      expect(screen.queryByText(/Purchased credits do not expire/)).not.toBeInTheDocument()
      expect(screen.queryByText('Cancel anytime, no long-term contract')).not.toBeInTheDocument()
    })
  })

  describe('Button Styling', () => {
    it('should apply popular plan button styling', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700')
    })

    it('should apply non-popular plan button styling', () => {
      const nonPopularPlan = { ...mockPlan, popular: false }
      render(<PricingCard plan={nonPopularPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-900', 'text-white', 'hover:bg-gray-800')
    })

    it('should apply disabled styling when button is disabled', () => {
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={mockPlan} currentUser={premiumUser} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:cursor-not-allowed')
      expect(button).toBeDisabled()
    })
  })
})

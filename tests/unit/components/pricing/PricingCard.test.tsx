import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingCard } from '@/components/pricing/PricingCard'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />
}))

// Mock window.location
delete (window as any).location
window.location = {
  ...window.location,
  origin: 'http://localhost:3000',
  href: ''
} as any

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock alert
const mockAlert = jest.fn()
global.alert = mockAlert

describe('PricingCard', () => {
  const user = userEvent.setup()

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
    window.location.href = ''
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { url: 'https://checkout.stripe.com/session123' }
      })
    } as Response)
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
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('Unlimited try-ons')).toBeInTheDocument()
      expect(screen.getByText('HD quality results')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
      expect(screen.getByText('Advanced filters')).toBeInTheDocument()
      
      const checkIcons = screen.getAllByTestId('check-icon')
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

      expect(screen.getByText('最受欢迎')).toBeInTheDocument()
    })

    it('should apply popular styling', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const card = screen.getByText('Premium Monthly').closest('div')?.parentElement
      expect(card).toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200', 'scale-105')
    })

    it('should not show popular badge for non-popular plans', () => {
      const nonPopularPlan = { ...mockPlan, popular: false }
      render(<PricingCard plan={nonPopularPlan} currentUser={mockUser} />)

      expect(screen.queryByText('最受欢迎')).not.toBeInTheDocument()
    })
  })

  describe('Pricing Display', () => {
    it('should show original price and savings when available', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('$11.99')).toBeInTheDocument()
      expect(screen.getByText('节省17%')).toBeInTheDocument()
    })

    it('should not show original price when not provided', () => {
      const planWithoutOriginalPrice = { ...mockPlan, originalPrice: undefined }
      render(<PricingCard plan={planWithoutOriginalPrice} currentUser={mockUser} />)

      expect(screen.queryByText('节省17%')).not.toBeInTheDocument()
    })
  })

  describe('Payment Flow', () => {
    it('should create payment session when button is clicked', async () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      expect(mockFetch).toHaveBeenCalledWith('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productType: 'PREMIUM_MONTHLY',
          successUrl: 'http://localhost:3000/dashboard?payment=success',
          cancelUrl: 'http://localhost:3000/pricing?payment=cancelled'
        })
      })
    })

    it('should redirect to Stripe checkout on successful payment session creation', async () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/session123')
      })
    })

    it('should show loading state during payment processing', async () => {
      // Make fetch take some time
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

      expect(screen.getByText('处理中...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(button).toBeDisabled()

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/session123')
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
        expect(mockAlert).toHaveBeenCalledWith('支付失败，请重试')
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      const button = screen.getByRole('button', { name: 'Start Premium' })
      await user.click(button)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('支付失败，请重试')
      })
    })
  })

  describe('Current Plan State', () => {
    it('should show "当前套餐" for active premium monthly users', () => {
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={mockPlan} currentUser={premiumUser} />)

      expect(screen.getByText('当前套餐')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show "当前套餐" for active premium yearly users', () => {
      const yearlyPlan = { ...mockPlan, id: 'PREMIUM_YEARLY' }
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={yearlyPlan} currentUser={premiumUser} />)

      expect(screen.getByText('当前套餐')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should not show current plan state for non-premium plans', () => {
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK' }
      const premiumUser = { ...mockUser, isPremiumActive: true }
      render(<PricingCard plan={creditsPlan} currentUser={premiumUser} />)

      expect(screen.queryByText('当前套餐')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('Plan-specific Information', () => {
    it('should show credits pack information', () => {
      const creditsPlan = { ...mockPlan, id: 'CREDITS_PACK' }
      render(<PricingCard plan={creditsPlan} currentUser={mockUser} />)

      expect(screen.getByText('次数包永不过期，可随时使用')).toBeInTheDocument()
    })

    it('should show premium plan cancellation info', () => {
      render(<PricingCard plan={mockPlan} currentUser={mockUser} />)

      expect(screen.getByText('可随时取消，无长期合约')).toBeInTheDocument()
    })

    it('should show yearly plan cancellation info', () => {
      const yearlyPlan = { ...mockPlan, id: 'PREMIUM_YEARLY' }
      render(<PricingCard plan={yearlyPlan} currentUser={mockUser} />)

      expect(screen.getByText('可随时取消，无长期合约')).toBeInTheDocument()
    })

    it('should not show plan-specific info for other plans', () => {
      const otherPlan = { ...mockPlan, id: 'OTHER_PLAN' }
      render(<PricingCard plan={otherPlan} currentUser={mockUser} />)

      expect(screen.queryByText('次数包永不过期，可随时使用')).not.toBeInTheDocument()
      expect(screen.queryByText('可随时取消，无长期合约')).not.toBeInTheDocument()
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

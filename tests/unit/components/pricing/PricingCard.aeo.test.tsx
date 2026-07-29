import React from 'react'
import { render, screen } from '@testing-library/react'
import { PricingCard } from '@/components/pricing/PricingCard'

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('@/hooks/useQuota', () => ({
  useQuota: () => ({ userType: 'anonymous' }),
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackClickPurchase: jest.fn(),
    trackBeginCheckout: jest.fn(),
  },
}))

jest.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => <span className={className} />,
  Loader2: ({ className }: { className?: string }) => <span className={className} />,
}))

const basePlan = {
  name: 'Plan',
  description: 'Plan description',
  price: '$2.99',
  period: 'one-time',
  features: ['Feature'],
  buttonText: 'Continue',
  popular: false,
  icon: <span />,
}

describe('PricingCard AEO copy', () => {
  it('describes a credits pack as a purchase for signed-out users', () => {
    render(
      <PricingCard
        plan={{ ...basePlan, id: 'CREDITS_PACK' }}
        currentUser={null}
      />,
    )

    expect(screen.getByRole('button', { name: 'Sign in to buy credits' })).toBeInTheDocument()
    expect(
      screen.getByText(
        "Purchased credits do not expire. Images and generated results follow the plan's data-retention period.",
      ),
    ).toBeInTheDocument()
  })

  it('uses subscription language only for recurring plans', () => {
    render(
      <PricingCard
        plan={{ ...basePlan, id: 'PREMIUM_MONTHLY', period: 'month' }}
        currentUser={null}
      />,
    )

    expect(screen.getByRole('button', { name: 'Sign in to subscribe' })).toBeInTheDocument()
  })

  it('treats the promotional credits pack as a one-time purchase', () => {
    render(
      <PricingCard
        plan={{ ...basePlan, id: 'CREDITS_PACK_PROMO_60' }}
        currentUser={null}
      />,
    )

    expect(screen.getByRole('button', { name: 'Sign in to buy credits' })).toBeInTheDocument()
  })
})

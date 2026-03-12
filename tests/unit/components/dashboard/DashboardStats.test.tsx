import React from 'react'
import { render, screen } from '@testing-library/react'

import { DashboardStats } from '@/components/dashboard/DashboardStats'

describe('DashboardStats', () => {
  it('renders the three stat cards with the provided values', () => {
    render(
      <DashboardStats
        stats={{
          totalTryOns: 15,
          completedTryOns: 12,
          remainingDisplay: 3,
          remainingDescription: 'Free Quota',
          isPremium: false,
        }}
      />
    )

    expect(screen.getByText('Total Try-Ons')).toBeInTheDocument()
    expect(screen.getByText('Successful Try-Ons')).toBeInTheDocument()
    expect(screen.getByText('Remaining Uses')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders the current remaining description instead of hard-coded quota text', () => {
    render(
      <DashboardStats
        stats={{
          totalTryOns: 50,
          completedTryOns: 45,
          remainingDisplay: '30+/month',
          remainingDescription: 'Premium monthly allowance',
          isPremium: true,
          subscriptionType: 'STANDARD',
        }}
      />
    )

    expect(screen.getByText('30+/month')).toBeInTheDocument()
    expect(screen.getByText('Premium monthly allowance')).toBeInTheDocument()
  })

  it('keeps the expected layout and icon styling hooks', () => {
    const { container } = render(
      <DashboardStats
        stats={{
          totalTryOns: 10,
          completedTryOns: 8,
          remainingDisplay: 5,
          remainingDescription: 'Free Quota',
          isPremium: false,
        }}
      />
    )

    expect(container.firstChild).toHaveClass('grid', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument()
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
    expect(container.querySelector('.text-orange-600')).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Glasses: ({ className }: { className?: string }) => <div data-testid="glasses-icon" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />
}))

describe('DashboardStats', () => {
  describe('Free User Stats', () => {
    const freeUserStats = {
      totalTryOns: 15,
      completedTryOns: 12,
      remainingTrials: 3,
      isPremium: false
    }

    it('should render all stat cards for free users', () => {
      render(<DashboardStats stats={freeUserStats} />)

      // Check all titles are present
      expect(screen.getByText('Total Try-Ons')).toBeInTheDocument()
      expect(screen.getByText('Successful Try-Ons')).toBeInTheDocument()
      expect(screen.getByText('Remaining Uses')).toBeInTheDocument()

      // Check all icons are present
      expect(screen.getByTestId('glasses-icon')).toBeInTheDocument()
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    })

    it('should display correct values for free users', () => {
      render(<DashboardStats stats={freeUserStats} />)

      expect(screen.getByText('15')).toBeInTheDocument() // totalTryOns
      expect(screen.getByText('12')).toBeInTheDocument() // completedTryOns
      expect(screen.getByText('3')).toBeInTheDocument() // remainingTrials
    })

    it('should display correct descriptions for free users', () => {
      render(<DashboardStats stats={freeUserStats} />)

      expect(screen.getByText('Cumulative usage count')).toBeInTheDocument()
      expect(screen.getByText('Completed try-ons')).toBeInTheDocument()
      expect(screen.getByText('Free Quota')).toBeInTheDocument()
    })

    it('should apply correct icon colors for free users', () => {
      render(<DashboardStats stats={freeUserStats} />)

      expect(screen.getByTestId('glasses-icon')).toHaveClass('text-blue-600')
      expect(screen.getByTestId('check-circle-icon')).toHaveClass('text-green-600')
      expect(screen.getByTestId('clock-icon')).toHaveClass('text-orange-600')
    })
  })

  describe('Premium User Stats', () => {
    const premiumUserStats = {
      totalTryOns: 50,
      completedTryOns: 45,
      remainingTrials: 0, // This should be ignored for premium users
      isPremium: true
    }

    it('should render all stat cards for premium users', () => {
      render(<DashboardStats stats={premiumUserStats} />)

      expect(screen.getByText('Total Try-Ons')).toBeInTheDocument()
      expect(screen.getByText('Successful Try-Ons')).toBeInTheDocument()
      expect(screen.getByText('Remaining Uses')).toBeInTheDocument()
    })

    it('should display correct values for premium users', () => {
      render(<DashboardStats stats={premiumUserStats} />)

      expect(screen.getByText('50')).toBeInTheDocument() // totalTryOns
      expect(screen.getByText('45')).toBeInTheDocument() // completedTryOns
      expect(screen.getByText('30+/month')).toBeInTheDocument() // remainingTrials should show "30+/month"
    })

    it('should display correct descriptions for premium users', () => {
      render(<DashboardStats stats={premiumUserStats} />)

      expect(screen.getByText('Cumulative usage count')).toBeInTheDocument()
      expect(screen.getByText('Completed try-ons')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const zeroStats = {
        totalTryOns: 0,
        completedTryOns: 0,
        remainingTrials: 0,
        isPremium: false
      }

      render(<DashboardStats stats={zeroStats} />)

      // Should display zeros
      const zeroElements = screen.getAllByText('0')
      expect(zeroElements).toHaveLength(3) // totalTryOns, completedTryOns, remainingTrials
    })

    it('should handle large numbers correctly', () => {
      const largeStats = {
        totalTryOns: 9999,
        completedTryOns: 8888,
        remainingTrials: 100,
        isPremium: false
      }

      render(<DashboardStats stats={largeStats} />)

      expect(screen.getByText('9999')).toBeInTheDocument()
      expect(screen.getByText('8888')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should handle premium user with high usage', () => {
      const highUsagePremiumStats = {
        totalTryOns: 1000,
        completedTryOns: 950,
        remainingTrials: 999, // Should be ignored
        isPremium: true
      }

      render(<DashboardStats stats={highUsagePremiumStats} />)

      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('950')).toBeInTheDocument()
      expect(screen.getByText('30+/month')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should render cards in a grid layout', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      const gridContainer = screen.getByText('Total Try-Ons').closest('.grid')
      expect(gridContainer).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')
    })

    it('should render exactly 3 stat cards', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      const cards = screen.getAllByRole('generic').filter(el =>
        el.className.includes('bg-white rounded-xl shadow-sm border p-6')
      )
      expect(cards).toHaveLength(3)
    })

    it('should apply correct background colors to icon containers', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      // Find icon containers by their background colors
      const blueContainer = screen.getByTestId('glasses-icon').closest('.bg-blue-100')
      const greenContainer = screen.getByTestId('check-circle-icon').closest('.bg-green-100')
      const orangeContainer = screen.getByTestId('clock-icon').closest('.bg-orange-100')

      expect(blueContainer).toBeInTheDocument()
      expect(greenContainer).toBeInTheDocument()
      expect(orangeContainer).toBeInTheDocument()
    })
  })

  describe('Text Styling', () => {
    it('should apply correct text styles to titles', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      const title = screen.getByText('Total Try-Ons')
      expect(title).toHaveClass('text-sm', 'text-gray-600')
    })

    it('should apply correct text styles to values', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      const value = screen.getByText('10')
      expect(value).toHaveClass('text-2xl', 'font-semibold', 'text-gray-900')
    })

    it('should apply correct text styles to descriptions', () => {
      const stats = {
        totalTryOns: 10,
        completedTryOns: 8,
        remainingTrials: 5,
        isPremium: false
      }

      render(<DashboardStats stats={stats} />)

      const description = screen.getByText('Cumulative usage count')
      expect(description).toHaveClass('text-xs', 'text-gray-500', 'mt-1')
    })
  })
})

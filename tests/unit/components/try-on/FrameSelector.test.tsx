import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameSelector } from '@/components/try-on/FrameSelector'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />
}))

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('FrameSelector', () => {
  const mockOnFrameSelect = jest.fn()
  const user = userEvent.setup()

  const mockFramesData = [
    {
      id: 'frame-1',
      name: 'Classic Round',
      imageUrl: 'https://example.com/frame1.jpg',
      category: 'round',
      brand: 'Brand A'
    },
    {
      id: 'frame-2',
      name: 'Modern Square',
      imageUrl: 'https://example.com/frame2.jpg',
      category: 'square',
      brand: 'Brand B'
    },
    {
      id: 'frame-3',
      name: 'Vintage Cat Eye',
      imageUrl: 'https://example.com/frame3.jpg',
      category: 'cat-eye',
      brand: 'Brand C'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockFramesData
      })
    } as Response)
  })

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      expect(screen.getByText('Loading glasses styles...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    })

    it('should apply custom className in loading state', () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
          className="custom-loading-class"
        />
      )

      const loadingContainer = screen.getByText('Loading glasses styles...').closest('.custom-loading-class')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('Successful Data Loading', () => {
    it('should fetch and display frames', async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/frames')
      })

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
        expect(screen.getByText('Modern Square')).toBeInTheDocument()
        expect(screen.getByText('Vintage Cat Eye')).toBeInTheDocument()
      })
    })

    it('should display frame images with correct attributes', async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        const frame1Image = screen.getByAltText('Classic Round')
        expect(frame1Image).toHaveAttribute('src', 'https://example.com/frame1.jpg')
        
        const frame2Image = screen.getByAltText('Modern Square')
        expect(frame2Image).toHaveAttribute('src', 'https://example.com/frame2.jpg')
      })
    })

    it('should display brand information when available', async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
        expect(screen.getByText('Brand B')).toBeInTheDocument()
        expect(screen.getByText('Brand C')).toBeInTheDocument()
      })
    })
  })

  describe('Frame Selection', () => {
    beforeEach(async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
      })
    })

    it('should call onFrameSelect when frame is clicked', async () => {
      const frame1 = screen.getByText('Classic Round').closest('div')
      await user.click(frame1!)

      expect(mockOnFrameSelect).toHaveBeenCalledWith('frame-1')
    })

    it('should highlight selected frame', async () => {
      render(
        <FrameSelector
          selectedFrameId="frame-2"
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        const frames = screen.getAllByText('Modern Square')
        const selectedFrame = frames.find(frame =>
          frame.closest('div')?.classList.contains('border-blue-500')
        )?.closest('div')
        expect(selectedFrame).toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200')
        expect(screen.getByTestId('check-icon')).toBeInTheDocument()
      })
    })

    it('should not highlight unselected frames', async () => {
      render(
        <FrameSelector
          selectedFrameId="frame-1"
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        const frames = screen.getAllByText('Modern Square')
        const unselectedFrame = frames.find(frame =>
          frame.closest('div')?.classList.contains('border-gray-200')
        )?.closest('div')
        expect(unselectedFrame).toHaveClass('border-gray-200')
        expect(unselectedFrame).not.toHaveClass('border-blue-500')
      })
    })
  })

  describe('Category Filtering', () => {
    beforeEach(async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
      })
    })

    it('should display category filter buttons', async () => {
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
        expect(screen.getByText('round')).toBeInTheDocument()
        expect(screen.getByText('square')).toBeInTheDocument()
        expect(screen.getByText('cat-eye')).toBeInTheDocument()
      })
    })

    it('should filter frames by category', async () => {
      const roundButton = screen.getByText('round')
      await user.click(roundButton)

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
        expect(screen.queryByText('Modern Square')).not.toBeInTheDocument()
        expect(screen.queryByText('Vintage Cat Eye')).not.toBeInTheDocument()
      })
    })

    it('should highlight active category button', async () => {
      const squareButton = screen.getByText('square')
      await user.click(squareButton)

      await waitFor(() => {
        expect(squareButton).toHaveClass('bg-blue-600', 'text-white')
      })
    })

    it('should show all frames when "All" is selected', async () => {
      // First filter by category
      const roundButton = screen.getByText('round')
      await user.click(roundButton)

      // Then click "All"
      const allButton = screen.getByText('All')
      await user.click(allButton)

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
        expect(screen.getByText('Modern Square')).toBeInTheDocument()
        expect(screen.getByText('Vintage Cat Eye')).toBeInTheDocument()
      })
    })
  })

  describe('Disabled State', () => {
    beforeEach(async () => {
      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
          disabled={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
      })
    })

    it('should disable frame selection when disabled prop is true', async () => {
      const frame1 = screen.getByText('Classic Round').closest('div')
      await user.click(frame1!)

      expect(mockOnFrameSelect).not.toHaveBeenCalled()
    })

    it('should apply disabled styles to frames', async () => {
      await waitFor(() => {
        const frameContainer = screen.getByText('Classic Round').closest('.relative')
        expect(frameContainer).toHaveClass('opacity-50', 'cursor-not-allowed')
      })
    })

    it('should disable category filter buttons', async () => {
      await waitFor(() => {
        const roundButton = screen.getByText('round')
        expect(roundButton).toBeDisabled()
        expect(roundButton).toHaveClass('opacity-50', 'cursor-not-allowed')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to load frames'
        })
      } as Response)

      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load frames')).toBeInTheDocument()
        expect(screen.getByText('Reload')).toBeInTheDocument()
      })
    })

    it('should display network error message', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Network error, please try again')).toBeInTheDocument()
      })
    })

    it('should retry loading when reload button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to load frames'
        })
      } as Response)

      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reload')).toBeInTheDocument()
      })

      // Mock successful retry
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockFramesData
        })
      } as Response)

      const reloadButton = screen.getByText('Reload')
      await user.click(reloadButton)

      await waitFor(() => {
        expect(screen.getByText('Classic Round')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no frames are available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      } as Response)

      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No glasses styles available')).toBeInTheDocument()
      })
    })

    it('should not show category filters when no frames have categories', async () => {
      const framesWithoutCategories = [
        {
          id: 'frame-1',
          name: 'Frame 1',
          imageUrl: 'https://example.com/frame1.jpg'
        }
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: framesWithoutCategories
        })
      } as Response)

      render(
        <FrameSelector
          selectedFrameId={null}
          onFrameSelect={mockOnFrameSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Frame 1')).toBeInTheDocument()
        expect(screen.queryByText('All')).not.toBeInTheDocument()
      })
    })
  })
})

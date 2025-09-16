import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { LoginButton } from '@/components/auth/LoginButton'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Twitter: ({ className }: { className?: string }) => <div data-testid="twitter-icon" className={className} />,
  LogOut: ({ className }: { className?: string }) => <div data-testid="logout-icon" className={className} />,
  User: ({ className }: { className?: string }) => <div data-testid="user-icon" className={className} />
}))

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(<LoginButton />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      const spinnerElement = screen.getByText('Loading...').parentElement?.querySelector('.animate-spin')
      expect(spinnerElement).toBeInTheDocument()
    })

    it('should apply custom className in loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(<LoginButton className="custom-class" />)

      const loadingContainer = screen.getByText('Loading...').closest('.custom-class')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })
    })

    it('should render sign in button when not authenticated', () => {
      render(<LoginButton />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toBeInTheDocument()
      expect(screen.getByTestId('twitter-icon')).toBeInTheDocument()
    })

    it('should call signIn when sign in button is clicked', () => {
      render(<LoginButton />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      fireEvent.click(signInButton)

      expect(mockSignIn).toHaveBeenCalledWith('twitter')
    })

    it('should apply default variant styles', () => {
      render(<LoginButton />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700')
    })

    it('should apply outline variant styles', () => {
      render(<LoginButton variant="outline" />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toHaveClass('border-blue-300', 'text-blue-700', 'hover:bg-blue-50')
    })

    it('should apply ghost variant styles', () => {
      render(<LoginButton variant="ghost" />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toHaveClass('text-blue-600', 'hover:text-blue-700', 'hover:bg-blue-100')
    })

    it('should apply custom className', () => {
      render(<LoginButton className="custom-signin-class" />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toHaveClass('custom-signin-class')
    })
  })

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        name: 'John Doe',
        username: 'johndoe',
        image: 'https://example.com/avatar.jpg'
      }
    }

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated'
      })
    })

    it('should render user info and sign out button when authenticated', () => {
      render(<LoginButton />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument()
    })

    it('should display user avatar when image is provided', () => {
      render(<LoginButton />)

      const avatar = screen.getByAltText('John Doe')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should display default user icon when no image is provided', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            username: 'johndoe'
          }
        },
        status: 'authenticated'
      })

      render(<LoginButton />)

      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('should display username when name is not available', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            username: 'johndoe'
          }
        },
        status: 'authenticated'
      })

      render(<LoginButton />)

      expect(screen.getByText('johndoe')).toBeInTheDocument()
    })

    it('should display "User" as fallback when neither name nor username is available', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {}
        },
        status: 'authenticated'
      })

      render(<LoginButton />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should call signOut when sign out button is clicked', () => {
      render(<LoginButton />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(mockSignOut).toHaveBeenCalled()
    })

    it('should apply default variant styles to sign out button', () => {
      render(<LoginButton />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700')
    })

    it('should apply outline variant styles to sign out button', () => {
      render(<LoginButton variant="outline" />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toHaveClass('border-gray-300', 'text-gray-700', 'hover:bg-gray-50')
    })

    it('should apply ghost variant styles to sign out button', () => {
      render(<LoginButton variant="ghost" />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toHaveClass('text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-100')
    })

    it('should apply custom className to sign out button', () => {
      render(<LoginButton className="custom-signout-class" />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toHaveClass('custom-signout-class')
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for user avatar', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: 'Jane Smith',
            image: 'https://example.com/jane.jpg'
          }
        },
        status: 'authenticated'
      })

      render(<LoginButton />)

      const avatar = screen.getByAltText('Jane Smith')
      expect(avatar).toBeInTheDocument()
    })

    it('should use "User Avatar" as fallback alt text', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            image: 'https://example.com/avatar.jpg'
          }
        },
        status: 'authenticated'
      })

      render(<LoginButton />)

      const avatar = screen.getByAltText('User Avatar')
      expect(avatar).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      render(<LoginButton />)

      const signInButton = screen.getByRole('button', { name: /sign in with twitter/i })
      expect(signInButton).toBeInTheDocument()
    })
  })
})

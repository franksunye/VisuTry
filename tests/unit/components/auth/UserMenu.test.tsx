import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useTestSession } from '@/hooks/useTestSession'
import { UserMenu } from '@/components/auth/UserMenu'

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/hooks/useTestSession', () => ({
  useTestSession: jest.fn(),
}))

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseTestSession = useTestSession as jest.MockedFunction<typeof useTestSession>

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/en/try-on')
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Demo User',
          email: 'demo@example.com',
          image: '',
        },
        expires: '2099-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })
    mockUseTestSession.mockReturnValue({
      testSession: null,
      loading: false,
      clearTestSession: jest.fn(),
    })
  })

  it('calls signOut with locale callback url for authenticated users', () => {
    render(<UserMenu />)

    fireEvent.click(screen.getByLabelText('User menu'))
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/en' })
  })

  it('clears test session instead of calling signOut in test mode', () => {
    const clearTestSession = jest.fn()
    mockUseTestSession.mockReturnValue({
      testSession: {
        source: 'test',
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
          image: '',
        },
      },
      loading: false,
      clearTestSession,
    })

    render(<UserMenu />)

    fireEvent.click(screen.getByLabelText('User menu'))
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))

    expect(clearTestSession).toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})


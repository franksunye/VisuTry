import { fireEvent, render, screen } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { MerchantAuthActions } from '@/components/auth/MerchantAuthActions'

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }))

describe('MerchantAuthActions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('preserves the merchant callback for both signup and returning-user login', () => {
    render(<MerchantAuthActions callbackUrl="/en/merchant" />)

    fireEvent.click(screen.getByRole('button', { name: /create merchant account/i }))
    fireEvent.click(screen.getByRole('button', { name: /already have an account/i }))

    expect(signIn).toHaveBeenNthCalledWith(1, 'auth0', { callbackUrl: '/en/merchant' }, { screen_hint: 'signup' })
    expect(signIn).toHaveBeenNthCalledWith(2, 'auth0', { callbackUrl: '/en/merchant' }, undefined)
  })
})

import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { MerchantShopperAccountControl } from '@/components/store/MerchantShopperAccountControl'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>{children}</a>
  ),
}))

const control = (
  <MerchantShopperAccountControl
    merchantSlug="g4c-qa-free"
    experienceType="STORE"
    locale="en"
  />
)

describe('MerchantShopperAccountControl', () => {
  it('does not crash Store/Campaign discovery when SessionProvider is absent', () => {
    expect(() => render(control)).not.toThrow()
    expect(screen.queryByRole('button', { name: /shopper account/i })).not.toBeInTheDocument()
  })

  it('renders the signed-in shopper menu when a session exists', () => {
    render(
      <SessionProvider
        session={{
          user: {
            name: 'Ada',
            email: 'ada@example.com',
            creditsPurchased: 4,
            creditsUsed: 1,
          } as never,
          expires: new Date(Date.now() + 60_000).toISOString(),
        }}
      >
        {control}
      </SessionProvider>,
    )

    expect(screen.getByRole('button', { name: /ada shopper account/i })).toBeInTheDocument()
  })
})

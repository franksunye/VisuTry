import { render, screen } from '@testing-library/react'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'

jest.mock('next/navigation', () => ({ usePathname: () => '/en/merchant/catalog' }))

describe('MerchantWorkspaceShell', () => {
  it('renders focused primary navigation and a compact utility menu', () => {
    render(
      <MerchantWorkspaceShell
        locale="en"
        merchants={[{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }]}
        selectedMerchantId="merchant-a"
      >
        <div>catalog content</div>
      </MerchantWorkspaceShell>,
    )
    expect(screen.getByText('catalog content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/en/merchant?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('More')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Active merchant' })).toHaveValue('merchant-a')
  })
})


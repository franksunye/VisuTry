import { render, screen } from '@testing-library/react'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'

jest.mock('next/navigation', () => ({ usePathname: () => '/en/merchant/catalog' }))
jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({
  getMerchantActivationContext: () => ({ sessionId: 'session-a', signupCorrelationId: 'signup-a' }),
  recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true),
}))

import { analytics } from '@/lib/analytics'

describe('MerchantWorkspaceShell', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.clearAllMocks()
  })

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

  it('records workspace entry once per Merchant browser session, not once per route mount', () => {
    const props = {
      locale: 'en',
      merchants: [{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }],
      selectedMerchantId: 'merchant-a',
      children: <div>catalog content</div>,
    }
    const first = render(<MerchantWorkspaceShell {...props} />)
    first.unmount()
    render(<MerchantWorkspaceShell {...props} />)
    expect(analytics.trackCustomEvent).toHaveBeenCalledTimes(1)
  })
})

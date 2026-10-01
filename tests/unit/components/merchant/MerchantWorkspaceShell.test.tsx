import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders the product navigation rail and merchant switcher', () => {
    render(
      <MerchantWorkspaceShell
        locale="en"
        merchants={[{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER', referenceData: true }]}
        selectedMerchantId="merchant-a"
      >
        <div>catalog content</div>
      </MerchantWorkspaceShell>,
    )
    expect(screen.getByText('catalog content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/en/merchant?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('navigation', { name: 'Merchant primary navigation' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Merchant utility navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveAttribute('href', '/en/merchant/integrations?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'Plan & Usage' })).toHaveAttribute('href', '/en/merchant/plan?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/en/merchant/settings?merchantId=merchant-a')
    expect(screen.getByRole('combobox', { name: 'Active merchant' })).toHaveValue('merchant-a')
    expect(screen.getAllByText('Reference data').length).toBeGreaterThan(0)
  })

  it('opens a full mobile navigation drawer instead of relying on clipped horizontal links', async () => {
    const user = userEvent.setup()
    render(
      <MerchantWorkspaceShell
        locale="en"
        merchants={[{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }]}
        selectedMerchantId="merchant-a"
      >
        <div>analytics content</div>
      </MerchantWorkspaceShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    const drawer = screen.getByLabelText('Merchant navigation')
    expect(drawer).toBeInTheDocument()
    expect(drawer).toHaveTextContent('Home')
    expect(drawer).toHaveTextContent('Analytics')
    expect(drawer).toHaveTextContent('Integrations')
    expect(drawer).toHaveTextContent('Plan & Usage')
    expect(drawer).toHaveTextContent('Settings')
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

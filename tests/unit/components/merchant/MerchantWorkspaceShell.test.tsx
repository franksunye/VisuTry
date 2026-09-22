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
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveClass('block', 'whitespace-nowrap')
    expect(screen.getByRole('link', { name: 'Plan & Usage' })).toHaveClass('block', 'whitespace-nowrap')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('block', 'whitespace-nowrap')
    expect(screen.getByRole('combobox', { name: 'Active merchant' })).toHaveValue('merchant-a')
  })

  it('brings the active primary route into the horizontal navigation viewport', () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    const scrollIntoView = jest.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })

    try {
      render(
        <MerchantWorkspaceShell
          locale="en"
          merchants={[{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }]}
          selectedMerchantId="merchant-a"
        >
          <div>analytics content</div>
        </MerchantWorkspaceShell>,
      )

      expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('aria-current', 'page')
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: originalScrollIntoView })
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
      }
    }
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

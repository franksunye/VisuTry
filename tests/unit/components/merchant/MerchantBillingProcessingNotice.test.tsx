import { render, screen } from '@testing-library/react'
import { MerchantBillingProcessingNotice } from '@/components/merchant/MerchantBillingProcessingNotice'
import type { MerchantCommercialPresentation } from '@/modules/merchant/application/merchant-control-center'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

function commercial(overrides: Partial<MerchantCommercialPresentation> = {}) {
  return { planCode: 'FREE', status: 'FREE', planName: 'Free', ...overrides } as MerchantCommercialPresentation
}

describe('MerchantBillingProcessingNotice', () => {
  afterEach(() => jest.clearAllMocks())

  it('keeps a checkout return in processing until server state shows the target plan', () => {
    render(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={commercial()} targetPlan="LAUNCH" />)

    expect(screen.getByRole('status')).toHaveTextContent('Your payment is being confirmed')
    expect(screen.getByRole('status')).toHaveTextContent('feature access will update after confirmation')
  })

  it('shows activation only after the server-authoritative plan is active', () => {
    render(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={commercial({ planCode: 'LAUNCH', planName: 'Launch', status: 'PAID_ACTIVE' })} targetPlan="LAUNCH" />)

    expect(screen.getByRole('status')).toHaveTextContent('Your payment is confirmed')
    expect(screen.queryByText('Plan update in progress')).not.toBeInTheDocument()
  })
})

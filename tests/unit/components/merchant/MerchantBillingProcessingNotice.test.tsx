import { act, render, screen } from '@testing-library/react'
import { MerchantBillingCancelledNotice, MerchantBillingProcessingNotice } from '@/components/merchant/MerchantBillingProcessingNotice'
import type { MerchantCommercialPresentation } from '@/modules/merchant/application/merchant-control-center'
import { analytics } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))

function commercial(overrides: Partial<MerchantCommercialPresentation> = {}) {
  return { planCode: 'FREE', status: 'FREE', planName: 'Free', ...overrides } as MerchantCommercialPresentation
}

describe('MerchantBillingProcessingNotice', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

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

  it('shows a delayed confirmation timeout while preserving the pending state', () => {
    jest.useFakeTimers()
    render(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={commercial()} targetPlan="LAUNCH" />)

    act(() => jest.advanceTimersByTime(30_000))

    expect(screen.getByRole('status')).toHaveTextContent('Plan update in progress')
    expect(screen.getByRole('status')).toHaveTextContent('This is taking longer than usual')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('deduplicates checkout-return and activation analytics across refresh renders', () => {
    const activeCommercial = commercial({ planCode: 'LAUNCH', planName: 'Launch', status: 'PAID_ACTIVE' })
    const { rerender } = render(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={activeCommercial} targetPlan="LAUNCH" />)
    rerender(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={activeCommercial} targetPlan="LAUNCH" />)
    rerender(<MerchantBillingProcessingNotice merchantId="merchant-1" commercial={activeCommercial} targetPlan="LAUNCH" />)

    expect(analytics.trackCustomEvent).toHaveBeenCalledTimes(2)
    expect(analytics.trackCustomEvent).toHaveBeenNthCalledWith(1, AnalyticsEvent.MerchantCheckoutReturned, { merchant_id: 'merchant-1', plan_code: 'LAUNCH' })
    expect(analytics.trackCustomEvent).toHaveBeenNthCalledWith(2, AnalyticsEvent.MerchantBillingActivated, { merchant_id: 'merchant-1', plan_code: 'LAUNCH' })
  })

  it('preserves the existing cancellation copy and status semantics', () => {
    render(<MerchantBillingCancelledNotice />)
    expect(screen.getByRole('status')).toHaveTextContent('No changes were made')
    expect(screen.getByRole('status')).toHaveTextContent('Your current Store and access remain unchanged')
  })
})

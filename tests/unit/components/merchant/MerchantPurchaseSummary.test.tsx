import { fireEvent, render, screen } from '@testing-library/react'
import { MerchantPurchaseSummary } from '@/components/merchant/MerchantPurchaseSummary'
import { recordMerchantActivationClientEvent } from '@/lib/merchant-activation-client'
import { getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import type { MerchantBillingState } from '@/modules/merchant/domain/merchant-billing-state'

const refresh = jest.fn()

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({ recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true) }))
const mockRecordMerchantActivationClientEvent = recordMerchantActivationClientEvent as jest.Mock

const baseState = {
  reason: null,
  providerPlanCode: null,
  providerSubscriptionStatus: null,
  cancelAtPeriodEnd: false,
} as const

function renderSummary(action: 'CHECKOUT' | 'CHANGE_PLAN' | 'CURRENT' | 'MANAGE_BILLING' | 'BILLING_DISABLED' | 'BILLING_RECOVERY', billingState: MerchantBillingState = { kind: 'NO_SUBSCRIPTION', ...baseState }) {
  return render(<MerchantPurchaseSummary locale="en" merchantId="merchant-1" merchantName="Demo Merchant" intent="GROWTH" plan={getMerchantPlanDefinition('GROWTH')} action={action} currentPlanName="Launch" billingState={billingState} />)
}

describe('MerchantPurchaseSummary billing states', () => {
  it('shows secure checkout only for an explicit checkout action', () => {
    renderSummary('CHECKOUT')
    expect(screen.getByRole('button', { name: /start secure checkout/i })).toBeInTheDocument()
    expect(screen.queryByText(/billing is disabled/i)).not.toBeInTheDocument()
  })

  it('records commercial intent without blocking checkout navigation', () => {
    mockRecordMerchantActivationClientEvent.mockClear()
    renderSummary('CHECKOUT')
    fireEvent.click(screen.getByRole('button', { name: /start secure checkout/i }))
    expect(mockRecordMerchantActivationClientEvent).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'merchant-1',
      eventType: 'merchant_commercial_intent',
      commercialIntent: 'GROWTH',
    }))
  })

  it('shows a non-write disabled state for test/internal workspaces', () => {
    renderSummary('BILLING_DISABLED', { kind: 'BILLING_DISABLED', ...baseState, reason: 'BILLING_POLICY_DISABLED' })
    expect(screen.getByRole('status')).toHaveTextContent('Live billing is disabled for this workspace.')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to merchant workspace/i })).toBeInTheDocument()
  })

  it('explains missing subscriptions and never offers automatic checkout', () => {
    renderSummary('BILLING_RECOVERY', { kind: 'SUBSCRIPTION_MISSING', ...baseState, reason: 'SUBSCRIPTION_NOT_FOUND' })
    expect(screen.getByRole('alert')).toHaveTextContent('No charge was made.')
    expect(screen.getByRole('alert')).toHaveTextContent('Your current plan is unchanged.')
    expect(screen.queryByRole('button', { name: /secure checkout/i })).not.toBeInTheDocument()
  })

  it('offers retry guidance only for a provider outage', () => {
    renderSummary('BILLING_RECOVERY', { kind: 'PROVIDER_UNAVAILABLE', ...baseState, reason: 'PROVIDER_UNAVAILABLE' })
    expect(screen.getByRole('alert')).toHaveTextContent('We could not reach the billing provider.')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

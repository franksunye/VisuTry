import { act, fireEvent, render, screen } from '@testing-library/react'
import { MerchantPurchaseSummary } from '@/components/merchant/MerchantPurchaseSummary'
import { analytics } from '@/lib/analytics'
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

function renderSummary(action: 'CHECKOUT' | 'CHANGE_PLAN' | 'CURRENT' | 'MANAGE_BILLING' | 'BILLING_DISABLED' | 'BILLING_RECOVERY' | 'DUPLICATE_PILOT', billingState: MerchantBillingState = { kind: 'NO_SUBSCRIPTION', ...baseState }) {
  return render(<MerchantPurchaseSummary locale="en" merchantId="merchant-1" merchantName="Demo Merchant" intent="GROWTH" plan={getMerchantPlanDefinition('GROWTH')} action={action} currentPlanName="Launch" billingState={billingState} />)
}

describe('MerchantPurchaseSummary billing states', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows secure checkout only for an explicit checkout action', () => {
    renderSummary('CHECKOUT')
    expect(screen.getByRole('button', { name: /start secure checkout/i })).toBeInTheDocument()
    expect(screen.queryByText(/billing is disabled/i)).not.toBeInTheDocument()
    expect(screen.getByText('Current plan: Launch')).toBeInTheDocument()
    expect(screen.getByText('Plan price')).toBeInTheDocument()
  })

  it('keeps merchant identity and workspace return separate from plan options', () => {
    renderSummary('CHECKOUT')
    expect(screen.getByText('Merchant workspace · Demo Merchant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to merchant workspace/i })).toHaveAttribute('href', '/en/merchant?merchantId=merchant-1')
    expect(screen.getByRole('link', { name: /plan options/i })).toHaveAttribute('href', '/en/business/pricing')
  })

  it('makes the current-to-target relationship explicit for a plan change', () => {
    renderSummary('CHANGE_PLAN')
    expect(screen.getByText('Current · Launch')).toBeInTheDocument()
    expect(screen.getByText('New plan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with growth/i })).toBeInTheDocument()
  })

  it('records commercial intent without blocking checkout navigation', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Local harness stop' }) }) as jest.Mock
    mockRecordMerchantActivationClientEvent.mockClear()
    try {
      renderSummary('CHECKOUT')
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start secure checkout/i }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(mockRecordMerchantActivationClientEvent).toHaveBeenCalledWith(expect.objectContaining({
        merchantId: 'merchant-1',
        eventType: 'merchant_commercial_intent',
        commercialIntent: 'GROWTH',
      }))
      expect(screen.getByRole('alert')).toHaveTextContent('Local harness stop')
    } finally {
      global.fetch = originalFetch
    }
  })

  it('starts checkout telemetry and POST only after explicit Purchase confirmation', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Local harness stop' }) }) as jest.Mock
    try {
      renderSummary('CHECKOUT')
      expect(global.fetch).not.toHaveBeenCalled()
      expect(analytics.trackCustomEvent).not.toHaveBeenCalled()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start secure checkout/i }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(analytics.trackCustomEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        plan_code: 'GROWTH',
        source: 'merchant_purchase_review',
        merchant_flow: 'checkout',
      }))
      expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-1/billing/checkout', expect.objectContaining({ method: 'POST' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Local harness stop')
    } finally {
      global.fetch = originalFetch
    }
  })

  it('calls the change-plan mutation only after explicit Purchase confirmation', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Local harness stop' }) }) as jest.Mock
    try {
      renderSummary('CHANGE_PLAN', { kind: 'VALID_SUBSCRIPTION', ...baseState, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'active' })
      expect(global.fetch).not.toHaveBeenCalled()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue with growth/i }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-1/billing/change-plan', expect.objectContaining({ method: 'POST' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Local harness stop')
    } finally {
      global.fetch = originalFetch
    }
  })

  it('keeps CURRENT and duplicate Pilot states mutation-free', () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn() as jest.Mock
    try {
      const current = renderSummary('CURRENT', { kind: 'VALID_SUBSCRIPTION', ...baseState, providerPlanCode: 'GROWTH', providerSubscriptionStatus: 'active' })
      expect(screen.getByRole('status')).toHaveTextContent('This is your current plan.')
      expect(global.fetch).not.toHaveBeenCalled()
      current.unmount()

      renderSummary('DUPLICATE_PILOT')
      expect(screen.getByRole('status')).toHaveTextContent('A second $149 Pilot checkout is not available.')
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('does not label Manage Billing portal access as checkout started', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Local harness stop' }) }) as jest.Mock
    try {
      renderSummary('MANAGE_BILLING', { kind: 'PAYMENT_ATTENTION', ...baseState, reason: 'SUBSCRIPTION_STATUS_INVALID' })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /manage billing/i }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-1/billing/portal', expect.objectContaining({ method: 'POST' }))
      expect(analytics.trackCustomEvent).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('Local harness stop')
    } finally {
      global.fetch = originalFetch
    }
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
    const originalFetch = global.fetch
    global.fetch = jest.fn() as jest.Mock
    refresh.mockClear()
    try {
      renderSummary('BILLING_RECOVERY', { kind: 'PROVIDER_UNAVAILABLE', ...baseState, reason: 'PROVIDER_UNAVAILABLE' })
      expect(screen.getByRole('alert')).toHaveTextContent('We could not reach the billing provider.')
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      expect(refresh).toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('keeps checkout errors visible in the same restrained feedback surface on retry', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Local test error' }) }) as jest.Mock
    renderSummary('CHECKOUT')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start secure checkout/i }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Local test error')
    expect(alert).toHaveClass('rounded-xl', 'bg-red-50')
    global.fetch = originalFetch
  })
})

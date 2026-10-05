import { fireEvent, render, screen, within } from '@testing-library/react'
import { MerchantPlanUsage } from '@/components/merchant/MerchantPlanUsage'
import type { MerchantCommercialPresentation } from '@/modules/merchant/application/merchant-control-center'

function commercial(overrides: Partial<MerchantCommercialPresentation> = {}): MerchantCommercialPresentation {
  return {
    commercialState: 'CANONICAL', isCanonical: true, planCode: 'GROWTH', planName: 'Growth', priceLabel: '$499/month', status: 'USAGE_WARNING',
    periodStart: '2026-08-01T00:00:00.000Z', periodEnd: '2026-09-01T00:00:00.000Z', daysRemaining: 5,
    limits: { catalogItems: 500, activeCampaigns: 3, aiCommerceSessions: 5000, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' },
    pilotCatalogRange: null, setupLabel: null,
    usage: { aiCommerceSessions: 4620, activeCampaigns: 2, catalogItems: 72, standardTryOnGenerations: 0 },
    aiCommerceSessionLimit: 5000, aiCommerceSessionRemaining: 380, aiCommerceSessionPercentage: 92,
    threshold: 'WARNING', features: { STORE: true, CATALOG: true, CAMPAIGN: true, RECOMMENDATION: true, GENERATIVE_TRY_ON: true, COMPARE: true, DECISION_RESULT: true, MERCHANT_HANDOFF: true, KIOSK_DELIVERY: false, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: true },
    primaryAction: 'UPGRADE_CAPACITY', ...overrides,
  }
}

describe('MerchantPlanUsage', () => {
  it('explains a paid warning state with readable usage and action', () => {
    render(<MerchantPlanUsage commercial={commercial()} />)
    expect(screen.getByRole('heading', { name: 'Growth' })).toBeInTheDocument()
    expect(screen.getByText('4,620 / 5,000')).toBeInTheDocument()
    expect(screen.getByText('92% used · 380 remaining')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '92% of AI Commerce Sessions used' })).toHaveAttribute('aria-valuenow', '92')
    expect(screen.getByText('You’re close to your monthly AI Commerce Session limit.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade capacity/i })).toBeInTheDocument()
  })

  it('makes clear that exhaustion pauses Try-On while the Store remains live', () => {
    render(<MerchantPlanUsage commercial={commercial({ status: 'USAGE_EXHAUSTED', threshold: 'LIMIT_REACHED', aiCommerceSessionPercentage: 100, aiCommerceSessionRemaining: 0, usage: { aiCommerceSessions: 5000, activeCampaigns: 3, catalogItems: 500, standardTryOnGenerations: 0 }, primaryAction: 'RESTORE_AI_CAPACITY' })} />)
    expect(screen.getByText('AI Try-On is paused. Your Store remains live.')).toBeInTheDocument()
    expect(screen.getByText('Paused until capacity is restored')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /restore ai capacity/i })).toBeInTheDocument()
  })

  it('keeps Free language focused on value and the upgrade path', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FREE', planName: 'Free', priceLabel: '$0', status: 'FREE', periodStart: null, periodEnd: null, daysRemaining: null, limits: { catalogItems: 50, activeCampaigns: 0, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 4, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: null, aiCommerceSessionRemaining: null, aiCommerceSessionPercentage: null, threshold: null, features: { STORE: true, CATALOG: true, CAMPAIGN: false, RECOMMENDATION: true, GENERATIVE_TRY_ON: false, COMPARE: false, DECISION_RESULT: false, MERCHANT_HANDOFF: false, KIOSK_DELIVERY: false, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'UNLOCK_AI_TRY_ON' })} storeStatus="ACTIVE" />)
    expect(screen.getByText('Your Store is live on the Free plan.')).toBeInTheDocument()
    expect(screen.getByText('Not included on Free')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /unlock ai try-on/i })).toBeInTheDocument()
  })

  it('does not describe a draft Store as publicly live', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FREE', planName: 'Free', priceLabel: '$0', status: 'FREE', periodStart: null, periodEnd: null, daysRemaining: null, limits: { catalogItems: 50, activeCampaigns: 0, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 0, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: null, aiCommerceSessionRemaining: null, aiCommerceSessionPercentage: null, threshold: null, features: { STORE: true, CATALOG: true, CAMPAIGN: false, RECOMMENDATION: true, GENERATIVE_TRY_ON: false, COMPARE: false, DECISION_RESULT: false, MERCHANT_HANDOFF: false, KIOSK_DELIVERY: false, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'UNLOCK_AI_TRY_ON' })} storeStatus="DRAFT" />)
    expect(screen.getByText('Your Store is in draft on the Free plan.')).toBeInTheDocument()
    expect(screen.queryByText('Your Store is live on the Free plan.')).not.toBeInTheDocument()
  })

  it('shows a zero AI session allowance as not included instead of 0 / 0', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FREE', planName: 'Free', priceLabel: '$0', status: 'FREE', threshold: null, aiCommerceSessionLimit: 0, aiCommerceSessionRemaining: 0, aiCommerceSessionPercentage: null, primaryAction: 'UNLOCK_AI_TRY_ON' })} />)
    const card = screen.getByText('AI Commerce Sessions').closest('article')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText('Not included')).toBeInTheDocument()
    expect(within(card as HTMLElement).queryByText('0 / 0')).not.toBeInTheDocument()
  })

  it('offers the fixed Founding Pilot directly from the Free workspace', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FREE', planName: 'Free', priceLabel: '$0', status: 'FREE', periodStart: null, periodEnd: null, daysRemaining: null, limits: { catalogItems: 50, activeCampaigns: 0, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 4, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: null, aiCommerceSessionRemaining: null, aiCommerceSessionPercentage: null, threshold: null, features: { STORE: true, CATALOG: true, CAMPAIGN: false, RECOMMENDATION: true, GENERATIVE_TRY_ON: false, COMPARE: false, DECISION_RESULT: false, MERCHANT_HANDOFF: false, KIOSK_DELIVERY: false, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'UNLOCK_AI_TRY_ON' })} merchantId="merchant-free" />)
    expect(screen.getByRole('button', { name: /start founding pilot/i })).toBeInTheDocument()
  })

  it('explains the fixed Founding Pilot offer without presenting recurring billing', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FOUNDING_PILOT', planName: 'Founding Pilot', priceLabel: '$149 / 30 days', status: 'PILOT_ACTIVE', periodStart: '2026-08-01T00:00:00.000Z', periodEnd: '2026-08-31T00:00:00.000Z', daysRemaining: 3, limits: { catalogItems: 50, activeCampaigns: 1, aiCommerceSessions: 1500, standardTryOnGenerations: 3500, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 620, activeCampaigns: 0, catalogItems: 12, standardTryOnGenerations: 1420 }, aiCommerceSessionLimit: 1500, aiCommerceSessionRemaining: 880, aiCommerceSessionPercentage: 41, threshold: 'NORMAL', features: { STORE: true, CATALOG: true, CAMPAIGN: true, RECOMMENDATION: true, GENERATIVE_TRY_ON: true, COMPARE: true, DECISION_RESULT: true, MERCHANT_HANDOFF: true, KIOSK_DELIVERY: true, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'CONTINUE_AFTER_PILOT', pilotCatalogRange: { min: 8, max: 50 }, setupLabel: 'Assisted setup + weekly review' })} />)
    expect(screen.getByText('$149 / 30 days')).toBeInTheDocument()
    expect(screen.getByText('8–50 frames')).toBeInTheDocument()
    expect(screen.getByText('Assisted setup + weekly review')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Your Founding Pilot ends in 3 days. Choose how to continue.')
  })

  it('does not present a legacy merchant as Free', () => {
    render(<MerchantPlanUsage commercial={commercial({ commercialState: 'LEGACY_UNMIGRATED', isCanonical: false, planCode: null, planName: 'Legacy · not enrolled', priceLabel: 'No canonical plan', status: 'LEGACY_UNMIGRATED', periodStart: null, periodEnd: null, daysRemaining: null, aiCommerceSessionLimit: null, aiCommerceSessionPercentage: null, aiCommerceSessionRemaining: null, primaryAction: 'ENROLL_PLAN', limits: { catalogItems: null, activeCampaigns: null, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' } })} />)
    expect(screen.getByRole('heading', { name: 'Legacy · not enrolled' })).toBeInTheDocument()
    expect(screen.getByText('Existing activity')).toBeInTheDocument()
    expect(screen.getByText('Not on a current plan')).toBeInTheDocument()
    expect(screen.getByText(/existing access while you choose a current plan/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /choose a plan/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Free' })).not.toBeInTheDocument()
  })

  it('expands and collapses canonical plan options without initiating billing', () => {
    const originalFetch = globalThis.fetch
    const fetchSpy = jest.fn()
    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    try {
      render(<MerchantPlanUsage commercial={commercial({ commercialState: 'LEGACY_UNMIGRATED', isCanonical: false, planCode: null, planName: 'Legacy · not enrolled', priceLabel: 'No canonical plan', status: 'LEGACY_UNMIGRATED', periodStart: null, periodEnd: null, daysRemaining: null, aiCommerceSessionLimit: null, aiCommerceSessionPercentage: null, aiCommerceSessionRemaining: null, primaryAction: 'ENROLL_PLAN', limits: { catalogItems: null, activeCampaigns: null, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' } })} merchantId="merchant-legacy" />)

      fireEvent.click(screen.getByRole('button', { name: 'View plan options' }))
      expect(screen.getByRole('group', { name: 'Plan options' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Launch · $199/month' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Growth · $499/month' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Scale · $999/month' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Founding Pilot · $149 / 30 days' })).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Hide plan options' }))
      expect(screen.queryByRole('group', { name: 'Plan options' })).not.toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      if (originalFetch) Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: originalFetch })
      else Reflect.deleteProperty(globalThis, 'fetch')
    }
  })

  it('starts checkout only after a plan option is selected', () => {
    const originalFetch = globalThis.fetch
    const fetchSpy = jest.fn().mockImplementation(() => new Promise(() => {}))
    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    try {
      render(<MerchantPlanUsage commercial={commercial({ commercialState: 'LEGACY_UNMIGRATED', isCanonical: false, planCode: null, planName: 'Legacy · not enrolled', priceLabel: 'No canonical plan', status: 'LEGACY_UNMIGRATED', periodStart: null, periodEnd: null, daysRemaining: null, aiCommerceSessionLimit: null, aiCommerceSessionPercentage: null, aiCommerceSessionRemaining: null, primaryAction: 'ENROLL_PLAN', limits: { catalogItems: null, activeCampaigns: null, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' } })} merchantId="merchant-legacy" />)

      fireEvent.click(screen.getByRole('button', { name: 'View plan options' }))
      expect(fetchSpy).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Launch · $199/month' }))
      expect(fetchSpy).toHaveBeenCalledWith('/api/merchant/merchant-legacy/activation-events', expect.objectContaining({ method: 'POST' }))
      expect(fetchSpy).toHaveBeenCalledWith('/api/merchant/merchant-legacy/billing/checkout', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: 'LAUNCH', locale: 'en' }),
      }))
    } finally {
      if (originalFetch) Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: originalFetch })
      else Reflect.deleteProperty(globalThis, 'fetch')
    }
  })

  it.each([
    ['PAYMENT_ACTION_REQUIRED', 'Action is needed to restore paid features.', 'border-red-200', 'Review payment status'],
    ['PAST_DUE', 'Action is needed to restore paid features.', 'border-red-200', 'Review payment status'],
    ['CANCEL_AT_PERIOD_END', 'Your current plan remains active through the end of this period.', 'border-amber-200', 'Choose a plan'],
    ['EXPIRED', 'This commercial period has ended. Your Store and catalog remain available.', 'border-amber-200', 'Choose a plan'],
  ] as const)('preserves the %s message, severity tone, and billing action', (status, copy, tone, action) => {
    render(<MerchantPlanUsage commercial={commercial({ status, primaryAction: status === 'PAYMENT_ACTION_REQUIRED' || status === 'PAST_DUE' ? 'RESOLVE_PAYMENT' : 'ENROLL_PLAN' })} merchantId="merchant-status" />)
    expect(screen.getByRole('status')).toHaveTextContent(copy)
    expect(screen.getByRole('status')).toHaveClass(tone)
    expect(screen.getByRole('button', { name: new RegExp(action, 'i') })).toBeInTheDocument()
  })

  it('keeps the Plan heading and status/capability regions accessible', () => {
    render(<MerchantPlanUsage commercial={commercial()} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Growth' })).toHaveAttribute('id', 'plan-usage-heading')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Available capabilities' })).toBeInTheDocument()
  })

  it('presents Demo access without customer plan or billing actions', () => {
    render(<MerchantPlanUsage commercial={commercial({
      commercialState: 'DEMO', isCanonical: false, planCode: null, planName: 'VisuTry Demo', priceLabel: 'No commercial plan', status: 'DEMO_ACTIVE',
      periodStart: null, periodEnd: null, daysRemaining: null, aiCommerceSessionLimit: null, aiCommerceSessionPercentage: null, aiCommerceSessionRemaining: null,
      threshold: null, primaryAction: 'NONE',
      limits: { catalogItems: null, activeCampaigns: null, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' },
    })} merchantId="visutry-demo" />)

    expect(screen.getByRole('heading', { name: 'VisuTry Demo' })).toBeInTheDocument()
    expect(screen.getByText(/no subscription or payment is required/i)).toBeInTheDocument()
    expect(screen.getByText(/bounded usage safety applies/i)).toBeInTheDocument()
    expect(screen.getByText(/not a customer subscription/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage plan|upgrade|choose a plan|founding pilot/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /compare plans|plan options|upgrade/i })).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { MerchantPlanUsage } from '@/components/merchant/MerchantPlanUsage'
import type { MerchantCommercialPresentation } from '@/modules/merchant/application/merchant-control-center'

function commercial(overrides: Partial<MerchantCommercialPresentation> = {}): MerchantCommercialPresentation {
  return {
    planCode: 'GROWTH', planName: 'Growth', priceLabel: '$499/month', status: 'USAGE_WARNING',
    periodStart: '2026-08-01T00:00:00.000Z', periodEnd: '2026-09-01T00:00:00.000Z', daysRemaining: 5,
    limits: { catalogItems: 500, activeCampaigns: 3, aiCommerceSessions: 5000, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' },
    pilotCatalogRange: null, setupLabel: null,
    usage: { aiCommerceSessions: 4620, activeCampaigns: 2, catalogItems: 72, standardTryOnGenerations: 0 },
    aiCommerceSessionLimit: 5000, aiCommerceSessionRemaining: 380, aiCommerceSessionPercentage: 92,
    threshold: 'WARNING', features: { STORE: true, CATALOG: true, CAMPAIGN: true, RECOMMENDATION: true, GENERATIVE_TRY_ON: true, COMPARE: true, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: true },
    primaryAction: 'UPGRADE_CAPACITY', ...overrides,
  }
}

describe('MerchantPlanUsage', () => {
  it('explains a paid warning state with readable usage and action', () => {
    render(<MerchantPlanUsage commercial={commercial()} />)
    expect(screen.getByRole('heading', { name: 'Growth' })).toBeInTheDocument()
    expect(screen.getByText('4,620 / 5,000 · 92%')).toBeInTheDocument()
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
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FREE', planName: 'Free', priceLabel: '$0', status: 'FREE', periodStart: null, periodEnd: null, daysRemaining: null, limits: { catalogItems: 50, activeCampaigns: 0, aiCommerceSessions: null, standardTryOnGenerations: null, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 4, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: null, aiCommerceSessionRemaining: null, aiCommerceSessionPercentage: null, threshold: null, features: { STORE: true, CATALOG: true, CAMPAIGN: false, RECOMMENDATION: true, GENERATIVE_TRY_ON: false, COMPARE: false, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'UNLOCK_AI_TRY_ON' })} />)
    expect(screen.getByText('Your Store is live on the Free plan.')).toBeInTheDocument()
    expect(screen.getByText('Not included on Free')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /unlock ai try-on/i })).toBeInTheDocument()
  })

  it('explains the fixed Founding Pilot offer without presenting recurring billing', () => {
    render(<MerchantPlanUsage commercial={commercial({ planCode: 'FOUNDING_PILOT', planName: 'Founding Pilot', priceLabel: '$149 / 30 days', status: 'PILOT_ACTIVE', periodStart: '2026-08-01T00:00:00.000Z', periodEnd: '2026-08-31T00:00:00.000Z', daysRemaining: 3, limits: { catalogItems: 50, activeCampaigns: 1, aiCommerceSessions: 1500, standardTryOnGenerations: 3500, normalStoreTraffic: 'unlimited' }, usage: { aiCommerceSessions: 620, activeCampaigns: 0, catalogItems: 12, standardTryOnGenerations: 1420 }, aiCommerceSessionLimit: 1500, aiCommerceSessionRemaining: 880, aiCommerceSessionPercentage: 41, threshold: 'NORMAL', features: { STORE: true, CATALOG: true, CAMPAIGN: true, RECOMMENDATION: true, GENERATIVE_TRY_ON: true, COMPARE: true, BASIC_ANALYTICS: true, ADVANCED_ANALYTICS: false }, primaryAction: 'CONTINUE_AFTER_PILOT', pilotCatalogRange: { min: 8, max: 50 }, setupLabel: 'Assisted setup + weekly review' })} />)
    expect(screen.getByText('$149 / 30 days')).toBeInTheDocument()
    expect(screen.getByText('8–50 frames')).toBeInTheDocument()
    expect(screen.getByText('Assisted setup + weekly review')).toBeInTheDocument()
  })
})

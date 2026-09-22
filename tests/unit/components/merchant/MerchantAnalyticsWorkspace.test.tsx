import { render, screen, within } from '@testing-library/react'
import { MerchantAnalyticsWorkspace } from '@/components/merchant/MerchantAnalyticsWorkspace'
import type { MerchantCommerceIntelligence } from '@/modules/merchant/application/merchant-commerce-intelligence'

function insights(overrides: Partial<MerchantCommerceIntelligence> = {}): MerchantCommerceIntelligence {
  return {
    period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z', timezone: 'UTC' },
    hasActivity: false,
    totals: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 },
    rates: { engagement: null, recommendation: null, tryOn: null, compare: null },
    comparison: {
      previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' },
      previous: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 },
      deltas: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 },
      reliable: false,
    },
    experiencePerformance: { reliable: false, ranked: [], topExperienceId: null, topMetric: null, needsAttentionExperienceId: null },
    sourceHighlights: { topVisitors: null, topDownstreamIntent: null, topHighIntent: null, reliable: false },
    interpretation: { summary: 'No shopper activity yet.', evidence: [], nextAction: 'Ask Agent to review setup' },
    acquisitionSources: [],
    distributionReport: { scope: 'MERCHANT_STORE_CAMPAIGN_SESSIONS', consumerEventBoundary: 'This report contains scoped Store and Campaign signals only.', sources: [], experiences: [] },
    experiences: [],
    ...overrides,
  }
}

describe('MerchantAnalyticsWorkspace', () => {
  it('renders a human-readable empty state without fake zero KPI cards or Agent prompts', () => {
    render(<MerchantAnalyticsWorkspace locale="en" merchantId="merchant-a" insights={insights()} />)
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No shopper activity yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Store' })).toHaveAttribute('href', '/en/merchant/store?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'View Campaigns' })).toHaveAttribute('href', '/en/merchant/campaigns?merchantId=merchant-a')
    expect(screen.queryByRole('heading', { name: 'Shopper activity' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Agent/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ask Agent/)).not.toBeInTheDocument()
  })

  it('shows canonical metrics, preserves no-prior semantics, and does not overstate unreliable comparisons', () => {
    render(<MerchantAnalyticsWorkspace locale="en-GB" merchantId="merchant-a" insights={insights({
      hasActivity: true,
      totals: { visitors: 8, engagedShoppers: 4, recommendationActivity: 3, tryOnCompletions: 2, compareActivity: 1, productClicks: 5, highIntentShoppers: 2 },
      rates: { engagement: 50, recommendation: 37.5, tryOn: 25, compare: 12.5 },
      comparison: {
        previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' },
        previous: { visitors: 0, engagedShoppers: 2, recommendationActivity: 1, tryOnCompletions: 1, compareActivity: 0, productClicks: 2, highIntentShoppers: 1 },
        deltas: { visitors: null, engagedShoppers: 100, recommendationActivity: 200, tryOnCompletions: 100, compareActivity: null, productClicks: 150, highIntentShoppers: 100 },
        reliable: false,
      },
      experiences: [{ id: 'store-1', type: 'STORE', name: 'Main Store', status: 'DRAFT', referenceData: true, visitors: 8, engagedShoppers: 4, recommendationActivity: 3, tryOnCompletions: 2, compareActivity: 1, productClicks: 5, highIntentShoppers: 2 }],
      interpretation: { summary: 'Observed shopper signals are available.', evidence: ['Observed shopper signals are available.', 'The comparison is not reliable.'], nextAction: 'Ask Agent to analyze this Experience' },
    })} />)
    expect(screen.getByRole('heading', { name: 'Shopper activity' })).toBeInTheDocument()
    const visitorCard = screen.getAllByRole('heading', { name: 'Visitors' })[0].closest('article') as HTMLElement
    expect(within(visitorCard).getByText('8')).toBeInTheDocument()
    expect(screen.getByText('No prior activity')).toBeInTheDocument()
    expect(screen.getAllByText('Not enough activity for a reliable comparison')).toHaveLength(3)
    expect(screen.queryByText('+100% vs previous period')).not.toBeInTheDocument()
    const experience = screen.getByRole('heading', { name: 'Main Store' }).closest('li') as HTMLElement
    expect(within(experience).getByText('Draft · private')).toBeInTheDocument()
    expect(within(experience).getByText('Reference / simulation data')).toBeInTheDocument()
    expect(screen.getByText(/Data window · 1 Aug 2026 – 1 Sept 2026 · UTC/)).toBeInTheDocument()
    expect(screen.queryByText(/Ask Agent/)).not.toBeInTheDocument()
    expect(screen.queryByText(/revenue|ROAS|conversion rate|attributed sales/i)).not.toBeInTheDocument()
  })

  it('shows an Experience leader only when the canonical comparison is reliable', () => {
    render(<MerchantAnalyticsWorkspace locale="en" merchantId="merchant-a" insights={insights({
      hasActivity: true,
      totals: { visitors: 5, engagedShoppers: 2, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 2 },
      comparison: { previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' }, previous: { visitors: 3, engagedShoppers: 1, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }, deltas: { visitors: 67, engagedShoppers: 100, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: null }, reliable: true },
      experiencePerformance: { reliable: true, ranked: [], topExperienceId: 'campaign-1', topMetric: 'highIntentShoppers', needsAttentionExperienceId: null },
      experiences: [{ id: 'campaign-1', type: 'CAMPAIGN', name: 'Summer frames', status: 'ACTIVE', referenceData: false, visitors: 5, engagedShoppers: 2, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 2 }],
    })} />)
    expect(screen.getByText('Summer frames led on high-intent shoppers.')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })
})

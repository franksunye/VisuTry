import { render, screen, within } from '@testing-library/react'
import { MerchantAnalyticsWorkspace } from '@/components/merchant/MerchantAnalyticsWorkspace'
import { MerchantExperiencePerformanceChart, merchantDecisionTrendAxisTicks } from '@/components/merchant/MerchantCommerceCharts'
import type { MerchantCommerceIntelligence } from '@/modules/merchant/application/merchant-commerce-intelligence'

function insights(overrides: Partial<MerchantCommerceIntelligence> = {}): MerchantCommerceIntelligence {
  return {
    period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z', timezone: 'UTC' },
    hasActivity: false,
    decisionTrend: [],
    topFrames: [],
    decisionJourney: [],
    totals: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0, favorites: 0, inquiries: 0 },
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
  it('keeps small-count chart axis ticks unique and proportionally spaced', () => {
    expect(merchantDecisionTrendAxisTicks(1)).toEqual([0, 1])
    expect(merchantDecisionTrendAxisTicks(2)).toEqual([0, 1, 2])
    expect(merchantDecisionTrendAxisTicks(4)).toEqual([0, 1, 3, 4])
  })

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
      decisionTrend: [
        { date: '2026-08-18', visitors: 1, engagedShoppers: 1, highIntentShoppers: 1 },
        { date: '2026-08-24', visitors: 3, engagedShoppers: 2, highIntentShoppers: 1 },
      ],
      decisionJourney: [
        { stage: 'VISIT', sessions: 8, available: true },
        { stage: 'ENGAGED', sessions: 4, available: true },
        { stage: 'TRY_ON_COMPLETED', sessions: 2, available: true },
        { stage: 'MERCHANT_CTA', sessions: null, available: false },
      ],
      totals: { visitors: 8, engagedShoppers: 4, recommendationActivity: 3, tryOnCompletions: 2, compareActivity: 1, productClicks: 5, highIntentShoppers: 2, favorites: 4, inquiries: 1 },
      rates: { engagement: 50, recommendation: 37.5, tryOn: 25, compare: 12.5 },
      comparison: {
        previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' },
        previous: { visitors: 0, engagedShoppers: 2, recommendationActivity: 1, tryOnCompletions: 1, compareActivity: 0, productClicks: 2, highIntentShoppers: 1 },
        deltas: { visitors: null, engagedShoppers: 100, recommendationActivity: 200, tryOnCompletions: 100, compareActivity: null, productClicks: 150, highIntentShoppers: 100 },
        reliable: false,
      },
      experiences: [{ id: 'store-1', type: 'STORE', name: 'Main Store', status: 'DRAFT', referenceData: true, visitors: 8, engagedShoppers: 4, recommendationActivity: 3, tryOnCompletions: 2, compareActivity: 1, productClicks: 5, highIntentShoppers: 2 }],
      topFrames: [{ frameId: 'frame-1', sku: 'VT-01', name: 'Aster Round Acetate', imageUrl: '/assets/aster.png', tryOnCount: 3, favoriteCount: 2, compareCount: 1, ctaCount: null, highIntentInteractions: 2, intentScore: 14 }],
      interpretation: { summary: 'Observed shopper signals are available.', evidence: ['Observed shopper signals are available.', 'The comparison is not reliable.'], nextAction: 'Ask Agent to analyze this Experience' },
    })} />)
    const outcomeMetrics = screen.getByRole('region', { name: 'Shopper outcome metrics' })
    expect(outcomeMetrics).toHaveClass('grid-cols-2', 'sm:grid-cols-4')
    expect(within(outcomeMetrics).getByRole('heading', { name: 'High-intent shoppers' })).toHaveClass('line-clamp-2', 'sm:line-clamp-none', 'sm:truncate')
    expect(within(outcomeMetrics).getByRole('heading', { name: 'Visitors' })).toBeInTheDocument()
    expect(within(outcomeMetrics).getByRole('heading', { name: 'Engaged shoppers' })).toBeInTheDocument()
    expect(within(outcomeMetrics).getByRole('heading', { name: 'Product clicks' })).toBeInTheDocument()
    const visitorCard = screen.getAllByRole('heading', { name: 'Visitors' })[0].closest('article') as HTMLElement
    expect(within(visitorCard).getByText('8')).toBeInTheDocument()
    expect(screen.getByText('No prior activity')).toBeInTheDocument()
    expect(screen.getAllByText('Low volume').length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByLabelText('Low volume · comparison withheld').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText('+100% vs previous period')).not.toBeInTheDocument()
    expect(screen.getByText('Main Store')).toBeInTheDocument()
    expect(screen.getByText(/Draft · private/)).toBeInTheDocument()
    expect(screen.getByText('Reference data')).toBeInTheDocument()
    expect(screen.getAllByText('Low volume').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('High intent lead')).not.toBeInTheDocument()
    expect(screen.queryByText('Product clicks lead')).not.toBeInTheDocument()
    expect(screen.getByText(/1 Aug 2026/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Shopper Decision Trend' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'VisuTry Decision Path' })).toBeInTheDocument()
    const decisionPath = screen.getByRole('list', { name: 'VisuTry shopper decision path' })
    expect(within(decisionPath).getByText('Recommendation')).toBeInTheDocument()
    expect(within(decisionPath).getByText('Try-On')).toBeInTheDocument()
    expect(within(decisionPath).getByText('Compare')).toBeInTheDocument()
    expect(within(decisionPath).getByText('High intent')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience performance' })).toBeInTheDocument()
    expect(screen.getByText('Read decision insight')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top frames driving interest' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aster Round Acetate' })).toBeInTheDocument()
    const topFrame = screen.getByRole('heading', { name: 'Aster Round Acetate' }).closest('li') as HTMLElement
    expect(screen.getByRole('link', { name: 'Open Aster Round Acetate in Catalog' })).toHaveAttribute('href', '/en-GB/merchant/catalog?merchantId=merchant-a&frameId=frame-1')
    expect(within(topFrame).getByText('3')).toBeInTheDocument()
    expect(within(topFrame).getByText('Try-Ons')).toBeInTheDocument()
    expect(within(topFrame).getByText('Favorites')).toBeInTheDocument()
    expect(within(topFrame).getByRole('list', { name: 'Aster Round Acetate observed signals' }).querySelectorAll('li')).toHaveLength(2)
    const intentSignals = screen.getByRole('region', { name: 'Intent signals at a glance' })
    const intentMetrics = intentSignals.querySelector('dl') as HTMLElement
    expect(within(intentMetrics).getByText('Favorites')).toBeInTheDocument()
    expect(within(intentMetrics).getByText('4')).toBeInTheDocument()
    expect(within(intentMetrics).getByText('Product clicks')).toBeInTheDocument()
    expect(within(intentMetrics).getByText('5')).toBeInTheDocument()
    expect(within(intentMetrics).getByText('Inquiries')).toBeInTheDocument()
    expect(within(intentMetrics).getByText('1')).toBeInTheDocument()
    expect(intentSignals.querySelectorAll('a')).toHaveLength(0)
    expect(within(decisionPath).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/Ask Agent/)).not.toBeInTheDocument()
    expect(screen.getByText('Observed shopper actions only; no purchase or revenue attribution.')).toBeInTheDocument()
    expect(screen.queryByText(/ROAS|conversion rate|attributed sales/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('progressbar', { name: /relative count, not conversion/i })).toHaveLength(5)
  })

  it('shows an Experience leader only when the canonical comparison is reliable', () => {
    render(<MerchantAnalyticsWorkspace locale="en" merchantId="merchant-a" insights={insights({
      hasActivity: true,
      totals: { visitors: 5, engagedShoppers: 2, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 2, favorites: 0, inquiries: 0 },
      comparison: { previousPeriod: { from: '2026-07-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' }, previous: { visitors: 3, engagedShoppers: 1, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }, deltas: { visitors: 67, engagedShoppers: 100, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: null }, reliable: true },
      experiencePerformance: { reliable: true, ranked: [], topExperienceId: 'campaign-1', topMetric: 'highIntentShoppers', needsAttentionExperienceId: null },
      experiences: [{ id: 'campaign-1', type: 'CAMPAIGN', name: 'Summer frames', status: 'ACTIVE', referenceData: false, visitors: 5, engagedShoppers: 2, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 2 }],
    })} />)
    expect(screen.getByText('High intent lead')).toBeInTheDocument()
    const experience = screen.getByText('Summer frames').closest('li') as HTMLElement
    expect(within(experience).getByText(/Live/)).toBeInTheDocument()
    expect(within(experience).getByText('High intent lead')).toBeInTheDocument()
    expect(within(experience).getByRole('img', { name: '5 of 5 visitors on the relative count scale' })).toBeInTheDocument()
    expect(within(experience).getByRole('link', { name: 'Open Summer frames' })).toHaveAttribute('href', '/en/merchant/campaigns/campaign-1?merchantId=merchant-a')
    expect(screen.queryByText(/led on .* in this window/)).not.toBeInTheDocument()
  })

  it('keeps the quiet row insight limited to reliable metrics displayed in the module', () => {
    render(<MerchantExperiencePerformanceChart
      locale="en"
      merchantId="merchant-a"
      experiences={[
        { id: 'store-a', type: 'STORE', name: 'Flagship Store', status: 'ACTIVE', referenceData: false, visitors: 8, highIntentShoppers: 2, productClicks: 5 },
        { id: 'campaign-b', type: 'CAMPAIGN', name: 'Summer Campaign', status: 'DRAFT', referenceData: false, visitors: 4, highIntentShoppers: 1, productClicks: 2 },
      ]}
      performance={{ reliable: true, ranked: [], topExperienceId: 'store-a', topMetric: 'productClicks', needsAttentionExperienceId: 'campaign-b' }}
    />)

    const leader = screen.getByText('Flagship Store').closest('li') as HTMLElement
    expect(within(leader).getByText('Product clicks lead')).toBeInTheDocument()
    expect(within(leader).getByText('5')).toHaveClass('text-blue-700')
    expect(within(leader).getByRole('img', { name: '8 of 8 visitors on the relative count scale' })).toBeInTheDocument()
    expect(within(leader).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Summer Campaign' })).toHaveAttribute('href', '/en/merchant/campaigns/campaign-b?merchantId=merchant-a')
    expect(screen.queryByText('High intent lead')).not.toBeInTheDocument()
  })
})

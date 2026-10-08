import { render, screen, within } from '@testing-library/react'
import { MerchantOperatingHome } from '@/components/merchant/MerchantOperatingHome'
import type { MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))

function home(overrides: Partial<MerchantOperatingHomeReadModel> = {}): MerchantOperatingHomeReadModel {
  return {
    merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', referenceData: false },
    store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
    catalog: { total: 1, ready: 1, issueCount: 0, primaryIssueFrameId: null },
    campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
    shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 0 }], decisionTrend: [] },
    commercial: { status: 'FREE', planName: 'Free', threshold: null, primaryAction: 'UNLOCK_AI_TRY_ON', attention: false },
    ...overrides,
  }
}

describe('MerchantOperatingHome', () => {
  it('shows one Store recommendation and a truthful empty activity state', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Store' })).toHaveAttribute('href', '/en/merchant/store?merchantId=merchant-a')
    expect(screen.getByText('No shopper activity yet')).toBeInTheDocument()
    expect(screen.queryByText('Connect your Agent')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Attention' })).not.toBeInTheDocument()
  })

  it('shows the existing processing confirmation inside Operating Home without changing query-free Home', () => {
    const { rerender } = render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} />)
    expect(screen.queryByText('Plan update in progress')).not.toBeInTheDocument()

    rerender(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} billingState="processing" billingPlan="LAUNCH" billingCommercial={{ planCode: 'FREE', status: 'FREE', planName: 'Free' } as never} />)
    expect(screen.getByRole('status')).toHaveTextContent('Your payment is being confirmed')
    expect(screen.getByRole('status')).toHaveTextContent('Your plan and feature access will update after confirmation')
  })

  it('shows the same no-change cancellation feedback in Operating Home', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} billingState="cancelled" />)
    expect(screen.getByRole('status')).toHaveTextContent('No changes were made')
    expect(screen.getByRole('status')).toHaveTextContent('Your current Store and access remain unchanged')
  })

  it('keeps Business status as one flat surface with only list-row separators', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} />)
    const businessStatus = screen.getByRole('region', { name: 'Business status' })
    const list = within(businessStatus).getByRole('list')
    const rows = within(list).getAllByRole('listitem')

    expect(businessStatus).toHaveClass('rounded-2xl', 'bg-white')
    expect(list).toHaveClass('divide-y')
    expect(rows).toHaveLength(3)
    expect(list.querySelectorAll(':scope > li article, :scope > li section')).toHaveLength(0)
    expect(rows.every((row) => !row.className.split(/\s+/).some((className) => /^border(?:-|$)/.test(className)))).toBe(true)
  })

  it('surfaces Catalog attention before Store work', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({ catalog: { total: 2, ready: 1, issueCount: 1, primaryIssueFrameId: 'frame-1' } })} />)
    expect(screen.getAllByRole('link', { name: 'Review Catalog' })).toHaveLength(2)
    expect(screen.getByText('Catalog needs review')).toBeInTheDocument()
  })

  it('carries a deterministic Catalog issue ID only on Catalog actions and falls back when unavailable', () => {
    const { rerender } = render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      store: { exists: true, status: 'ACTIVE', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
      catalog: { total: 2, ready: 1, issueCount: 1, primaryIssueFrameId: 'frame-issue' },
    })} />)

    expect(screen.getAllByRole('link', { name: 'Review Catalog' }).every((link) => link.getAttribute('href') === '/en/merchant/catalog?merchantId=merchant-a&frameId=frame-issue')).toBe(true)
    expect(within(screen.getByRole('region', { name: 'Needs attention' })).getByRole('link', { name: 'Review Catalog' })).toHaveClass('min-h-11', 'focus-visible:ring-2')
    expect(screen.getByRole('link', { name: 'Manage Catalog' })).toHaveAttribute('href', '/en/merchant/catalog?merchantId=merchant-a')

    rerender(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      catalog: { total: 2, ready: 1, issueCount: 1, primaryIssueFrameId: null },
    })} />)
    expect(screen.getAllByRole('link', { name: 'Review Catalog' }).every((link) => link.getAttribute('href') === '/en/merchant/catalog?merchantId=merchant-a')).toBe(true)
  })

  it('shows real shopper outcomes and routes to Analytics', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      store: { exists: true, status: 'ACTIVE', selectedProductCount: 2, eligibleProductCount: 2, readiness: 'READY' },
      merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', referenceData: true },
      shopper: { hasActivity: true, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 12 }, { label: 'High-intent shoppers', value: 3 }], decisionTrend: [
        { date: '2026-09-28', visitors: 2, engagedShoppers: 1, highIntentShoppers: 0 },
        { date: '2026-09-29', visitors: 3, engagedShoppers: 2, highIntentShoppers: 1 },
      ] },
    })} />)
    expect(screen.getByRole('link', { name: 'Review Analytics' })).toHaveAttribute('href', '/en/merchant/analytics?merchantId=merchant-a')
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.queryByText('No shopper activity yet')).not.toBeInTheDocument()
    expect(screen.queryByText('Reference / simulation')).not.toBeInTheDocument()
    expect(screen.getByRole('figure', { name: /Visitors over the last 7 days/ })).toBeInTheDocument()
  })

  it('does not treat Agent absence or archived Campaigns as Home attention', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      campaigns: { total: 2, active: 0, draft: 1, archived: 1, needsAttention: 0 },
    })} />)
    expect(screen.getByText('0 active · 1 draft · 1 archived')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Attention' })).not.toBeInTheDocument()
    expect(screen.queryByText('Connect your Agent')).not.toBeInTheDocument()
  })

  it('promotes a hard commercial blocker and keeps Plan attention status-only', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      catalog: { total: 2, ready: 1, issueCount: 1, primaryIssueFrameId: 'frame-issue' },
      commercial: { status: 'PAST_DUE', planName: 'Growth', threshold: null, primaryAction: 'RESOLVE_PAYMENT', attention: true },
    })} />)
    expect(screen.getByText('Plan & Usage needs attention')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review payment status' })).toHaveAttribute('href', '/en/merchant/plan?merchantId=merchant-a')
    expect(screen.getByRole('link', { name: 'Review Catalog' })).toHaveAttribute('href', '/en/merchant/catalog?merchantId=merchant-a&frameId=frame-issue')
    expect(within(screen.getByRole('region', { name: 'Needs attention' })).queryByRole('link', { name: 'Review Plan & Usage' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /payment|plan & usage/i })).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps a 70% NOTICE informational instead of showing commercial Attention', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      commercial: { status: 'USAGE_WARNING', planName: 'Growth', threshold: 'NOTICE', primaryAction: 'UPGRADE_CAPACITY', attention: false },
    })} />)
    expect(screen.queryByText('Plan & Usage needs attention')).not.toBeInTheDocument()
  })

  it('surfaces a missing or incomplete Store as Store Attention', () => {
    const { rerender } = render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      store: { exists: false, status: null, selectedProductCount: 0, eligibleProductCount: 0, readiness: null },
    })} />)
    expect(screen.getByText('Store needs setup')).toBeInTheDocument()

    rerender(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      store: { exists: true, status: 'DRAFT', selectedProductCount: 0, eligibleProductCount: 0, readiness: 'INCOMPLETE' },
    })} />)
    expect(screen.getByText('Store needs review')).toBeInTheDocument()
  })
})

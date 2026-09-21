import { render, screen } from '@testing-library/react'
import { MerchantOperatingHome } from '@/components/merchant/MerchantOperatingHome'
import type { MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'

function home(overrides: Partial<MerchantOperatingHomeReadModel> = {}): MerchantOperatingHomeReadModel {
  return {
    merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha' },
    store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
    catalog: { total: 1, ready: 1, issueCount: 0 },
    campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
    shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 0 }] },
    commercial: { status: 'FREE', planName: 'Free', attention: false },
    ...overrides,
  }
}

describe('MerchantOperatingHome', () => {
  it('shows one Store recommendation and a truthful empty activity state', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home()} />)
    expect(screen.getByRole('heading', { name: 'Workspace overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Store' })).toHaveAttribute('href', '/en/merchant/store?merchantId=merchant-a')
    expect(screen.getByText('No shopper activity yet')).toBeInTheDocument()
    expect(screen.queryByText('Connect your Agent')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Attention' })).not.toBeInTheDocument()
  })

  it('surfaces Catalog attention before Store work', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({ catalog: { total: 2, ready: 1, issueCount: 1 } })} />)
    expect(screen.getAllByRole('link', { name: 'Review Catalog' })).toHaveLength(2)
    expect(screen.getByText('Catalog needs review')).toBeInTheDocument()
  })

  it('shows real shopper outcomes and routes to Analytics', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      store: { exists: true, status: 'ACTIVE', selectedProductCount: 2, eligibleProductCount: 2, readiness: 'READY' },
      shopper: { hasActivity: true, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 12 }, { label: 'High-intent shoppers', value: 3 }] },
    })} />)
    expect(screen.getByRole('link', { name: 'Review Analytics' })).toHaveAttribute('href', '/en/merchant/analytics?merchantId=merchant-a')
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.queryByText('No shopper activity yet')).not.toBeInTheDocument()
  })

  it('does not treat Agent absence or archived Campaigns as Home attention', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({
      campaigns: { total: 2, active: 0, draft: 1, archived: 1, needsAttention: 0 },
    })} />)
    expect(screen.getByText('0 active · 1 draft · 1 archived')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Attention' })).not.toBeInTheDocument()
    expect(screen.queryByText('Connect your Agent')).not.toBeInTheDocument()
  })

  it('shows commercial attention without offering a billing mutation', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" home={home({ commercial: { status: 'PAST_DUE', planName: 'Growth', attention: true } })} />)
    expect(screen.getByText('Plan & Usage needs attention')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Plan & Usage' })).toHaveAttribute('href', '/en/merchant/plan?merchantId=merchant-a')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

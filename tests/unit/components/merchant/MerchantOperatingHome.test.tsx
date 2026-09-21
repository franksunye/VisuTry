import { render, screen } from '@testing-library/react'
import { MerchantOperatingHome } from '@/components/merchant/MerchantOperatingHome'

describe('MerchantOperatingHome', () => {
  it('keeps the operating home compact and links to workspace areas', () => {
    render(<MerchantOperatingHome locale="en" merchantId="merchant-a" control={{
      merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', websiteUrl: null, status: 'ACTIVE', referenceData: false },
      activation: { storePreviewedAt: '2026-09-21T00:00:00.000Z' },
      store: { id: 'store-a', type: 'STORE', name: 'Alpha Store', slug: 'alpha', status: 'DRAFT', frameCount: 1, referenceData: false, publicPath: '/en/store/alpha', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, selectedFrames: [], readiness: { status: 'VALID', validCount: 1, invalidCount: 0, issues: [] }, lastOperation: null, policy: { objective: null, gate: null, presentation: 'PRODUCT_FIRST' }, updatedAt: '2026-09-21T00:00:00.000Z' },
      catalog: { total: 1, active: 1, valid: 1, invalid: 0, sourceCounts: [] }, experiences: [], activeCampaignCount: 0, shopperActivityAvailable: false, credentialUsage: { active: 0 },
    }} />)
    expect(screen.getByRole('heading', { name: 'Workspace overview' })).toBeInTheDocument()
    expect(screen.getByText('Store · Draft')).toBeInTheDocument()
    expect(screen.getByText('Catalog · 1')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Open Store' })[0]).toHaveAttribute('href', '/en/merchant/store?merchantId=merchant-a')
    expect(screen.getAllByRole('link', { name: 'Manage Catalog' })[0]).toHaveAttribute('href', '/en/merchant/catalog?merchantId=merchant-a')
  })
})

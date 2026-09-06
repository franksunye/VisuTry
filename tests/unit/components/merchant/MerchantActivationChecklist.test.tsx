import { render, screen } from '@testing-library/react'
import { MerchantActivationChecklist } from '@/components/merchant/MerchantActivationChecklist'
import type { MerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'

function control(overrides: Partial<MerchantControlCenter> = {}): MerchantControlCenter {
  return {
    merchant: { id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', websiteUrl: null, status: 'ACTIVE', referenceData: false },
    store: null,
    catalog: { total: 0, active: 0, valid: 0, invalid: 0, sourceCounts: [] },
    experiences: [],
    activeCampaignCount: 0,
    shopperActivityAvailable: false,
    credentialUsage: { active: 0 },
    ...overrides,
  }
}

describe('MerchantActivationChecklist', () => {
  it('shows the first-product CTA for a new empty Merchant', () => {
    render(<MerchantActivationChecklist control={control()} />)

    expect(screen.getByRole('heading', { name: 'Get your Store ready' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add your first product/i })).toHaveAttribute('href', '#catalog')
    expect(screen.getByText('Start with one eyewear product to see the activation path.')).toBeInTheDocument()
  })

  it('keeps an invalid or pending item in the first-product step', () => {
    render(<MerchantActivationChecklist control={control({
      catalog: { total: 1, active: 1, valid: 0, invalid: 1, sourceCounts: [{ source: 'EXTERNAL', count: 1 }] },
    })} />)

    expect(screen.getByRole('link', { name: 'Open Catalog' })).toHaveAttribute('href', '#catalog')
    expect(screen.getByText('Your product is in the Catalog and is still being prepared.')).toBeInTheDocument()
  })

  it('continues to Store preview once a usable product is available', () => {
    render(<MerchantActivationChecklist control={control({
      catalog: { total: 1, active: 1, valid: 1, invalid: 0, sourceCounts: [{ source: 'MANUAL', count: 1 }] },
      store: { id: 'store-a', type: 'STORE', name: 'Store', slug: 'store', status: 'DRAFT', frameCount: 1, referenceData: false, publicPath: '/en/store/merchant-a', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, selectedFrames: [], readiness: { status: 'VALID', validCount: 1, invalidCount: 0, issues: [] }, lastOperation: null, policy: { objective: null, gate: null, presentation: 'PRODUCT_FIRST' }, updatedAt: '2026-09-07T00:00:00.000Z' },
    })} />)

    expect(screen.getByRole('link', { name: /preview your store/i })).toHaveAttribute('href', '#store')
    expect(screen.getByText('Review the Store presentation before it is public.')).toBeInTheDocument()
  })

  it('does not take over an already active Store workspace', () => {
    const { container } = render(<MerchantActivationChecklist control={control({ store: { id: 'store-a', type: 'STORE', name: 'Store', slug: 'store', status: 'ACTIVE', frameCount: 1, referenceData: false, publicPath: '/en/store/merchant-a', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, selectedFrames: [], readiness: { status: 'VALID', validCount: 1, invalidCount: 0, issues: [] }, lastOperation: null, policy: { objective: null, gate: null, presentation: 'PRODUCT_FIRST' }, updatedAt: '2026-09-07T00:00:00.000Z' } })} />)

    expect(container).toBeEmptyDOMElement()
  })
})

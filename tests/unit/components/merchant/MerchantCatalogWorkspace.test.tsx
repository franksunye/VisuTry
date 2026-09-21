import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantCatalogWorkspace } from '@/components/merchant/MerchantCatalogWorkspace'

jest.mock('@/components/merchant/MerchantCatalogSelfService', () => ({
  MerchantCatalogSelfService: () => <div>catalog intake</div>,
}))

const item = {
  id: 'frame-2', sku: null, name: 'Far beyond the first page', brand: 'North Star', imageUrl: 'https://cdn.example.test/frame.jpg',
  productUrl: 'https://shop.example.test/products/frame-2', externalId: 'external-2', price: 12900, currency: 'USD', shape: 'round', source: 'EXTERNAL', status: 'ACTIVE',
  presentation: { state: 'READY' as const, label: 'Ready', issueSummary: null },
}

function response() {
  return { success: true, data: { items: [item], nextCursor: null, summary: { total: 2, ready: 1, needsReview: 1, needsAttention: 0 } } }
}

describe('MerchantCatalogWorkspace', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response() }) as jest.Mock
  })

  it('renders resource health and searches through the server-backed Catalog', async () => {
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)

    expect(await screen.findByRole('heading', { name: 'Catalog' })).toBeInTheDocument()
    expect(await screen.findByText('Far beyond the first page')).toBeInTheDocument()
    expect(screen.getAllByText('Needs enrichment').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByRole('textbox', { name: 'Search full catalog' }), { target: { value: 'beyond' } })
    fireEvent.submit(screen.getByRole('textbox', { name: 'Search full catalog' }).closest('form')!)

    await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('search=beyond'), expect.objectContaining({ cache: 'no-store' })))
  })
})

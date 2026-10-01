import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('renders canonical health counts and keeps readiness filtering server-backed', async () => {
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)

    const health = await screen.findByLabelText('Catalog health')
    expect(within(health).getByText('Total').parentElement).toHaveTextContent('2')
    expect(within(health).getByText('Ready').parentElement).toHaveTextContent('1')
    expect(within(health).getByText('Needs enrichment').parentElement).toHaveTextContent('1')
    expect(within(health).getByText('Needs attention').parentElement).toHaveTextContent('0')

    fireEvent.change(screen.getByRole('combobox', { name: 'Filter catalog readiness' }), { target: { value: 'NEEDS_ATTENTION' } })
    await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('readiness=NEEDS_ATTENTION'), expect.objectContaining({ cache: 'no-store' })))
  })

  it('keeps Add products and edit cancel as UI-only until an explicit save', async () => {
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)

    const addProducts = await screen.findByRole('button', { name: 'Add products' })
    fireEvent.click(addProducts)
    expect(addProducts).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('catalog intake')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('textbox', { name: 'Product name' })).toHaveValue(item.name)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Product name' })).not.toBeInTheDocument())
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows and persists the existing product price in the correction form', async () => {
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const price = await screen.findByRole('spinbutton', { name: 'Price' })
    expect(price).toHaveValue(129)
    fireEvent.change(price, { target: { value: '145.50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/merchant/merchant-a/catalog/frame-2',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('14550'),
      }),
    ))
  })
})

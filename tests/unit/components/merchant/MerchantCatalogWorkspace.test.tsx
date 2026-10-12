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
  return { success: true, data: { items: [item], nextCursor: null, summary: { total: 2, ready: 1, needsReview: 1, needsAttention: 0 }, focusedFrame: null } }
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

  it('archives only after explicit approval and refreshes the active view', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'frame-2', status: 'INACTIVE' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        success: true, data: { items: [], nextCursor: null, summary: { total: 2, archived: 1, ready: 0, needsReview: 1, needsAttention: 0 }, focusedFrame: null },
      }) })
    global.fetch = fetchMock as jest.Mock
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)
    fireEvent.click(await screen.findByRole('button', { name: `Archive ${item.name}` }))
    expect(screen.getByText(/Remove this product from current Catalog/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm archive' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/merchant/merchant-a/catalog/frame-2/lifecycle',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'ARCHIVE', approved: true }) }),
    ))
    expect(await screen.findByText('No products match this view')).toBeInTheDocument()
  })

  it('shows archived products separately and requires a confirmed Restore action', async () => {
    const archivedItem = { ...item, status: 'INACTIVE' }
    const archivedData = { ...response(), data: { ...response().data, items: [archivedItem], summary: { total: 2, archived: 1, ready: 1, needsReview: 0, needsAttention: 0 } } }
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response() })
      .mockResolvedValueOnce({ ok: true, json: async () => archivedData })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'frame-2', status: 'ACTIVE' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...archivedData, data: { ...archivedData.data, items: [] } }) })
    global.fetch = fetchMock as jest.Mock
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)
    await screen.findByText(item.name)
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter catalog readiness' }), { target: { value: 'ARCHIVED' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('readiness=ARCHIVED'), expect.any(Object)))
    fireEvent.click(await screen.findByRole('button', { name: `Restore ${item.name}` }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/merchant/merchant-a/catalog/frame-2/lifecycle',
      expect.objectContaining({ body: JSON.stringify({ action: 'RESTORE', approved: true }) }),
    ))
  })

  it('never sends DELETE until explicit confirmation and reloads Catalog after success', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'frame-2' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { items: [], nextCursor: null, summary: { total: 0, ready: 0, needsReview: 0, needsAttention: 0 }, focusedFrame: null } }) })
    global.fetch = fetchMock as jest.Mock

    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)
    fireEvent.click(await screen.findByRole('button', { name: `Delete ${item.name}` }))
    expect(screen.getByText(/Permanently delete/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/merchant/merchant-a/catalog/frame-2', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ approved: true }),
    })))
    expect(await screen.findByText('Your Catalog is empty')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retains the product and displays a clear error when deletion is blocked', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response() })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ success: false, error: 'PRODUCT_IN_USE', message: 'This product is used by a Store or shopper history.' }) })
    global.fetch = fetchMock as jest.Mock
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" />)
    fireEvent.click(await screen.findByRole('button', { name: `Delete ${item.name}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This product is used by a Store or shopper history.')
    expect(screen.getByText(item.name)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves a contextual frame outside the first page, focuses it, and waits for explicit Edit', async () => {
    const focused = { ...item, id: 'frame-51', name: 'Frame outside first 50' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...response(), data: { ...response().data, focusedFrame: focused } }),
    }) as jest.Mock

    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" initialFrameId="frame-51" />)

    const row = await screen.findByRole('article', { name: 'Focused product Frame outside first 50' })
    expect(row).toHaveAttribute('id', 'merchant-catalog-frame-frame-51')
    expect(row).toHaveAttribute('data-focused-frame', 'true')
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('frameId=frame-51'), expect.objectContaining({ cache: 'no-store' }))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }))
  })

  it('stops pinning the contextual frame when the merchant changes the active filter', async () => {
    const focused = { ...item, id: 'frame-51', name: 'Frame outside first 50' }
    let resolveFilteredResponse: ((value: { ok: boolean; json: () => Promise<ReturnType<typeof response>> }) => void) | undefined
    const filteredResponse = new Promise<{ ok: boolean; json: () => Promise<ReturnType<typeof response>> }>((resolve) => {
      resolveFilteredResponse = resolve
    })
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...response(), data: { ...response().data, focusedFrame: focused } }) })
      .mockReturnValueOnce(filteredResponse) as jest.Mock

    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" initialFrameId="frame-51" />)
    expect(await screen.findByRole('article', { name: 'Focused product Frame outside first 50' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter catalog readiness' }), { target: { value: 'NEEDS_REVIEW' } })

    expect(screen.queryByLabelText('Focused product Frame outside first 50')).not.toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
    const fetchMock = global.fetch as jest.Mock
    expect(fetchMock.mock.calls[0][0]).toContain('frameId=frame-51')
    expect(fetchMock.mock.calls[1][0]).not.toContain('frameId=frame-51')
    resolveFilteredResponse?.({ ok: true, json: async () => response() })
    await waitFor(() => expect(screen.queryByLabelText('Focused product Frame outside first 50')).not.toBeInTheDocument())
  })

  it('uses the ordinary Catalog list for a missing or foreign focused frame', async () => {
    render(<MerchantCatalogWorkspace merchantId="merchant-a" locale="en" initialFrameId="not-owned-here" />)

    expect(await screen.findByText('Far beyond the first page')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Focused product/)).not.toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('frameId=not-owned-here'), expect.objectContaining({ cache: 'no-store' }))
  })
})

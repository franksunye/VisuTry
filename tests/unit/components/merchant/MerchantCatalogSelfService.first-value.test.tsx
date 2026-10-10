import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MerchantCatalogSelfService } from '@/components/merchant/MerchantCatalogSelfService'

jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({
  recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true),
}))

const originalFetch = global.fetch

function response(data: unknown, ok = true) {
  return { ok, json: async () => ok ? { success: true, data } : { success: false, message: 'This website could not be inspected.' } } as Response
}

afterEach(() => { global.fetch = originalFetch; jest.clearAllMocks() })

function mockCatalogAndInspect(inspection?: unknown, inspectionOk = true) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith('/catalog/inspect') && init?.method === 'POST') {
      return response(inspection, inspectionOk)
    }
    return response({ items: [], nextCursor: null })
  })
  global.fetch = fetchMock as typeof fetch
  return fetchMock
}

const emptyProposal = {
  requiresApproval: true,
  catalogCapacity: { current: 0, limit: 50, remaining: 50, proposedNew: 0, overLimit: 0 },
  sourceSummary: {
    sourceUrls: ['https://shop.example.test'], sourceHostnames: ['shop.example.test'],
    fetchedPageCount: 1, foundCount: 0, readyToImport: 0, importReady: 0,
    recommendationReady: 0, needsReview: 0, invalid: 0, reasonDistribution: {}, sourceIssues: [],
  },
  candidates: [], importReady: [],
}


const importableProposal = {
  ...emptyProposal,
  catalogCapacity: { ...emptyProposal.catalogCapacity, proposedNew: 1 },
  sourceSummary: { ...emptyProposal.sourceSummary, foundCount: 1, readyToImport: 1, importReady: 1 },
  importReady: [{ sku: 'STALE-001', name: 'Old inspected frame', imageUrl: 'https://cdn.example.test/old.png', source: 'EXTERNAL' }],
}

describe('Merchant First Value source choice and recovery', () => {
  it('prefills a saved signup website for inspection, without automatically importing it', async () => {
    const fetchMock = mockCatalogAndInspect(emptyProposal)
    render(<MerchantCatalogSelfService merchantId="merchant-a" initialTotal={0}
      initialWebsiteUrl="https://shop.example.test" showResourceList={false} />)
    expect(screen.getByRole('tab', { name: 'Store URL' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Store or product URL')).toHaveValue('https://shop.example.test')
    expect(screen.getByText(/It has not been inspected or imported yet/)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/catalog?limit=50'), expect.anything()))
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/catalog/inspect'))).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/merchant/merchant-a/catalog/inspect',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ sourceType: 'url', sourceUrls: ['https://shop.example.test'] }) }),
    ))
    expect(fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/merchant/merchant-a/catalog' && init?.method === 'POST')).toHaveLength(0)
  })

  it('keeps manual first-product entry as default when no website was supplied', () => {
    mockCatalogAndInspect()
    render(<MerchantCatalogSelfService merchantId="merchant-b" initialTotal={0} showResourceList={false} />)
    expect(screen.getByRole('tab', { name: 'Add manually' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Product name for product 1')).toBeInTheDocument()
  })

  it('offers non-destructive CSV/manual recovery after URL inspection fails', async () => {
    const fetchMock = mockCatalogAndInspect(null, false)
    render(<MerchantCatalogSelfService merchantId="merchant-c" initialTotal={0}
      initialWebsiteUrl="https://shop.example.test" showResourceList={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('This website could not be inspected.')).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole('button', { name: 'Add one product manually' }))
    expect(screen.getByRole('tab', { name: 'Add manually' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Product name for product 1')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/merchant/merchant-c/catalog' && init?.method === 'POST')).toHaveLength(0)
  })

  it('shows an empty-inspection recovery instead of a dead-end import button', async () => {
    mockCatalogAndInspect(emptyProposal)
    render(<MerchantCatalogSelfService merchantId="merchant-d" initialTotal={0}
      initialWebsiteUrl="https://shop.example.test" showResourceList={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    expect(await screen.findByText(/No importable products were found/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve and import 0' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Upload CSV' }))
    expect(screen.getByRole('tab', { name: 'Upload CSV' })).toHaveAttribute('aria-selected', 'true')
  })

  it('revokes an importable URL proposal immediately when the URL changes', async () => {
    const fetchMock = mockCatalogAndInspect(importableProposal)
    render(<MerchantCatalogSelfService merchantId="merchant-e" initialTotal={0}
      initialWebsiteUrl="https://shop.example.test/old" showResourceList={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    expect(await screen.findByRole('button', { name: 'Approve and import 1' })).toBeEnabled()

    fireEvent.change(screen.getByLabelText('Store or product URL'), { target: { value: 'https://shop.example.test/new' } })
    expect(screen.queryByRole('button', { name: 'Approve and import 1' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/merchant/merchant-e/catalog' && init?.method === 'POST')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/merchant/merchant-e/catalog/inspect',
      expect.objectContaining({ body: JSON.stringify({ sourceType: 'url', sourceUrls: ['https://shop.example.test/new'] }) }),
    ))
  })

  it('revokes an importable CSV proposal when a different CSV is selected', async () => {
    const fetchMock = mockCatalogAndInspect(importableProposal)
    render(<MerchantCatalogSelfService merchantId="merchant-f" initialTotal={0} showResourceList={false} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Upload CSV' }))
    const input = screen.getByLabelText('Product CSV')
    fireEvent.change(input, { target: { files: [new File(['sku,name\\nA,Old'], 'old.csv', { type: 'text/csv' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    expect(await screen.findByRole('button', { name: 'Approve and import 1' })).toBeEnabled()

    fireEvent.change(input, { target: { files: [new File(['sku,name\\nB,New'], 'new.csv', { type: 'text/csv' })] } })
    expect(screen.queryByRole('button', { name: 'Approve and import 1' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/merchant/merchant-f/catalog' && init?.method === 'POST')).toHaveLength(0)
  })

  it('discards an in-flight inspection response after its source is edited', async () => {
    let resolveInspect: ((value: Response) => void) | undefined
    const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/catalog/inspect') && init?.method === 'POST') {
        return new Promise<Response>((resolve) => { resolveInspect = resolve })
      }
      return Promise.resolve(response({ items: [], nextCursor: null }))
    })
    global.fetch = fetchMock as typeof fetch
    render(<MerchantCatalogSelfService merchantId="merchant-g" initialTotal={0}
      initialWebsiteUrl="https://shop.example.test/old" showResourceList={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    await waitFor(() => expect(resolveInspect).toBeDefined())
    fireEvent.change(screen.getByLabelText('Store or product URL'), { target: { value: 'https://shop.example.test/new' } })
    await act(async () => { resolveInspect?.(response(importableProposal)) })
    expect(screen.queryByRole('button', { name: 'Approve and import 1' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/merchant/merchant-g/catalog' && init?.method === 'POST')).toHaveLength(0)
  })

})

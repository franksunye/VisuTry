import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
})

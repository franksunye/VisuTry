import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MerchantCatalogSelfService } from '@/components/merchant/MerchantCatalogSelfService'

jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({ recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true) }))

function proposal(overLimit: number) {
  const proposedNew = 49
  const candidate = {
    sku: 'SKU-NEW-1', name: 'New frame', brand: null, imageUrl: 'https://cdn.example.test/frame.jpg', productUrl: null,
    price: null, currency: 'USD', shape: 'round', material: null, color: null, widthClass: null, styleTags: [], collectionTags: [],
    source: 'CSV', externalId: null, identity: { type: 'MERCHANT_SKU', value: 'SKU-NEW-1' }, shapeSource: 'STRUCTURED_FIELD', shapeConfidence: 0.99,
    importReady: true, recommendationReady: true, recommendationIssues: [], readiness: 'RECOMMENDATION_READY', status: 'READY', dedupeStatus: 'NEW', issues: [],
  }
  return {
    requiresApproval: true,
    catalogCapacity: { current: 2, limit: 50, remaining: 48, proposedNew, overLimit },
    sourceSummary: {
      sourceUrls: [], sourceHostnames: [], platforms: [], fetchedPageCount: 0, foundCount: proposedNew,
      readyToImport: proposedNew, importReady: proposedNew, recommendationReady: proposedNew, needsReview: 0, invalid: 0,
      reasonDistribution: {}, sourceIssues: [],
    },
    candidates: [candidate],
    importReady: Array.from({ length: proposedNew }, (_, index) => ({ sku: `SKU-NEW-${index + 1}`, name: `New frame ${index + 1}` })),
  }
}

function jsonResponse(data: unknown): Response {
  return { ok: true, json: async () => ({ success: true, data }) } as Response
}

describe('MerchantCatalogSelfService quota review', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  async function inspectWithCapacity(overLimit: number) {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/catalog/inspect')) return jsonResponse(proposal(overLimit))
      if (init?.method === 'POST') return jsonResponse({ imported: 49, created: 49, updated: 0 })
      return jsonResponse({ items: [], nextCursor: null })
    })
    global.fetch = fetchMock as typeof fetch
    render(<MerchantCatalogSelfService merchantId="merchant-quota" initialTotal={2} showResourceList={false} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/merchant/merchant-quota/catalog?limit=50', expect.anything()))
    fireEvent.click(screen.getByRole('tab', { name: 'Upload CSV' }))
    const csv = new File(['sku,name,imageUrl,shape\nSKU-NEW-1,New frame,https://cdn.example.test/frame.jpg,round'], 'catalog.csv', { type: 'text/csv' })
    fireEvent.change(screen.getByLabelText('Product CSV'), { target: { files: [csv] } })
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    const approve = await screen.findByRole('button', { name: 'Approve and import 49' })
    return { approve, fetchMock }
  }

  it('shows the exact overage and disables approval for an all-or-nothing import', async () => {
    const { approve, fetchMock } = await inspectWithCapacity(1)
    const capacity = screen.getByText('Over limit').closest('dl')

    expect(capacity).not.toBeNull()
    expect(within(capacity as HTMLElement).getByText('2')).toBeInTheDocument()
    expect(within(capacity as HTMLElement).getByText('50')).toBeInTheDocument()
    expect(within(capacity as HTMLElement).getByText('48')).toBeInTheDocument()
    expect(within(capacity as HTMLElement).getByText('49')).toBeInTheDocument()
    expect(within(capacity as HTMLElement).getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No products have been added. We won’t import a partial batch.')
    expect(approve).toBeDisabled()
    fireEvent.click(approve)
    expect(fetchMock.mock.calls.filter(([url, init]) => String(url).endsWith('/catalog') && init?.method === 'POST')).toHaveLength(0)
  })

  it('allows approval when the proposal exactly fits the remaining capacity', async () => {
    const { approve, fetchMock } = await inspectWithCapacity(0)

    expect(approve).toBeEnabled()
    fireEvent.click(approve)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/merchant/merchant-quota/catalog', expect.objectContaining({ method: 'POST' })))
  })
})

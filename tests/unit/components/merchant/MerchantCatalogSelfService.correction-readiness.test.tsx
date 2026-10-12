/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantCatalogSelfService } from '@/components/merchant/MerchantCatalogSelfService'

jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({
  recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true),
}))

const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch; jest.clearAllMocks() })

const item = {
  id: 'frame-a', sku: 'SKU-A', name: 'Frame A', brand: 'Sample',
  imageUrl: 'https://cdn.example.test/frame.jpg', productUrl: null,
  shape: null, source: 'MANUAL', status: 'ACTIVE', price: null,
  currency: 'USD', styleTags: [], collectionTags: [],
  validation: { valid: false, importReady: true, recommendationReady: false, issues: [], warnings: [] },
  presentation: { state: 'NEEDS_REVIEW', label: 'Needs enrichment', issueSummary: 'Frame shape still needs review' },
}
const getSummary = (ready: number, needsReview: number, archived = 0, total = 1) => ({
  total, ready, needsReview, archived, needsAttention: total - ready - needsReview - archived,
})

function setup(input: { summary?: ReturnType<typeof getSummary>; refreshFails?: boolean }) {
  let readCount = 0
  const fetchMock = jest.fn(async (url: RequestInfo | URL, opts?: RequestInit) => {
    if (opts?.method === 'PATCH') {
      return { ok: true, json: async () => ({ success: true, data: { ...item } }) } as Response
    }
    readCount += 1
    if (readCount > 1 && input.refreshFails) {
      return { ok: false, json: async () => ({ success: false, message: 'Unable to refresh current Catalog.' }) } as Response
    }
    return { ok: true, json: async () => ({ success: true, data: {
      items: [item], nextCursor: null, summary: input.summary,
    } }) } as Response
  })
  global.fetch = fetchMock as typeof fetch
  const onCatalogChanged = jest.fn()
  render(<MerchantCatalogSelfService merchantId="merchant-a" initialTotal={1}
    onCatalogChanged={onCatalogChanged} />)
  return { fetchMock, onCatalogChanged }
}

async function correctProduct() {
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Frame A' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save correction' }))
}

describe('First Value after a Catalog correction', () => {
  it('does not claim readiness simply because an incomplete correction PATCH returned 200', async () => {
    const { onCatalogChanged } = setup({ summary: getSummary(0, 0) })
    await correctProduct()
    await waitFor(() => expect(onCatalogChanged).toHaveBeenCalledWith({
      hasAny: true, hasReady: false,
    }))
    expect(onCatalogChanged).not.toHaveBeenCalledWith({ hasAny: true, hasReady: true })
  })

  it('allows Store-ready items that still need recommendation/shape enrichment', async () => {
    const { onCatalogChanged } = setup({ summary: getSummary(0, 1) })
    await correctProduct()
    await waitFor(() => expect(onCatalogChanged).toHaveBeenCalledWith({
      hasAny: true, hasReady: true,
    }))
  })

  it('uses the unfiltered full-Catalog summary, not edited row readiness, when other items are ready', async () => {
    const { onCatalogChanged } = setup({ summary: getSummary(1, 0, 0, 2) })
    await correctProduct()
    await waitFor(() => expect(onCatalogChanged).toHaveBeenCalledWith({
      hasAny: true, hasReady: true,
    }))
  })

  it('does not announce stale success when readback failed after the correction', async () => {
    const { onCatalogChanged } = setup({ summary: getSummary(0, 0), refreshFails: true })
    await correctProduct()
    expect(await screen.findByText('Unable to refresh current Catalog.')).toBeInTheDocument()
    expect(onCatalogChanged).not.toHaveBeenCalled()
  })
})

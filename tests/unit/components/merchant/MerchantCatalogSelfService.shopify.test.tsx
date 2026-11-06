import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MerchantCatalogSelfService } from '@/components/merchant/MerchantCatalogSelfService'

jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))
jest.mock('@/lib/merchant-activation-client', () => ({ recordMerchantActivationClientEvent: jest.fn().mockResolvedValue(true) }))

const originalFetch = global.fetch
const sourceUrl = 'https://moscot.com/products/lemtosh?variant=source-choice'
const imageUrl = 'https://cdn.shopify.com/s/files/variant-0.jpg'

const candidate = {
  sku: null,
  name: 'Lemtosh Round',
  brand: 'MOSCOT',
  variant: null,
  imageUrl: null,
  productUrl: sourceUrl,
  price: null,
  currency: null,
  shape: null,
  material: null,
  color: null,
  widthClass: null,
  styleTags: [],
  collectionTags: [],
  source: 'EXTERNAL' as const,
  externalId: '88442',
  identity: { type: 'EXTERNAL_ID' as const, value: '88442' },
  shapeSource: 'NONE' as const,
  shapeConfidence: null,
  importReady: false,
  recommendationReady: false,
  recommendationIssues: ['MISSING_SHAPE'],
  readiness: 'NEEDS_REVIEW' as const,
  status: 'NEEDS_REVIEW' as const,
  dedupeStatus: 'NEW' as const,
  issues: ['MISSING_IMAGE_URL', 'SHOPIFY_VARIANT_REQUIRED', 'MISSING_SHAPE'],
  sourceLabel: 'SHOPIFY_PRODUCT',
  shopifyReview: {
    productId: '88442',
    variantOptions: [
      {
        id: '90000', label: 'Tortoise / 46', available: true, sku: 'LEMTOSH-46',
        imageUrl, priceMinor: 34000, color: 'Tortoise', size: '46', material: null, shape: null,
      },
      {
        id: '90001', label: 'Tortoise / 49', available: false, sku: 'LEMTOSH-49',
        imageUrl, priceMinor: 34100, color: 'Tortoise', size: '49', material: null, shape: null,
      },
    ],
    selectedVariantId: null,
    imageDecoded: false,
    imageConfirmed: false,
    priceConfirmed: false,
    currencyCode: null,
  },
}

const proposal = {
  requiresApproval: true,
  catalogCapacity: { current: 0, limit: 50, remaining: 50, proposedNew: 0, overLimit: 0 },
  sourceSummary: {
    sourceUrls: [sourceUrl], sourceHostnames: ['moscot.com'], platforms: ['SHOPIFY'],
    fetchedPageCount: 2, foundCount: 1, readyToImport: 0, importReady: 0,
    recommendationReady: 0, needsReview: 1, invalid: 0,
    reasonDistribution: { SHOPIFY_VARIANT_REQUIRED: 1, MISSING_SHAPE: 1 }, sourceIssues: [],
  },
  candidates: [candidate],
  importReady: [],
}

function response(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) } as Response
}

afterEach(() => {
  global.fetch = originalFetch
  jest.clearAllMocks()
})

describe('Shopify single product review', () => {
  it('requires a merchant-selected variant, confirmed currency and price, loaded image, and shape before approval', async () => {
    const storedItem = {
      id: 'frame-1', sku: 'LEMTOSH-46', name: 'Lemtosh Round', brand: 'MOSCOT',
      imageUrl, productUrl: sourceUrl, price: 34000, currency: 'usd', shape: 'round',
      source: 'EXTERNAL', status: 'ACTIVE',
      validation: { valid: true, importReady: true, recommendationReady: true, issues: [], warnings: [] },
      presentation: { state: 'READY' as const, label: 'Ready', issueSummary: null },
    }
    const calls: Array<{ url: string; init?: RequestInit }> = []
    let catalogReadCount = 0
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const path = new URL(url, 'http://localhost').pathname
      calls.push({ url, init })
      if (path.endsWith('/catalog/inspect')) return response(proposal)
      if (path.endsWith('/catalog') && init?.method === 'POST') return response({ imported: 1, created: 1, updated: 0 })
      if (path.endsWith('/catalog')) return response({
        ...(catalogReadCount++ === 0 ? { items: [], nextCursor: null, summary: { total: 0, archived: 0, ready: 0, needsReview: 0 } } : {
        items: [storedItem], nextCursor: null,
        summary: { total: 1, archived: 0, ready: 1, needsReview: 0 },
        }),
      })
      throw new Error(`Unexpected request ${url}`)
    }) as typeof fetch

    render(<MerchantCatalogSelfService merchantId="merchant-shopify" initialTotal={0} initialWebsiteUrl={sourceUrl} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect and preview' }))
    const review = await screen.findByRole('article')
    expect(screen.getByRole('heading', { name: 'Review this product before adding it' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open original product page' })).toHaveAttribute('href', sourceUrl)
    expect(screen.queryByRole('button', { name: 'Approve and import 0' })).not.toBeInTheDocument()

    fireEvent.change(within(review).getByLabelText('Choose one available variant'), { target: { value: '90000' } })
    expect(await within(review).findByAltText('Lemtosh Round product image')).toHaveAttribute('src', imageUrl)
    const image = within(review).getByAltText('Lemtosh Round product image')
    const imageConfirmation = within(review).getByRole('checkbox', { name: /Loading the selected variant image/i })
    expect(imageConfirmation).toBeDisabled()
    Object.defineProperty(image, 'naturalWidth', { value: 100, configurable: true })
    fireEvent.load(image)
    const confirmedImage = await within(review).findByRole('checkbox', { name: /I confirm this is the image/i })
    await waitFor(() => expect(confirmedImage).toBeEnabled())
    fireEvent.click(confirmedImage)

    fireEvent.change(within(review).getByLabelText('Confirm price currency'), { target: { value: 'USD' } })
    const priceConfirmation = within(review).getByRole('checkbox', { name: /I confirm this variant is priced at USD 340\.00/i })
    expect(priceConfirmation).toBeEnabled()
    fireEvent.click(priceConfirmation)

    fireEvent.change(within(review).getByLabelText('Frame shape'), { target: { value: 'round' } })
    const approve = screen.getByRole('button', { name: 'Approve and import 1' })
    expect(approve).toBeEnabled()
    fireEvent.click(approve)

    await waitFor(() => expect(calls.some(({ url, init }) => url.endsWith('/catalog') && init?.method === 'POST')).toBe(true))
    const importCall = calls.find(({ url, init }) => url.endsWith('/catalog') && init?.method === 'POST')!
    const body = JSON.parse(String(importCall.init?.body)) as { approved: boolean; frames: Array<Record<string, unknown>> }
    expect(body.approved).toBe(true)
    expect(body.frames).toHaveLength(1)
    expect(body.frames[0]).toMatchObject({
      sku: 'LEMTOSH-46', name: 'Lemtosh Round', variant: 'Tortoise / 46',
      productUrl: sourceUrl, imageUrl, price: 34000, currency: 'usd', shape: 'round',
      externalId: '88442:90000',
    })
    expect(body.frames[0].price).not.toBe(3400000)
    expect(await screen.findByText('LEMTOSH-46 · MOSCOT · USD 340.00')).toBeInTheDocument()
  })
})

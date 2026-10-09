import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { analytics } from '@/lib/analytics'
import { MerchantStoreWorkspace } from '@/components/merchant/MerchantStoreWorkspace'
import type { MerchantStoreWorkspace as WorkspaceData, MerchantStoreWorkspaceFrame } from '@/modules/merchant/application/merchant-store-workspace'
import { DEFAULT_DECISION_JOURNEY_POLICY } from '@/modules/store/domain/decision-journey'
import { DEFAULT_EXPERIENCE_DELIVERY_POLICY } from '@/modules/store/domain/delivery-profile'

jest.mock('@/lib/analytics', () => ({ analytics: { trackCustomEvent: jest.fn() } }))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => {
    const { fill, unoptimized, ...imageProps } = props
    void fill
    void unoptimized
    return <img {...imageProps} alt={imageProps.alt || ''} />
  },
}))

function frame(id: string, name: string): MerchantStoreWorkspaceFrame {
  return {
    id, sku: `SKU-${id}`, externalId: null, productUrl: null, name, brand: 'North Star',
    imageUrl: 'https://cdn.example.test/frame.png', price: 12500, currency: 'USD', shape: 'round',
    source: 'MANUAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
    validation: { valid: true, importReady: true, recommendationReady: true, enrichmentStatus: 'APPROVED', issues: [], importIssues: [], recommendationIssues: [], warnings: [] },
    storeReadiness: { storeEligible: true, issues: [] },
  }
}

function workspace(status: 'DRAFT' | 'ACTIVE' = 'DRAFT'): WorkspaceData {
  return {
    store: { id: 'store-a', slug: 'north-star', name: 'North Star Store', status, headline: null, description: null, publicPath: '/en/store/north-star', selectedFrameIds: ['frame-a'], journeyPolicy: DEFAULT_DECISION_JOURNEY_POLICY, effectiveJourneyPolicy: DEFAULT_DECISION_JOURNEY_POLICY, deliveryPolicy: DEFAULT_EXPERIENCE_DELIVERY_POLICY, presentationMode: 'PRODUCT_FIRST', primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null, secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null },
    capabilities: { tryOnEnabled: true, compareEnabled: true, kioskDeliveryEnabled: true },
    catalog: [frame('frame-a', 'Round frame'), frame('frame-b', 'Square frame')],
  }
}

function ok(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) }
}

function storePreview(status: 'DRAFT' | 'ACTIVE' = 'DRAFT') {
  return {
    store: { id: 'store-a', name: 'North Star Store', status, headline: null, description: null, publicPath: '/en/store/north-star' },
    frameCount: 1, frames: [{ id: 'frame-a', name: 'Round frame', imageUrl: 'https://cdn.example.test/frame.png', shape: 'round', color: null, productBrand: 'North Star' }],
    readiness: { ready: true, readyFrameCount: 1, blockingIssues: [] }, preview: { sideEffectFree: true, publicPath: '/en/store/north-star' },
  }
}

describe('MerchantStoreWorkspace lifecycle UX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/preview')) return ok(storePreview())
      if (init?.method === 'PATCH') return ok({ id: 'store-a', status: 'ACTIVE' })
      if (init?.method === 'PUT') return ok({ storeId: 'store-a', frameIds: ['frame-a', 'frame-b'], frameCount: 2 })
      if (input.endsWith('/publish')) return ok({ id: 'store-a', status: 'ACTIVE', publicPath: '/en/store/north-star', approvalRecorded: true })
      return ok(workspace())
    }) as jest.Mock
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue(undefined) } })
  })

  it('saves Journey and delivery settings through the existing Store Experience PATCH without publishing', async () => {
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)
    await screen.findByText('DRAFT')
    fireEvent.click(screen.getByText('Shopper experience'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Virtual Try-On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save experience settings' }))

    await screen.findByText('Experience settings saved to the private Draft Store.')
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toMatchObject({
      storeId: 'store-a',
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] },
      deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
      presentationMode: 'PRODUCT_FIRST',
    })
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/publish'), expect.anything())
  })

  it('previews unsaved shopper stages and can revert the selected configuration', async () => {
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)
    await screen.findByText('DRAFT')
    fireEvent.click(screen.getByText('Shopper experience'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Virtual Try-On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview shopper flow' }))

    const preview = screen.getByRole('region', { name: 'Shopper flow preview' })
    expect(preview).toHaveTextContent('Private until saved')
    expect(preview).toHaveTextContent('Recommendations')
    expect(preview).not.toHaveTextContent('Try-On · Compare')
    expect(global.fetch).not.toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PATCH' }))

    fireEvent.click(screen.getByRole('button', { name: 'Revert to saved settings' }))
    expect(screen.getByRole('checkbox', { name: 'Virtual Try-On' })).toBeChecked()
    expect(screen.queryByRole('button', { name: 'Revert to saved settings' })).not.toBeInTheDocument()
  })

  it('requires target-specific confirmation before writing Experience settings to a Live Store', async () => {
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/preview')) return ok(storePreview('ACTIVE'))
      if (init?.method === 'PATCH') return ok({ id: 'store-a', status: 'ACTIVE' })
      return ok(workspace('ACTIVE'))
    }) as jest.Mock
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)
    await screen.findByText('LIVE')
    fireEvent.click(screen.getByText('Shopper experience'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Virtual Try-On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save experience settings' }))

    expect(screen.getByRole('alertdialog', { name: 'Apply changes to the live Store?' })).toHaveTextContent('North Star Store')
    expect(global.fetch).not.toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PATCH' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply to live Store' }))
    await screen.findByText('Experience settings saved. Changes are now visible to shoppers.')
    expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PATCH' }))
  })

  it('keeps Draft preview private and requires an explicit, separate publish approval', async () => {
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    expect(await screen.findByText('DRAFT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview Store' })).toBeEnabled()
    expect(screen.queryByRole('link', { name: 'View live Store' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preview Store' }))

    expect(await screen.findByTestId('store-draft-preview')).toHaveTextContent('DRAFT · not public')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Store' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Explore this Store' })).toBeInTheDocument()
    const approval = screen.getByRole('checkbox', { name: 'I approve publishing this Store publicly' })
    expect(approval).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Publish Store' })).toBeDisabled()
    expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store/preview', expect.objectContaining({ method: 'POST' }))
    expect(global.fetch).not.toHaveBeenCalledWith('/api/merchant/merchant-a/store/publish', expect.anything())
  })

  it('tracks both B2B publish events only after an approved Draft becomes Live', async () => {
    const existingFetch = global.fetch as jest.Mock
    let published = false
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/publish')) {
        published = true
        return ok({ id: 'store-a', status: 'ACTIVE', publicPath: '/en/store/north-star', approvalRecorded: true })
      }
      if (input === '/api/merchant/merchant-a/store' && !init?.method) {
        return ok(workspace(published ? 'ACTIVE' : 'DRAFT'))
      }
      return existingFetch(input, init)
    }) as jest.Mock

    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Preview Store' }))
    expect(await screen.findByTestId('store-draft-preview')).toHaveTextContent('DRAFT · not public')
    expect(analytics.trackCustomEvent).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'I approve publishing this Store publicly' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publish Store' }))

    expect(await screen.findByText('Your Store is live. Share the public link with shoppers.')).toBeInTheDocument()
    expect(analytics.trackCustomEvent).toHaveBeenNthCalledWith(1, 'merchant_store_published', {
      merchant_id: 'merchant-a',
      source_journey: 'merchant_workspace_store',
    })
    expect(analytics.trackCustomEvent).toHaveBeenNthCalledWith(2, 'merchant_first_store_published', {
      merchant_id: 'merchant-a',
      source_journey: 'merchant_workspace_store',
    })
  })

  it('keeps Live status and public link while warning before details save changes reach shoppers', async () => {
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/preview')) return ok(storePreview('ACTIVE'))
      if (init?.method === 'PATCH') return ok({ id: 'store-a', status: 'ACTIVE' })
      return ok(workspace('ACTIVE'))
    }) as jest.Mock
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    expect(await screen.findByText('LIVE')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View live Store' })).toHaveAttribute('href', '/en/store/north-star')
    expect(await screen.findByTestId('store-saved-preview')).toHaveTextContent('LIVE · saved state')
    expect(screen.queryByRole('button', { name: 'Publish Store' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Store details'))
    fireEvent.change(screen.getByLabelText(/Headline/), { target: { value: 'New live headline' } })
    expect(screen.getByText('Saving these details makes them live immediately.')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Live Store consequence' })).toHaveTextContent('Saved product and Store detail changes become visible immediately.')
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PATCH' })))
    expect(await screen.findByText('Saved. These changes are now visible in your live Store.')).toBeInTheDocument()
  })

  it('warns before saving a Live product selection change', async () => {
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/preview')) return ok(storePreview('ACTIVE'))
      if (init?.method === 'PUT') return ok({ storeId: 'store-a', frameIds: ['frame-a', 'frame-b'], frameCount: 2 })
      return ok(workspace('ACTIVE'))
    }) as jest.Mock
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Add Square frame to Store' }))
    expect(screen.getByText('Saving this selection makes it live immediately.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Save products' })[0])

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PUT' })))
    expect(await screen.findByText('Saved. This product selection is now visible in your live Store.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish Store' })).not.toBeInTheDocument()
  })
})

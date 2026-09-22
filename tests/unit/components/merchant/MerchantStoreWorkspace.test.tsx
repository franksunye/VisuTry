import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantStoreWorkspace } from '@/components/merchant/MerchantStoreWorkspace'
import type { MerchantStorePreview, MerchantStoreWorkspace as WorkspaceData, MerchantStoreWorkspaceFrame } from '@/modules/merchant/application/merchant-store-workspace'

jest.mock('@/components/merchant/MerchantStorePrivatePreview', () => ({
  MerchantStorePrivatePreview: ({ preview }: { preview: MerchantStorePreview }) => <div data-testid="private-preview">DRAFT · not public · {preview.store.name}</div>,
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
    store: { id: 'store-a', slug: 'north-star', name: 'North Star Store', status, headline: null, description: null, publicPath: '/en/store/north-star', selectedFrameIds: ['frame-a'] },
    catalog: [frame('frame-a', 'Round frame'), frame('frame-b', 'Square frame')],
  }
}

function ok(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) }
}

describe('MerchantStoreWorkspace lifecycle UX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/preview')) {
        return ok({
          store: { id: 'store-a', name: 'North Star Store', status: 'DRAFT', headline: null, description: null, publicPath: '/en/store/north-star' },
          frameCount: 1, frames: [{ id: 'frame-a', name: 'Round frame', imageUrl: 'https://cdn.example.test/frame.png', shape: 'round', color: null, productBrand: 'North Star' }],
          readiness: { ready: true, readyFrameCount: 1, blockingIssues: [] }, preview: { sideEffectFree: true, publicPath: '/en/store/north-star' },
        })
      }
      if (init?.method === 'PATCH') return ok({ id: 'store-a', status: 'ACTIVE' })
      if (init?.method === 'PUT') return ok({ storeId: 'store-a', frameIds: ['frame-a', 'frame-b'], frameCount: 2 })
      if (input.endsWith('/publish')) return ok({ id: 'store-a', status: 'ACTIVE', publicPath: '/en/store/north-star', approvalRecorded: true })
      return ok(workspace())
    }) as jest.Mock
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue(undefined) } })
  })

  it('keeps Draft preview private and requires an explicit, separate publish approval', async () => {
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    expect(await screen.findByText('DRAFT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview Store' })).toBeEnabled()
    expect(screen.queryByRole('link', { name: 'View live Store' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preview Store' }))

    expect(await screen.findByTestId('private-preview')).toHaveTextContent('DRAFT · not public')
    const approval = screen.getByRole('checkbox', { name: 'I approve publishing this Store publicly' })
    expect(approval).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Publish Store' })).toBeDisabled()
    expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store/preview', expect.objectContaining({ method: 'POST' }))
    expect(global.fetch).not.toHaveBeenCalledWith('/api/merchant/merchant-a/store/publish', expect.anything())
  })

  it('keeps Live status and public link while warning before details save changes reach shoppers', async () => {
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return ok({ id: 'store-a', status: 'ACTIVE' })
      return ok(workspace('ACTIVE'))
    }) as jest.Mock
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    expect(await screen.findByText('LIVE')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View live Store' })).toHaveAttribute('href', '/en/store/north-star')
    expect(screen.queryByRole('button', { name: 'Publish Store' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Store details'))
    fireEvent.change(screen.getByLabelText(/Headline/), { target: { value: 'New live headline' } })
    expect(screen.getAllByText(/become visible to shoppers after saving/i).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PATCH' })))
    expect(await screen.findByText('Saved. These changes are now visible in your live Store.')).toBeInTheDocument()
  })

  it('warns before saving a Live product selection change', async () => {
    global.fetch = jest.fn().mockImplementation(async (_input: string, init?: RequestInit) => init?.method === 'PUT'
      ? ok({ storeId: 'store-a', frameIds: ['frame-a', 'frame-b'], frameCount: 2 })
      : ok(workspace('ACTIVE'))) as jest.Mock
    render(<MerchantStoreWorkspace merchantId="merchant-a" locale="en" />)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Add Square frame to Store' }))
    expect(screen.getByText('Saving this selection updates the live Store immediately.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Save products' })[0])

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/store', expect.objectContaining({ method: 'PUT' })))
    expect(await screen.findByText('Saved. This product selection is now visible in your live Store.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish Store' })).not.toBeInTheDocument()
  })
})

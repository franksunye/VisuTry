import { render, screen } from '@testing-library/react'
import { MerchantStorePrivatePreview } from '@/components/merchant/MerchantStorePrivatePreview'
import type { MerchantStorePreview } from '@/modules/merchant/application/merchant-store-workspace'

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ''} />,
}))

const preview: MerchantStorePreview = {
  store: { id: 'store-a', name: 'North Star Store', status: 'ACTIVE', headline: 'Frames for everyday', description: 'A saved collection.', publicPath: '/en/store/north-star' },
  frameCount: 1,
  frames: [{ id: 'frame-a', name: 'Round frame', imageUrl: null, shape: 'round', color: 'black', productBrand: 'North Star' }],
  readiness: { ready: true, readyFrameCount: 1, blockingIssues: [] },
  preview: { sideEffectFree: true, publicPath: '/en/store/north-star' },
}

describe('MerchantStorePrivatePreview', () => {
  it('labels a Live saved snapshot and clarifies unsaved changes are excluded', () => {
    render(<MerchantStorePrivatePreview preview={preview} compact variant="LIVE" hasUnsavedChanges />)

    expect(screen.getByRole('region', { name: 'Saved shopper-facing Store presentation' })).toBeInTheDocument()
    expect(screen.getByText('LIVE · saved state')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('This preview shows the saved Store only. Unsaved changes are not shown.')
    expect(screen.getByRole('heading', { level: 2, name: 'Frames for everyday' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Frames for everyday' })).not.toBeInTheDocument()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Explore the collection' })).toHaveLength(1)
  })

  it('keeps the Draft preview private and non-interactive', () => {
    render(<MerchantStorePrivatePreview preview={{ ...preview, store: { ...preview.store, status: 'DRAFT' } }} compact />)

    expect(screen.getByTestId('store-draft-preview')).toHaveAttribute('aria-label', 'Private draft preview')
    expect(screen.getByText('DRAFT · not public')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Frames for everyday' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start shopping/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Private draft preview — no shopper session is started/i)).toBeInTheDocument()
  })
})

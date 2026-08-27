import type { MerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import type { MerchantFrameStoreReadiness } from '../domain/merchant-frame-store-readiness'

export type MerchantStoreWorkspaceFrame = {
  id: string
  sku: string | null
  externalId: string | null
  productUrl: string | null
  name: string
  brand: string | null
  imageUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  source: string
  status: string
  enrichmentStatus: string
  validation: MerchantFrameReadiness
  storeReadiness: MerchantFrameStoreReadiness
}

export type MerchantStorePreviewFrame = {
  id: string
  name: string
  imageUrl: string | null
  shape: string
  color: string | null
  productBrand: string | null
}

export type MerchantStoreWorkspace = {
  store: {
    id: string
    slug: string
    name: string
    status: string
    headline: string | null
    description: string | null
    publicPath: string
    selectedFrameIds: string[]
  } | null
  catalog: MerchantStoreWorkspaceFrame[]
}

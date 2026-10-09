import type { MerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import type { MerchantFrameStoreReadiness } from '../domain/merchant-frame-store-readiness'
import type { DecisionJourneyPolicy } from '@/modules/store/domain/decision-journey'
import type { ExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import type { PresentationMode } from '@/modules/store/domain/presentation-mode'

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

export type MerchantStorePreview = {
  store: {
    id: string
    name: string
    status: string
    headline: string | null
    description: string | null
    publicPath: string
  }
  frameCount: number
  frames: MerchantStorePreviewFrame[]
  readiness: {
    ready: boolean
    readyFrameCount: number
    blockingIssues: Array<{ frameId: string; issues: string[] }>
  }
  preview: { sideEffectFree: boolean; publicPath: string }
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
    journeyPolicy: DecisionJourneyPolicy
    effectiveJourneyPolicy: DecisionJourneyPolicy
    deliveryPolicy: ExperienceDeliveryPolicy
    presentationMode: PresentationMode
    primaryCtaType: string | null
    primaryCtaLabel: string | null
    primaryCtaUrl: string | null
    secondaryCtaType: string | null
    secondaryCtaLabel: string | null
    secondaryCtaUrl: string | null
  } | null
  capabilities: { tryOnEnabled: boolean; compareEnabled: boolean; kioskDeliveryEnabled: boolean }
  catalog: MerchantStoreWorkspaceFrame[]
}

/**
 * Asset access seam — Store application/domain must not import Vercel Blob APIs.
 */

import type {
  StoreAssetAccessMode,
  StoreAssetPurpose,
} from '../../domain/enums'
import type { StoreAssetRecord } from './repositories'

export type PutStoreAssetInput = {
  merchantId: string
  merchantSessionId?: string | null
  ownerType: string
  ownerId: string
  purpose: StoreAssetPurpose
  storageKey: string
  accessMode: StoreAssetAccessMode
  body: Buffer | Blob | File
  contentType: string
  expiresAt: Date
}

export type PutStoreAssetResult = {
  asset: StoreAssetRecord
  /** Delivery URL for the current access mode — not an authorization token. */
  deliveryUrl: string
}

export interface AssetStore {
  put(input: PutStoreAssetInput): Promise<PutStoreAssetResult>
  getProviderDeliveryUrl(assetId: string, merchantId: string): Promise<string | null>
  delete(assetId: string, merchantId: string): Promise<void>
  assertAccess(input: {
    assetId: string
    merchantId: string
    merchantSessionId?: string | null
  }): Promise<StoreAssetRecord>
  listExpired(now: Date, limit?: number): Promise<StoreAssetRecord[]>
}

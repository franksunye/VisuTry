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
  /**
   * Shopper-facing delivery URL for the current access mode.
   * For PRIVATE_SIGNED this is an app-mediated route, not a raw Blob URL.
   */
  deliveryUrl: string
}

export type DeleteStoreAssetResult = {
  deleted: boolean
  /** True when Blob delete failed and deletedAt was NOT written. */
  retryable: boolean
  error?: string
}

export type StoreAssetBytes = {
  body: Buffer
  contentType: string
  storageKey: string
}

export type ListExpiredAssetsOptions = {
  maxFailCount?: number
  /** Skip assets whose last failed attempt is newer than now - backoffMs. */
  backoffMs?: number
}

export interface AssetStore {
  put(input: PutStoreAssetInput): Promise<PutStoreAssetResult>
  getProviderDeliveryUrl(assetId: string, merchantId: string): Promise<string | null>
  /** Read asset bytes server-side (preferred over treating provider URL as auth). */
  getBytes(assetId: string, merchantId: string): Promise<StoreAssetBytes | null>
  delete(assetId: string, merchantId: string): Promise<DeleteStoreAssetResult>
  assertAccess(input: {
    assetId: string
    merchantId: string
    merchantSessionId?: string | null
  }): Promise<StoreAssetRecord>
  listExpired(
    now: Date,
    limit?: number,
    options?: ListExpiredAssetsOptions,
  ): Promise<StoreAssetRecord[]>
}

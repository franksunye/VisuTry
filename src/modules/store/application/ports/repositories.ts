/**
 * Tenant-scoped repository ports.
 * Every tenant-owned read/write requires merchantId unless explicitly admin-internal.
 */

import type {
  EnrichmentStatus,
  MerchantFrameSource,
  MerchantFrameStatus,
  MerchantIntentType,
  MerchantSessionStatus,
  MerchantStatus,
  StoreAssetAccessMode,
  StoreAssetPurpose,
  StoreEventSource,
  StoreEventType,
  StoreUsageKind,
} from '../../domain/enums'

export type MerchantRecord = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  contactEmail: string | null
  accentColor: string | null
  status: MerchantStatus
  createdAt: Date
  updatedAt: Date
}

export type MerchantFrameRecord = {
  id: string
  merchantId: string
  sku: string | null
  name: string
  imageUrl: string | null
  imageAssetId: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
  styleTags: string[]
  source: MerchantFrameSource
  externalId: string | null
  enrichmentStatus: EnrichmentStatus
  status: MerchantFrameStatus
  createdAt: Date
  updatedAt: Date
}

export type MerchantSessionRecord = {
  id: string
  merchantId: string
  anonymousVisitorId: string | null
  photoAssetId: string | null
  capabilityTokenHash: string
  locale: string | null
  status: MerchantSessionStatus
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
}

export type MerchantIntentRecord = {
  id: string
  merchantId: string
  merchantSessionId: string
  merchantFrameId: string | null
  type: MerchantIntentType
  idempotencyKey: string
  email: string | null
  name: string | null
  note: string | null
  createdAt: Date
}

export type MerchantEventRecord = {
  id: string
  eventId: string
  type: StoreEventType
  merchantId: string
  merchantSessionId: string | null
  merchantFrameId: string | null
  tryOnTaskId: string | null
  source: StoreEventSource
  locale: string | null
  deviceType: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export type StoreAssetRecord = {
  id: string
  merchantId: string
  merchantSessionId: string | null
  ownerType: string
  ownerId: string
  purpose: StoreAssetPurpose
  storageKey: string
  accessMode: StoreAssetAccessMode
  providerUrl: string | null
  expiresAt: Date
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MerchantRepository {
  findBySlug(slug: string): Promise<MerchantRecord | null>
  findById(merchantId: string): Promise<MerchantRecord | null>
  /** Admin-only: list merchants without tenant filter. */
  listAllAdmin(limit?: number): Promise<MerchantRecord[]>
}

export interface MerchantFrameRepository {
  findActiveByMerchant(merchantId: string): Promise<MerchantFrameRecord[]>
  findByMerchantAndId(
    merchantId: string,
    frameId: string,
  ): Promise<MerchantFrameRecord | null>
  findActiveByMerchantAndId(
    merchantId: string,
    frameId: string,
  ): Promise<MerchantFrameRecord | null>
}

export interface MerchantSessionRepository {
  create(input: {
    merchantId: string
    capabilityTokenHash: string
    anonymousVisitorId?: string | null
    locale?: string | null
    expiresAt: Date
  }): Promise<MerchantSessionRecord>
  findByMerchantAndId(
    merchantId: string,
    sessionId: string,
  ): Promise<MerchantSessionRecord | null>
  touch(merchantId: string, sessionId: string, lastActiveAt: Date): Promise<void>
  markExpired(merchantId: string, sessionId: string): Promise<void>
}

export interface MerchantIntentRepository {
  createIdempotent(input: {
    merchantId: string
    merchantSessionId: string
    merchantFrameId?: string | null
    type: MerchantIntentType
    idempotencyKey: string
    email?: string | null
    name?: string | null
    note?: string | null
  }): Promise<{ record: MerchantIntentRecord; created: boolean }>
  listByMerchant(
    merchantId: string,
    limit?: number,
  ): Promise<MerchantIntentRecord[]>
}

export interface MerchantEventRepository {
  appendIdempotent(input: {
    eventId: string
    type: StoreEventType
    merchantId: string
    merchantSessionId?: string | null
    merchantFrameId?: string | null
    tryOnTaskId?: string | null
    source: StoreEventSource
    locale?: string | null
    deviceType?: string | null
    metadata?: Record<string, unknown> | null
  }): Promise<{ record: MerchantEventRecord; created: boolean }>
  listByMerchant(
    merchantId: string,
    limit?: number,
  ): Promise<MerchantEventRecord[]>
}

export interface StoreUsageRepository {
  record(input: {
    merchantId: string
    merchantSessionId?: string | null
    tryOnTaskId?: string | null
    kind: StoreUsageKind
  }): Promise<void>
  countSuccessfulRenders(merchantId: string): Promise<number>
  countSessionSuccessfulRenders(
    merchantId: string,
    merchantSessionId: string,
  ): Promise<number>
  countSessionAttempts(
    merchantId: string,
    merchantSessionId: string,
  ): Promise<number>
}

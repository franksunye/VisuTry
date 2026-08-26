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
  RetentionStatus,
  StoreAssetAccessMode,
  StoreAssetPurpose,
  StoreEventSource,
  StoreEventType,
  StoreUsageKind,
} from '../../domain/enums'
import type { ExperienceStatus, ExperienceType } from '../../domain/experience'
import type { CampaignGate, CampaignObjective } from '../../domain/campaign-policy'
import type { PresentationMode } from '../../domain/presentation-mode'

export type MerchantRecord = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  contactEmail: string | null
  accentColor: string | null
  status: MerchantStatus
  /** Admin/business-analysis metadata; never used for tenant authorization. */
  classification?: string | null
  pilotType?: string | null
  sponsoredUsagePolicyKey?: string | null
  referenceData?: boolean
  defaultSource?: string | null
  defaultCampaign?: string | null
  tryOnEnabled?: boolean
  compareEnabled?: boolean
  maxCompareFrames?: number
  inquiryEnabled?: boolean
  planCode: string | null
  commercialStage: string | null
  pricingVersion: string | null
  entitlementVersion: string | null
  commerceSessionAllowance: number | null
  standardRenderAllowance: number | null
  premiumRenderAllowance: number | null
  campaignAllowance: number | null
  entitlementEffectiveFrom: Date | null
  billingPeriodEnd: Date | null
  commercialExceptionCode: string | null
  createdAt: Date
  updatedAt: Date
}

export type MerchantFrameRecord = {
  id: string
  merchantId: string
  sku: string | null
  name: string
  brand: string | null
  variant?: string | null
  imageUrl: string | null
  imageAssetId: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
  lensWidthMm?: number | null
  bridgeWidthMm?: number | null
  templeLengthMm?: number | null
  frameWidthMm?: number | null
  styleTags: string[]
  collectionTags?: string[]
  sourceNotes?: string | null
  source: MerchantFrameSource
  externalId: string | null
  enrichmentStatus: EnrichmentStatus
  status: MerchantFrameStatus
  createdAt: Date
  updatedAt: Date
}

export type ExperienceRecord = {
  id: string
  merchantId: string
  type: ExperienceType
  slug: string
  name: string
  status: ExperienceStatus
  headline: string | null
  description: string | null
  heroAssetUrl: string | null
  primaryCtaType: string | null
  primaryCtaLabel: string | null
  primaryCtaUrl: string | null
  secondaryCtaType: string | null
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
  offerLabel: string | null
  offerCode: string | null
  offerTerms: string | null
  startAt: Date | null
  endAt: Date | null
  campaignObjective?: CampaignObjective | null
  campaignGate?: CampaignGate | null
  presentationMode?: PresentationMode | null
  referenceData: boolean
  defaultSource: string | null
  defaultCampaign: string | null
  referenceMetadata: Record<string, unknown> | null
  frameIds: string[]
  createdAt: Date
  updatedAt: Date
}

export type MerchantSessionRecord = {
  id: string
  merchantId: string
  experienceId?: string | null
  anonymousVisitorId: string | null
  photoAssetId: string | null
  capabilityTokenHash: string
  locale: string | null
  status: MerchantSessionStatus
  referenceData?: boolean
  source: string | null
  medium: string | null
  campaign: string | null
  acquisitionSurface?: string | null
  referrer: string | null
  landingUrl: string | null
  aiAgentSource: string | null
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
}

export type MerchantIntentRecord = {
  id: string
  merchantId: string
  merchantSessionId: string
  experienceId?: string | null
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
  experienceId?: string | null
  merchantFrameId: string | null
  tryOnTaskId: string | null
  source: StoreEventSource
  locale: string | null
  deviceType: string | null
  referenceData?: boolean
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
  retentionStatus: RetentionStatus
  deleteFailCount: number
  lastDeleteError: string | null
  lastDeleteAttemptAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MerchantRepository {
  findBySlug(slug: string): Promise<MerchantRecord | null>
  /** Public discovery read with a minimal field selection. */
  findPublicBySlug?(slug: string): Promise<MerchantRecord | null>
  findById(merchantId: string): Promise<MerchantRecord | null>
  /** Admin-only: list merchants without tenant filter. */
  listAllAdmin(limit?: number): Promise<MerchantRecord[]>
}

export interface ExperienceRepository {
  findDefaultStore(merchantId: string): Promise<ExperienceRecord | null>
  /** Public discovery read: returns the Store even when its AI runtime is no longer active. */
  findPublicStoreByMerchant?(merchantId: string): Promise<ExperienceRecord | null>
  hasAnyByMerchant(merchantId: string): Promise<boolean>
  findByMerchantAndId(merchantId: string, experienceId: string): Promise<ExperienceRecord | null>
  findActiveCampaignByMerchantAndSlug(
    merchantId: string,
    slug: string,
  ): Promise<ExperienceRecord | null>
  /** Public discovery read: historical Campaigns remain readable when policy allows it. */
  findPublicCampaignByMerchantAndSlug?(
    merchantId: string,
    slug: string,
  ): Promise<ExperienceRecord | null>
}

export interface MerchantFrameRepository {
  findActiveByMerchant(merchantId: string): Promise<MerchantFrameRecord[]>
  /** Public discovery read with only fields exposed by SEO/GEO surfaces. */
  findPublicActiveByMerchantAndExperience?(
    merchantId: string,
    experience: ExperienceRecord,
  ): Promise<MerchantFrameRecord[]>
  findByMerchantAndId(
    merchantId: string,
    frameId: string,
  ): Promise<MerchantFrameRecord | null>
  findActiveByMerchantAndId(
    merchantId: string,
    frameId: string,
  ): Promise<MerchantFrameRecord | null>
  findActiveByMerchantAndExperience?: (
    merchantId: string,
    experience: ExperienceRecord,
  ) => Promise<MerchantFrameRecord[]>
}

export interface MerchantSessionRepository {
  create(input: {
    merchantId: string
    experienceId?: string | null
    capabilityTokenHash: string
    anonymousVisitorId?: string | null
    locale?: string | null
    expiresAt: Date
    referenceData?: boolean
    source?: string | null
    medium?: string | null
    campaign?: string | null
    acquisitionSurface?: string | null
    referrer?: string | null
    landingUrl?: string | null
    aiAgentSource?: string | null
  }): Promise<MerchantSessionRecord>
  findByMerchantAndId(
    merchantId: string,
    sessionId: string,
  ): Promise<MerchantSessionRecord | null>
  touch(merchantId: string, sessionId: string, lastActiveAt: Date): Promise<void>
  markExpired(merchantId: string, sessionId: string): Promise<void>
  attachPhotoAsset(input: {
    merchantId: string
    sessionId: string
    photoAssetId: string
  }): Promise<void>
}

export interface MerchantIntentRepository {
  createIdempotent(input: {
    merchantId: string
    merchantSessionId: string
    experienceId?: string | null
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
    experienceId?: string | null
    merchantFrameId?: string | null
    tryOnTaskId?: string | null
    source: StoreEventSource
    locale?: string | null
    deviceType?: string | null
    referenceData?: boolean
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
  countCommerceSessions(merchantId: string): Promise<number>
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

export type SponsoredUsageReservation = {
  id: string
  status: 'RESERVED' | 'CONSUMED' | 'RELEASED'
}

export interface MerchantSponsoredUsageRepository {
  reserve(input: {
    merchantId: string
    merchantSessionId?: string | null
    experienceId?: string | null
    userId?: string | null
    shopperIdentityHash: string
    usageType: 'SPONSORED_GENERATION' | 'SPONSORED_COMPARE'
    limit: number
    rollingWindowHours: number
    idempotencyKey: string
    now?: Date
  }): Promise<SponsoredUsageReservation | null>
  consume(reservationId: string): Promise<boolean>
  release(reservationId: string): Promise<boolean>
}

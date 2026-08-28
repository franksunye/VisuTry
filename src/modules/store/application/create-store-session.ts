import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  createMerchantSessionCapability,
  computeSessionExpiresAt,
  merchantInactive,
  merchantNotFound,
  resolveMerchantEntitlement,
  sanitizeSessionAcquisition,
  sessionAcquisitionToMetadata,
  type SessionAcquisitionInput,
} from '../domain'
import { experiencePolicyMetadata, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import { resolveMerchantExperience } from './resolve-experience'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
  StoreUsageRepository,
  ExperienceRepository,
} from './ports/repositories'

export type CreateStoreSessionResult = {
  merchantId: string
  merchantSessionId: string
  experienceId: string | null
  expiresAt: string
  /** Opaque capability — set as HttpOnly cookie; never persist client-side beyond cookie. */
  capabilityToken: string
}

export async function createStoreSession(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  experiences?: ExperienceRepository
  slug: string
  experienceSlug?: string | null
  locale?: string | null
  anonymousVisitorId?: string | null
  deviceType?: string | null
  acquisition?: SessionAcquisitionInput | null
}): Promise<CreateStoreSessionResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const experience = await resolveMerchantExperience({
    merchant,
    experiences: input.experiences,
    slug: input.experienceSlug ?? null,
  })

  const entitlement = resolveMerchantEntitlement(merchant)
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)
  // A normal Store visit is operational traffic, not a paid AI Commerce
  // Session. Paid usage is marked idempotently when the shopper crosses the
  // AI-assisted threshold (recommendation/AI generation), so exhaustion can
  // pause that capability without taking the Store offline.

  const capability = createMerchantSessionCapability()
  const expiresAt = computeSessionExpiresAt()
  const acquisitionInput = input.acquisition ?? {}
  const acquisition = sanitizeSessionAcquisition({
    ...acquisitionInput,
    source: acquisitionInput.source ?? experience?.defaultSource ?? merchant.defaultSource,
    campaign:
      acquisitionInput.campaign ??
      experience?.defaultCampaign ??
      merchant.defaultCampaign,
  })

  const session = await input.sessions.create({
    merchantId: merchant.id,
    experienceId: experience?.id ?? null,
    capabilityTokenHash: capability.tokenHash,
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    locale: input.locale ?? null,
    expiresAt,
    referenceData: merchant.referenceData === true || experience?.referenceData === true,
    ...acquisition,
  })

  await input.usage.record({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    kind: 'SESSION',
  })

  const acquisitionMeta = sessionAcquisitionToMetadata(acquisition)

  await input.events.appendIdempotent({
    eventId: buildStoreEventIdempotencyKey({
      type: 'merchant_page_viewed',
      merchantId: merchant.id,
      merchantSessionId: session.id,
      clientActionId: `session-create:${session.id}`,
    }),
    type: 'merchant_page_viewed',
    merchantId: merchant.id,
    merchantSessionId: session.id,
    experienceId: experience?.id ?? null,
    source: 'SERVER',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: {
      planCode: entitlement.planCode,
      entitlementVersion: entitlement.entitlementVersion,
      ...experiencePolicyMetadata(experiencePolicy),
      ...(acquisitionMeta ?? {}),
    },
  })

  logger.debug('store', 'Store session created', {
    merchantId: merchant.id,
    merchantSlug: input.slug,
    experienceId: experience?.id ?? null,
    merchantSessionId: session.id,
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    planCode: entitlement.planCode,
    source: acquisition.source,
    campaign: acquisition.campaign,
  })

  return {
    merchantId: merchant.id,
    merchantSessionId: session.id,
    experienceId: experience?.id ?? null,
    expiresAt: expiresAt.toISOString(),
    capabilityToken: capability.token,
  }
}

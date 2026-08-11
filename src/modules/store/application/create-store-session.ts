import { logger } from '@/lib/logger'
import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  createMerchantSessionCapability,
  computeSessionExpiresAt,
  isMerchantEntitlementActive,
  merchantInactive,
  merchantNotFound,
  resolveMerchantEntitlement,
  sanitizeSessionAcquisition,
  sessionAcquisitionToMetadata,
  type SessionAcquisitionInput,
} from '../domain'
import { experiencePolicyMetadata, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import type {
  MerchantEventRepository,
  MerchantRepository,
  MerchantSessionRepository,
  StoreUsageRepository,
} from './ports/repositories'

export type CreateStoreSessionResult = {
  merchantId: string
  merchantSessionId: string
  expiresAt: string
  /** Opaque capability — set as HttpOnly cookie; never persist client-side beyond cookie. */
  capabilityToken: string
}

export async function createStoreSession(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  events: MerchantEventRepository
  usage: StoreUsageRepository
  slug: string
  locale?: string | null
  anonymousVisitorId?: string | null
  deviceType?: string | null
  acquisition?: SessionAcquisitionInput | null
}): Promise<CreateStoreSessionResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const entitlement = resolveMerchantEntitlement(merchant)
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)
  if (!isMerchantEntitlementActive(entitlement)) {
    throw new StoreDomainError(
      'MERCHANT_INACTIVE',
      'This store is temporarily unavailable.',
      403,
      'Merchant Pilot entitlement period is not active.',
    )
  }
  if (Number.isFinite(entitlement.commerceSessionAllowance)) {
    const usedSessions = await input.usage.countCommerceSessions(merchant.id)
    if (usedSessions >= entitlement.commerceSessionAllowance) {
      throw new StoreDomainError(
        'ALLOWANCE_EXCEEDED',
        'Merchant commerce session allowance reached.',
        429,
      )
    }
  }

  const capability = createMerchantSessionCapability()
  const expiresAt = computeSessionExpiresAt()
  const acquisitionInput = input.acquisition ?? {}
  const acquisition = sanitizeSessionAcquisition({
    ...acquisitionInput,
    source: acquisitionInput.source ?? merchant.defaultSource,
    campaign: acquisitionInput.campaign ?? merchant.defaultCampaign,
  })

  const session = await input.sessions.create({
    merchantId: merchant.id,
    capabilityTokenHash: capability.tokenHash,
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    locale: input.locale ?? null,
    expiresAt,
    referenceData: merchant.referenceData === true,
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

  logger.info('store', 'Store session created', {
    merchantId: merchant.id,
    merchantSlug: input.slug,
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
    expiresAt: expiresAt.toISOString(),
    capabilityToken: capability.token,
  }
}

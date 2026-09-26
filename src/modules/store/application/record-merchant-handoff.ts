import { buildStoreEventIdempotencyKey, merchantInactive, merchantNotFound, type MerchantHandoffAction } from '../domain'
import { StoreDomainError } from '../domain/errors'
import { merchantHandoffEventMetadata, resolveMerchantHandoff } from '../domain/merchant-handoff'
import type { ExperienceRepository, MerchantEventRepository, MerchantRepository } from './ports/repositories'

export type RecordMerchantHandoffInput = {
  merchants: MerchantRepository
  experiences: ExperienceRepository
  events: MerchantEventRepository
  merchantSlug: string
  experienceSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  action: MerchantHandoffAction
  surface: 'DISCOVERY' | 'RESULT'
  clientActionId: string
  locale?: string | null
  deviceType?: string | null
}

/** Persist one privacy-safe invocation after matching it to canonical config. */
export async function recordMerchantHandoff(input: RecordMerchantHandoffInput) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.clientActionId)) {
    throw new StoreDomainError('VALIDATION_ERROR', 'A valid handoff invocation id is required.', 400)
  }
  const merchant = input.merchants.findPublicBySlug
    ? await input.merchants.findPublicBySlug(input.merchantSlug)
    : await input.merchants.findBySlug(input.merchantSlug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const experience = input.experienceType === 'STORE'
    ? input.experiences.findPublicStoreByMerchant
      ? await input.experiences.findPublicStoreByMerchant(merchant.id)
      : await input.experiences.findDefaultStore(merchant.id)
    : input.experiences.findPublicCampaignByMerchantAndSlug
      ? await input.experiences.findPublicCampaignByMerchantAndSlug(merchant.id, input.experienceSlug)
      : await input.experiences.findActiveCampaignByMerchantAndSlug(merchant.id, input.experienceSlug)
  if (!experience || experience.slug !== input.experienceSlug || experience.type !== input.experienceType) {
    throw new StoreDomainError('EXPERIENCE_NOT_FOUND', 'Experience not found.', 404)
  }

  const configured = [
    resolveMerchantHandoff({ type: experience.primaryCtaType, label: experience.primaryCtaLabel, url: experience.primaryCtaUrl }),
    resolveMerchantHandoff({ type: experience.secondaryCtaType, label: experience.secondaryCtaLabel, url: experience.secondaryCtaUrl }),
  ]
  if (!configured.some((handoff) => handoff?.action === input.action)) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Handoff action is not configured for this Experience.', 400)
  }

  const eventId = buildStoreEventIdempotencyKey({
    type: 'merchant_handoff_invoked',
    merchantId: merchant.id,
    clientActionId: `${experience.id}:${input.action}:${input.clientActionId}`,
  })
  return input.events.appendIdempotent({
    eventId,
    type: 'merchant_handoff_invoked',
    merchantId: merchant.id,
    experienceId: experience.id,
    source: 'CLIENT',
    locale: input.locale ?? null,
    deviceType: input.deviceType ?? null,
    metadata: merchantHandoffEventMetadata(input),
  })
}

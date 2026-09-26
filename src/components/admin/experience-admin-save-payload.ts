import type { DecisionJourneyPolicy } from '@/modules/store/domain/decision-journey'
import type { ExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import { normalizeMerchantHandoffAction } from '@/modules/store/domain/merchant-handoff'

type ExperienceAdminSaveState = {
  type: 'STORE' | 'CAMPAIGN'
  name: string
  status: string
  headline: string | null
  description: string | null
  primaryCtaType: string | null
  primaryCtaLabel: string | null
  primaryCtaUrl: string | null
  offerLabel: string | null
  offerCode: string | null
  startAt: string | null
  endAt: string | null
}

export function buildExperienceAdminSavePayload(
  experience: ExperienceAdminSaveState,
  journeyPolicy: DecisionJourneyPolicy,
  deliveryPolicy: ExperienceDeliveryPolicy,
) {
  const shared = {
    name: experience.name,
    status: experience.status,
    headline: experience.headline,
    description: experience.description,
    primaryCtaType: experience.primaryCtaType == null ? null : normalizeMerchantHandoffAction(experience.primaryCtaType),
    primaryCtaLabel: experience.primaryCtaLabel,
    primaryCtaUrl: experience.primaryCtaUrl,
    offerLabel: experience.offerLabel,
    offerCode: experience.offerCode,
    journeyPolicy,
    deliveryPolicy,
  }

  return experience.type === 'CAMPAIGN'
    ? { ...shared, startAt: experience.startAt, endAt: experience.endAt }
    : shared
}

import {
  resolveExperienceSearchVisibility,
  type ExperienceSearchVisibility,
} from '../domain/experience-search-visibility'
import { resolvePublicDecisionJourney, resolveStoreExperiencePolicy, type StoreExperiencePolicy } from '../domain/experience-policy'
import type { DecisionJourneyPolicy } from '../domain/decision-journey'
import { resolveGuestSponsoredTryOnLimit } from '../domain/merchant-sponsored-usage'
import { resolveExperienceDeliveryPolicy, type ExperienceDeliveryPolicy } from '../domain/delivery-profile'
import { resolveMerchantCommercialCapability } from '../domain/merchant-commercial-capability'
import type { CommercialUsage } from '../domain/merchant-commercial-state'
import type {
  ExperienceRecord,
  ExperienceRepository,
  MerchantFrameRecord,
  MerchantFrameRepository,
  MerchantRecord,
  MerchantRepository,
  StoreUsageRepository,
} from './ports/repositories'

export type PublicDiscoveryFrame = {
  id: string
  name: string
  brand: string | null
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
  updatedAt: Date
}

export type PublicExperienceDiscovery = {
  merchant: {
    id: string
    slug: string
    name: string
    logoUrl: string | null
    websiteUrl: string | null
    accentColor: string | null
    /** Public capability hint only; commercial plan details never leave the server. */
    generativeTryOnAvailable: boolean
    referenceData: boolean
    pilotType: string | null
    updatedAt: Date
  }
  experience: {
    id: string
    merchantId: string
    type: 'STORE' | 'CAMPAIGN'
    slug: string
    name: string
    status: ExperienceRecord['status']
    headline: string | null
    description: string | null
    heroAssetUrl: string | null
    presentationMode?: import('../domain/presentation-mode').PresentationMode | null
    deliveryPolicy: ExperienceDeliveryPolicy
    referenceData: boolean
    updatedAt: Date
  }
  frames: PublicDiscoveryFrame[]
  experiencePolicy: StoreExperiencePolicy
  decisionJourney?: DecisionJourneyPolicy
  guestSponsoredTryOnLimit: number | null
  visibility: ExperienceSearchVisibility
  lastModified: Date
}

async function resolvePublicExperience(
  experiences: ExperienceRepository,
  merchantId: string,
  experienceSlug?: string | null,
): Promise<ExperienceRecord | null> {
  if (experienceSlug) {
    if (experiences.findPublicCampaignByMerchantAndSlug) {
      return experiences.findPublicCampaignByMerchantAndSlug(merchantId, experienceSlug)
    }
    return experiences.findActiveCampaignByMerchantAndSlug(merchantId, experienceSlug)
  }

  const activeStore = experiences.findPublicStoreByMerchant
    ? await experiences.findPublicStoreByMerchant(merchantId)
    : await experiences.findDefaultStore(merchantId)
  if (activeStore) return activeStore
  return null
}

function toPublicDiscoveryFrame(frame: MerchantFrameRecord): PublicDiscoveryFrame {
  return {
    id: frame.id,
    name: frame.name,
    brand: frame.brand,
    imageUrl: frame.imageUrl,
    productUrl: frame.productUrl,
    price: frame.price,
    currency: frame.currency,
    shape: frame.shape,
    material: frame.material,
    color: frame.color,
    widthClass: frame.widthClass,
    updatedAt: frame.updatedAt,
  }
}

/**
 * Read-only server resolver for the discovery layer. It deliberately does not
 * call session, event, usage, asset, or generation services.
 */
export async function getPublicExperienceDiscovery(input: {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  experiences: ExperienceRepository
  slug: string
  experienceSlug?: string | null
  /** Omitted cached-content reads fail closed; the route overlays live usage. */
  commercialUsage?: Partial<CommercialUsage>
}): Promise<PublicExperienceDiscovery | null> {
  const merchant = input.merchants.findPublicBySlug
    ? await input.merchants.findPublicBySlug(input.slug)
    : await input.merchants.findBySlug(input.slug)
  if (!merchant || merchant.status !== 'ACTIVE') return null

  const experience = await resolvePublicExperience(
    input.experiences,
    merchant.id,
    input.experienceSlug,
  )
  if (!experience || experience.merchantId !== merchant.id) return null

  const frames = input.frames.findPublicActiveByMerchantAndExperience
    ? await input.frames.findPublicActiveByMerchantAndExperience(merchant.id, experience)
    : input.frames.findActiveByMerchantAndExperience
    ? await input.frames.findActiveByMerchantAndExperience(merchant.id, experience)
    : await input.frames.findActiveByMerchant(merchant.id)
  const visibility = resolveExperienceSearchVisibility({ merchant, experience, frames })
  if (visibility === 'PRIVATE') return null

  const publicFrames = frames.map(toPublicDiscoveryFrame)
  const latestFrameUpdate = publicFrames.reduce<Date | null>(
    (latest, frame) => !latest || frame.updatedAt > latest ? frame.updatedAt : latest,
    null,
  )

  return {
    merchant: {
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      logoUrl: merchant.logoUrl,
      websiteUrl: merchant.websiteUrl,
      accentColor: merchant.accentColor,
      generativeTryOnAvailable: input.commercialUsage
        ? resolveMerchantCommercialCapability(merchant, input.commercialUsage).decisions.GENERATIVE_TRY_ON.allowed
        : false,
      referenceData: merchant.referenceData === true || experience.referenceData,
      pilotType: merchant.pilotType ?? null,
      updatedAt: merchant.updatedAt,
    },
    experience: {
      id: experience.id,
      merchantId: experience.merchantId,
      type: experience.type,
      slug: experience.slug,
      name: experience.name,
      status: experience.status,
      headline: experience.headline,
      description: experience.description,
      heroAssetUrl: experience.heroAssetUrl,
      presentationMode: experience.presentationMode ?? null,
      deliveryPolicy: resolveExperienceDeliveryPolicy(experience.deliveryPolicy),
      referenceData: experience.referenceData,
      updatedAt: experience.updatedAt,
    },
    frames: publicFrames,
    experiencePolicy: resolveStoreExperiencePolicy(merchant, experience),
    decisionJourney: resolvePublicDecisionJourney(merchant, experience),
    guestSponsoredTryOnLimit: resolveGuestSponsoredTryOnLimit(merchant),
    visibility,
    lastModified: [merchant.updatedAt, experience.updatedAt, latestFrameUpdate]
      .filter((value): value is Date => value instanceof Date)
      .reduce((latest, value) => value > latest ? value : latest),
  }
}

/**
 * Recomputes the public capability hint from the same current-period usage
 * consumed by runtime enforcement. Public discovery content is ISR-cached, but
 * this tiny commercial overlay is deliberately live so quota exhaustion cannot
 * leave a stale Try-On claim on Store or Campaign pages.
 */
export async function resolvePublicGenerativeTryOnAvailability(input: {
  merchants: MerchantRepository
  usage: StoreUsageRepository
  slug: string
  now?: Date
}): Promise<boolean> {
  const merchant = input.merchants.findPublicBySlug
    ? await input.merchants.findPublicBySlug(input.slug)
    : await input.merchants.findBySlug(input.slug)
  if (!merchant || merchant.status !== 'ACTIVE') return false

  const now = input.now ?? new Date()
  const baseline = resolveMerchantCommercialCapability(merchant, {}, now)
  const sessionLimit = baseline.state.plan?.aiCommerceSessions
  let aiCommerceSessions = 0
  if (sessionLimit !== null && sessionLimit !== undefined) {
    if (!input.usage.countAICommerceSessions) return false
    aiCommerceSessions = await input.usage.countAICommerceSessions({
      merchantId: merchant.id,
      periodStart: baseline.state.period.start,
      periodEnd: baseline.state.period.end,
    })
  }

  return resolveMerchantCommercialCapability(
    merchant,
    { aiCommerceSessions },
    now,
  ).decisions.GENERATIVE_TRY_ON.allowed
}

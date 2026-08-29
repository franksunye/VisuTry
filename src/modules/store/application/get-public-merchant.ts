import {
  merchantInactive,
  merchantNotFound,
  type MerchantStatus,
} from '../domain'
import type { MerchantRecord, MerchantRepository, MerchantFrameRepository } from './ports/repositories'
import type { ExperienceRepository, ExperienceRecord } from './ports/repositories'
import { resolveMerchantExperience } from './resolve-experience'
import { resolveStoreExperiencePolicy, type StoreExperiencePolicy } from '../domain/experience-policy'
import { resolveGuestSponsoredTryOnLimit } from '../domain/merchant-sponsored-usage'
import { productBrandForFrame } from './product-labels'
import type { PresentationMode } from '../domain/presentation-mode'
import type { PublicExperienceDiscovery } from './get-public-experience-discovery'

export type PublicMerchantFramePreview = {
  id: string
  name: string
  imageUrl: string | null
  shape: string
  color: string | null
  productBrand: string | null
}

export type PublicMerchantProfile = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  accentColor: string | null
  pilotType: string | null
  referenceData: boolean
  experiencePolicy: StoreExperiencePolicy
  /**
   * Anonymous guest sponsored generation ceiling. Null = no sponsored cap
   * (merchant commercial entitlement / compare policy applies).
   */
  guestSponsoredTryOnLimit: number | null
  activeFrameCount: number
  featuredFrames: PublicMerchantFramePreview[]
  status: MerchantStatus
  experience: {
    id: string
    type: 'STORE' | 'CAMPAIGN'
    slug: string
    name: string
    headline: string | null
    description: string | null
    heroAssetUrl: string | null
    presentationMode: PresentationMode | null
    primaryCta: { type: string; label: string; url: string | null } | null
    secondaryCta: { type: string; label: string; url: string | null } | null
    offer: { label: string; code: string | null; terms: string | null } | null
    referenceData: boolean
  } | null
}

export async function getPublicMerchantProfile(input: {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  experiences?: ExperienceRepository
  slug: string
  experienceSlug?: string | null
}): Promise<PublicMerchantProfile> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) {
    throw merchantNotFound()
  }
  if (merchant.status !== 'ACTIVE') {
    throw merchantInactive()
  }

  const experience = await resolveMerchantExperience({
    merchant,
    experiences: input.experiences,
    slug: input.experienceSlug ?? null,
  })
  const activeFrames = experience && input.frames.findPublicActiveByMerchantAndExperience
    ? await input.frames.findPublicActiveByMerchantAndExperience(merchant.id, experience)
    : experience && input.frames.findActiveByMerchantAndExperience
      ? await input.frames.findActiveByMerchantAndExperience(merchant.id, experience)
      : await input.frames.findActiveByMerchant(merchant.id)

  return toPublicMerchantProfile(merchant, activeFrames, experience)
}

export function toPublicMerchantProfile(
  merchant: MerchantRecord,
  activeFrames: Awaited<ReturnType<MerchantFrameRepository['findActiveByMerchant']>>,
  experience: ExperienceRecord | null = null,
): PublicMerchantProfile {
  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    logoUrl: merchant.logoUrl,
    websiteUrl: merchant.websiteUrl,
    accentColor: merchant.accentColor,
    pilotType: merchant.pilotType ?? null,
    referenceData: merchant.referenceData === true || experience?.referenceData === true,
    experiencePolicy: resolveStoreExperiencePolicy(merchant),
    guestSponsoredTryOnLimit: resolveGuestSponsoredTryOnLimit(merchant),
    activeFrameCount: activeFrames.length,
    featuredFrames: activeFrames.slice(0, 4).map((frame) => ({
      id: frame.id,
      name: frame.name,
      imageUrl: frame.imageUrl,
      shape: frame.shape,
      color: frame.color,
      productBrand: productBrandForFrame(frame),
    })),
    status: merchant.status,
    experience: experience
      ? {
          id: experience.id,
          type: experience.type,
          slug: experience.slug,
          name: experience.name,
          headline: experience.headline,
          description: experience.description,
          heroAssetUrl: experience.heroAssetUrl,
          presentationMode: experience.presentationMode ?? null,
          primaryCta: experience.primaryCtaType && experience.primaryCtaLabel
            ? { type: experience.primaryCtaType, label: experience.primaryCtaLabel, url: experience.primaryCtaUrl }
            : null,
          secondaryCta: experience.secondaryCtaType && experience.secondaryCtaLabel
            ? { type: experience.secondaryCtaType, label: experience.secondaryCtaLabel, url: experience.secondaryCtaUrl }
            : null,
          offer: experience.offerLabel
            ? { label: experience.offerLabel, code: experience.offerCode, terms: experience.offerTerms }
            : null,
          referenceData: experience.referenceData,
        }
      : null,
  }
}

/**
 * Safe public subset already loaded by Store/Campaign RSC discovery.
 * Used as the shopper workspace bootstrap so modal mount does not
 * depend on a second catalog GET.
 */
export function publicMerchantFromDiscovery(
  discovery: PublicExperienceDiscovery,
): PublicMerchantProfile {
  return {
    id: discovery.merchant.id,
    slug: discovery.merchant.slug,
    name: discovery.merchant.name,
    logoUrl: discovery.merchant.logoUrl,
    websiteUrl: discovery.merchant.websiteUrl,
    accentColor: discovery.merchant.accentColor,
    pilotType: discovery.merchant.pilotType ?? null,
    referenceData: discovery.merchant.referenceData || discovery.experience.referenceData,
    experiencePolicy: discovery.experiencePolicy,
    guestSponsoredTryOnLimit: discovery.guestSponsoredTryOnLimit,
    activeFrameCount: discovery.frames.length,
    featuredFrames: discovery.frames.slice(0, 4).map((frame) => ({
      id: frame.id,
      name: frame.name,
      imageUrl: frame.imageUrl,
      shape: frame.shape,
      color: frame.color,
      productBrand: frame.brand,
    })),
    status: 'ACTIVE',
    experience: {
      id: discovery.experience.id,
      type: discovery.experience.type,
      slug: discovery.experience.slug,
      name: discovery.experience.name,
      headline: discovery.experience.headline,
      description: discovery.experience.description,
      heroAssetUrl: discovery.experience.heroAssetUrl,
      presentationMode: discovery.experience.presentationMode ?? null,
      primaryCta: null,
      secondaryCta: null,
      offer: null,
      referenceData: discovery.experience.referenceData,
    },
  }
}

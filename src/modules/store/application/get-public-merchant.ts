import {
  merchantInactive,
  merchantNotFound,
  type MerchantStatus,
} from '../domain'
import type { MerchantRecord, MerchantRepository, MerchantFrameRepository } from './ports/repositories'
import type { ExperienceRepository, ExperienceRecord } from './ports/repositories'
import { resolveMerchantExperience } from './resolve-experience'
import { resolveStoreExperiencePolicy, type StoreExperiencePolicy } from '../domain/experience-policy'
import { productBrandForFrame } from './product-labels'

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
  const activeFrames = experience && input.frames.findActiveByMerchantAndExperience
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

import {
  merchantInactive,
  merchantNotFound,
  type MerchantStatus,
} from '../domain'
import type { MerchantRecord, MerchantRepository, MerchantFrameRepository } from './ports/repositories'
import { resolveStoreExperiencePolicy, type StoreExperiencePolicy } from '../domain/experience-policy'

export type PublicMerchantFramePreview = {
  id: string
  name: string
  imageUrl: string | null
  shape: string
  color: string | null
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
}

export async function getPublicMerchantProfile(input: {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  slug: string
}): Promise<PublicMerchantProfile> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) {
    throw merchantNotFound()
  }
  if (merchant.status !== 'ACTIVE') {
    throw merchantInactive()
  }

  const activeFrames = await input.frames.findActiveByMerchant(merchant.id)

  return toPublicMerchantProfile(merchant, activeFrames)
}

export function toPublicMerchantProfile(
  merchant: MerchantRecord,
  activeFrames: Awaited<ReturnType<MerchantFrameRepository['findActiveByMerchant']>>,
): PublicMerchantProfile {
  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    logoUrl: merchant.logoUrl,
    websiteUrl: merchant.websiteUrl,
    accentColor: merchant.accentColor,
    pilotType: merchant.pilotType ?? null,
    referenceData: merchant.referenceData === true,
    experiencePolicy: resolveStoreExperiencePolicy(merchant),
    activeFrameCount: activeFrames.length,
    featuredFrames: activeFrames.slice(0, 4).map((frame) => ({
      id: frame.id,
      name: frame.name,
      imageUrl: frame.imageUrl,
      shape: frame.shape,
      color: frame.color,
    })),
    status: merchant.status,
  }
}

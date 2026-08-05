import {
  merchantInactive,
  merchantNotFound,
  type MerchantStatus,
} from '../domain'
import type { MerchantRecord, MerchantRepository, MerchantFrameRepository } from './ports/repositories'

export type PublicMerchantProfile = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  accentColor: string | null
  activeFrameCount: number
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

  return toPublicMerchantProfile(merchant, activeFrames.length)
}

export function toPublicMerchantProfile(
  merchant: MerchantRecord,
  activeFrameCount: number,
): PublicMerchantProfile {
  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    logoUrl: merchant.logoUrl,
    websiteUrl: merchant.websiteUrl,
    accentColor: merchant.accentColor,
    activeFrameCount,
    status: merchant.status,
  }
}

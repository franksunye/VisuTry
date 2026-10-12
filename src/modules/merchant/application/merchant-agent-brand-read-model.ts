import {
  MERCHANT_BRAND_PALETTE,
  brandAccentForDisplay,
} from '../domain/merchant-brand-kit'

type BrandMerchantRow = {
  id: string
  name: string
  logoUrl: string | null
  accentColor: string | null
}
type BrandExperienceRow = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  status: string
  heroAssetUrl: string | null
}

/** One bounded public-safe Agent response shape shared by Node and Cloudflare. */
export function merchantAgentBrandReadModel(input: {
  merchant: BrandMerchantRow
  experience?: BrandExperienceRow | null
}) {
  return {
    merchant: {
      id: input.merchant.id,
      name: input.merchant.name,
      logoUrl: input.merchant.logoUrl,
      accentColor: input.merchant.accentColor,
      effectiveAccentColor: brandAccentForDisplay(input.merchant.accentColor),
    },
    supportedAccentColors: MERCHANT_BRAND_PALETTE.map(({ name, hex }) => ({ name, hex })),
    experience: input.experience ?? null,
    permissions: {
      brandChanges: 'HUMAN_OWNER_ONLY',
      experienceHeroChanges: 'HUMAN_OWNER_ONLY',
    },
  }
}

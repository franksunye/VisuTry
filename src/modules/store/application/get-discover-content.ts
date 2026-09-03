import type { Locale } from '@/i18n'
import {
  DISCOVER_FEATURED_EXPERIENCES,
  DISCOVER_MERCHANT_SLUGS,
  getDiscoverCopy,
} from '@/config/discover'
import { buildMerchantExperienceHref } from './build-merchant-experience-href'
import type {
  ExperienceRecord,
  ExperienceRepository,
  MerchantRecord,
  MerchantRepository,
  MerchantFrameRepository,
} from './ports/repositories'

export type DiscoverFeaturedExperience = {
  merchantName: string
  merchantSlug: string
  experienceName: string
  experienceSlug: string
  experienceType: 'CAMPAIGN'
  headline: string
  description: string
  heroAssetUrl: string
  referenceData: boolean
  intentLabel: string
  catalogCount: number
  href: string
}

export type DiscoverMerchant = {
  name: string
  slug: string
  logoUrl: string | null
  accentColor: string | null
  referenceData: boolean
  storeName: string
  storeDescription: string | null
  href: string
}

export type DiscoverContent = {
  copy: ReturnType<typeof getDiscoverCopy>
  featured: DiscoverFeaturedExperience[]
  merchants: DiscoverMerchant[]
  canary: {
    href: string
    name: string
    description: string
  }
}

export type DiscoverRuntime = {
  merchants: Pick<MerchantRepository, 'findBySlug'>
  experiences: Pick<ExperienceRepository, 'findActiveCampaignByMerchantAndSlug' | 'findDefaultStore'>
  frames: Pick<MerchantFrameRepository, 'findActiveByMerchantAndExperience'>
}

function isPubliclyUsableExperience(
  merchant: MerchantRecord | null,
  experience: ExperienceRecord | null,
): boolean {
  return Boolean(
    merchant
    && merchant.status === 'ACTIVE'
    && experience
    && experience.status === 'ACTIVE'
    && experience.type === 'CAMPAIGN'
    && experience.frameIds.length > 0,
  )
}

export async function getDiscoverContent(
  locale: Locale,
  runtime: DiscoverRuntime,
): Promise<DiscoverContent> {
  const [featured, merchants] = await Promise.all([
    Promise.all(DISCOVER_FEATURED_EXPERIENCES.map(async (candidate) => {
      const merchant = await runtime.merchants.findBySlug(candidate.merchantSlug)
      if (!merchant) return null

      const experience = await runtime.experiences.findActiveCampaignByMerchantAndSlug(
        merchant.id,
        candidate.experienceSlug,
      )
      if (!merchant || !experience || !isPubliclyUsableExperience(merchant, experience)) return null

      const frames = runtime.frames.findActiveByMerchantAndExperience
        ? await runtime.frames.findActiveByMerchantAndExperience(merchant.id, experience)
        : []
      const heroAssetUrl = experience.heroAssetUrl ?? frames.find((frame) => frame.imageUrl)?.imageUrl ?? null
      if (!heroAssetUrl || frames.length === 0) return null

      return {
        merchantName: merchant.name,
        merchantSlug: merchant.slug,
        experienceName: experience.name,
        experienceSlug: experience.slug,
        experienceType: 'CAMPAIGN' as const,
        headline: experience.headline ?? experience.name,
        description: experience.description ?? 'Explore a focused eyewear edit.',
        heroAssetUrl,
        referenceData: merchant.referenceData === true || experience.referenceData,
        intentLabel: candidate.intentLabel,
        catalogCount: frames.length,
        href: buildMerchantExperienceHref({
          path: `/${locale}/c/${merchant.slug}/${experience.slug}`,
          surface: 'discover',
          campaign: 'discover-featured',
        }),
      }
    })),
    Promise.all(DISCOVER_MERCHANT_SLUGS.map(async (merchantSlug) => {
      const merchant = await runtime.merchants.findBySlug(merchantSlug)
      if (!merchant || merchant.status !== 'ACTIVE') return null

      const store = await runtime.experiences.findDefaultStore(merchant.id)
      return {
        name: merchant.name,
        slug: merchant.slug,
        logoUrl: merchant.logoUrl,
        accentColor: merchant.accentColor,
        referenceData: merchant.referenceData === true || store?.referenceData === true,
        storeName: store?.name ?? 'Hosted Store',
        storeDescription: store?.description ?? null,
        href: buildMerchantExperienceHref({
          path: `/${locale}/store/${merchant.slug}`,
          surface: 'discover',
          campaign: 'discover-merchant',
        }),
      }
    })),
  ])

  return {
    copy: getDiscoverCopy(locale),
    featured: featured.filter((item) => item !== null),
    merchants: merchants.filter((item) => item !== null),
    canary: {
      href: `/${locale}/store/visutry-demo?source=visutry&medium=internal&surface=discover&campaign=discovery-canary`,
      name: 'VisuTry Demo',
      description: 'A first-party demo collection for evaluating frame discovery, virtual try-on, comparison, and shopper decision flows.',
    },
  }
}

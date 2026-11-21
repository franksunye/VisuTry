import type { Locale } from '@/i18n'
import {
  DISCOVER_FEATURED_EXPERIENCES,
  DISCOVER_MERCHANT_SLUGS,
  getDiscoverCopy,
} from '@/config/discover'
import { buildMerchantExperienceHref } from './build-merchant-experience-href'
import { VISUTRY_DEMO_MERCHANT_SLUG } from '../domain/visutry-demo-identity'
import { MERCHANT_DISCOVERY_EDITORIAL } from '@/config/merchant-discovery-editorial'
import { getMerchantDiscoveryEditorial } from '@/lib/merchant-discovery-editorial'
import { resolveExperienceSearchVisibility } from '../domain/experience-search-visibility'
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
  learningExample: {
    href: string
    headline: string
    description: string
    nonSaleNotice: string
  } | null
  demo: {
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
  // Featured campaigns and merchant cards overlap heavily. Reuse one in-flight
  // merchant lookup per slug within this render without caching public status
  // between requests (a merchant can be deactivated at any time).
  const merchantReads = new Map<string, ReturnType<typeof runtime.merchants.findBySlug>>()
  const findMerchant = (slug: string) => {
    let pending = merchantReads.get(slug)
    if (!pending) {
      pending = runtime.merchants.findBySlug(slug)
      merchantReads.set(slug, pending)
    }
    return pending
  }

  const readLearningExample = async (): Promise<DiscoverContent['learningExample']> => {
    // The reviewed text is English. Keep this small acquisition example separate
    // from the productized sales Demo and from the Reference portfolio.
    if (locale !== 'en') return null
    const candidate = MERCHANT_DISCOVERY_EDITORIAL
    const merchant = await findMerchant(candidate.merchantSlug)
    if (!merchant || merchant.slug !== candidate.merchantSlug || merchant.status !== 'ACTIVE'
      || merchant.referenceData || merchant.pilotType?.toUpperCase() !== 'LIVE') return null

    const experience = await runtime.experiences.findActiveCampaignByMerchantAndSlug(
      merchant.id,
      candidate.experienceSlug,
    )
    if (!experience || experience.merchantId !== merchant.id || experience.type !== 'CAMPAIGN'
      || experience.slug !== candidate.experienceSlug || experience.status !== 'ACTIVE'
      || experience.referenceData) return null

    const selectedFrames = runtime.frames.findActiveByMerchantAndExperience
      ? await runtime.frames.findActiveByMerchantAndExperience(merchant.id, experience)
      : []
    const frames = selectedFrames.filter((frame) => frame.merchantId === merchant.id
      && frame.status === 'ACTIVE' && experience.frameIds.includes(frame.id))
    // Discovery links honor the same public admission rule as the destination;
    // an allowlist entry never makes a draft, reference or thin collection public.
    const visibility = resolveExperienceSearchVisibility({ merchant, experience, frames })
    const editorial = getMerchantDiscoveryEditorial({
      merchant: { ...merchant, pilotType: merchant.pilotType ?? null, referenceData: Boolean(merchant.referenceData) },
      experience,
      frames,
      visibility,
    })
    if (!editorial) return null

    return {
      href: buildMerchantExperienceHref({
        path: `/en/c/${merchant.slug}/${experience.slug}`,
        surface: 'discover',
        campaign: 'discover-canary-learning',
      }),
      headline: editorial.headline,
      description: editorial.description,
      nonSaleNotice: editorial.nonSaleNotice,
    }
  }

  const [featured, merchants, learningExample] = await Promise.all([
    Promise.all(DISCOVER_FEATURED_EXPERIENCES.map(async (candidate) => {
      const merchant = await findMerchant(candidate.merchantSlug)
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
      const merchant = await findMerchant(merchantSlug)
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
    readLearningExample(),
  ])

  return {
    copy: getDiscoverCopy(locale),
    featured: featured.filter((item) => item !== null),
    merchants: merchants.filter((item) => item !== null),
    learningExample,
    demo: {
      href: `/${locale}/store/${VISUTRY_DEMO_MERCHANT_SLUG}?source=visutry&medium=internal&surface=discover&campaign=canonical-demo`,
      name: 'VisuTry Demo Optical',
      description: 'A first-party demo collection for evaluating frame discovery, virtual try-on, comparison, and shopper decision flows.',
    },
  }
}

import { unstable_cache } from 'next/cache'
import { createPublicStoreReadRuntime } from './public-read-runtime'
import {
  getPublicExperienceDiscovery,
  resolvePublicGenerativeTryOnAvailability,
} from './get-public-experience-discovery'
import {
  PUBLIC_DISCOVERY_CACHE,
  publicDiscoveryCacheKey,
  publicDiscoveryCacheTags,
} from '@/lib/store-discovery-cache'
import {
  isPublicCampaignRouteAdmitted,
  isPublicStoreRouteAdmitted,
} from './public-route-admission'

/**
 * Persistent, slug-scoped content read model shared by generateMetadata and
 * the page. Content and frames stay ISR-cached; the quota-sensitive public
 * Try-On hint is overlaid from current commercial usage after the cache read.
 */
export async function getPublicExperienceDiscoveryForRoute(
  slug: string,
  experienceSlug?: string | null,
  locale = 'en',
) {
  const admitted = experienceSlug
    ? await isPublicCampaignRouteAdmitted({ merchantSlug: slug, experienceSlug })
    : await isPublicStoreRouteAdmitted({ merchantSlug: slug })
  if (!admitted) return null

  const revalidate = experienceSlug
    ? PUBLIC_DISCOVERY_CACHE.campaignRevalidateSeconds
    : PUBLIC_DISCOVERY_CACHE.storeRevalidateSeconds
  const cachedRead = unstable_cache(
    async () => {
      const runtime = createPublicStoreReadRuntime()
      return getPublicExperienceDiscovery({
        merchants: runtime.merchants,
        frames: runtime.frames,
        experiences: runtime.experiences,
        slug,
        experienceSlug,
      })
    },
    publicDiscoveryCacheKey({ locale, merchantSlug: slug, experienceSlug }),
    {
      revalidate,
      tags: publicDiscoveryCacheTags(slug, experienceSlug),
    },
  )

  const discovery = await cachedRead()
  if (!discovery) return null

  // Keep rich Store/Campaign content on the existing ISR boundary while
  // refreshing the quota-sensitive capability hint against live usage.
  const runtime = createPublicStoreReadRuntime()
  const generativeTryOnAvailable = await resolvePublicGenerativeTryOnAvailability({
    merchants: runtime.merchants,
    usage: runtime.usage,
    slug,
  })
  return {
    ...discovery,
    merchant: { ...discovery.merchant, generativeTryOnAvailable },
  }
}

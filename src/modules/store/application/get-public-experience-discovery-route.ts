import { unstable_cache } from 'next/cache'
import { createStoreRuntime } from './runtime'
import { getPublicExperienceDiscovery } from './get-public-experience-discovery'
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
 * Persistent, slug-scoped read model shared by generateMetadata and the page.
 * The cached function is the only route-level entry point that reaches the
 * Store repositories; cache hits do not instantiate a DB read.
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
      const runtime = createStoreRuntime()
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

  return cachedRead()
}

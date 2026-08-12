import { createStoreRuntime } from './runtime'
import { getPublicExperienceDiscovery } from './get-public-experience-discovery'

/** Read-only route loader shared by generateMetadata and the page. */
export async function getPublicExperienceDiscoveryForRoute(
  slug: string,
  experienceSlug?: string | null,
) {
  const runtime = createStoreRuntime()
  return getPublicExperienceDiscovery({
    merchants: runtime.merchants,
    frames: runtime.frames,
    experiences: runtime.experiences,
    slug,
    experienceSlug,
  })
}

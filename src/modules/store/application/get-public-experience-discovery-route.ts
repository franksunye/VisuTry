import { unstable_cache } from 'next/cache'
import { createPublicStoreReadRuntime } from './public-read-runtime'
import {
  getPublicExperienceDiscovery,
  resolvePublicGenerativeTryOnStatus,
} from './get-public-experience-discovery'
import type { PublicTryOnUnavailableReason } from './get-public-experience-discovery'
import {
  PUBLIC_DISCOVERY_CACHE,
  publicDiscoveryCacheKey,
  publicDiscoveryCacheTags,
} from '@/lib/store-discovery-cache'
import {
  isPublicCampaignRouteAdmitted,
  isPublicStoreRouteAdmitted,
} from './public-route-admission'
import { resolveMerchantCommercialCapability } from '../domain/merchant-commercial-capability'

/**
 * Persistent, slug-scoped content read model for metadata and the page.
 * Metadata only needs these cacheable SEO facts; it must not trigger live
 * merchant entitlement or usage queries during an ISR regeneration.
 */
export async function getPublicExperienceDiscoveryContentForRoute(
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

  return cachedRead()
}

/** The render path overlays live entitlements without polluting cached SEO content. */
export async function getPublicExperienceDiscoveryForRoute(
  slug: string,
  experienceSlug?: string | null,
  locale = 'en',
) {
  const discovery = await getPublicExperienceDiscoveryContentForRoute(slug, experienceSlug, locale)
  if (!discovery) return null
  const archivedCampaign = discovery.experience.type === 'CAMPAIGN'
    && discovery.experience.status === 'ARCHIVED'

  // Keep rich Store/Campaign content on the existing ISR boundary while
  // refreshing the quota-sensitive capability hint against live usage.
  let generativeTryOnAvailable = false
  let generativeTryOnUnavailableReason: PublicTryOnUnavailableReason | null = 'TEMPORARILY_UNAVAILABLE'
  let merchantHandoffAvailable = false
  let kioskDeliveryAvailable = false
  const runtime = createPublicStoreReadRuntime()

  // Resolve the mutable merchant state once for all commercial capabilities.
  // Metadata exclusively uses the cached-content read above.
  let merchant: Awaited<ReturnType<typeof runtime.merchants.findBySlug>> = null
  try {
    merchant = runtime.merchants.findPublicBySlug
      ? await runtime.merchants.findPublicBySlug(slug)
      : await runtime.merchants.findBySlug(slug)
    if (!archivedCampaign && merchant?.status === 'ACTIVE') {
      const capability = resolveMerchantCommercialCapability(merchant)
      merchantHandoffAvailable = capability.decisions.MERCHANT_HANDOFF.allowed
      kioskDeliveryAvailable = capability.decisions.KIOSK_DELIVERY.allowed
    }
  } catch {
    // Preserve cached public content, but never grant a commercial capability
    // when the live merchant lookup fails.
  }

  if (!archivedCampaign && merchant) {
    try {
      const availability = await resolvePublicGenerativeTryOnStatus({
        merchants: runtime.merchants,
        usage: runtime.usage,
        slug,
        merchant,
      })
      generativeTryOnAvailable = availability.available
      generativeTryOnUnavailableReason = availability.unavailableReason
    } catch {
      // Keep cached discovery available during a commercial-usage outage, while
      // conservatively removing only the metered Try-On capability claim.
      generativeTryOnAvailable = false
      generativeTryOnUnavailableReason = 'TEMPORARILY_UNAVAILABLE'
    }
  }

  return {
    ...discovery,
    merchant: { ...discovery.merchant, generativeTryOnAvailable, generativeTryOnUnavailableReason },
    experiencePolicy: archivedCampaign
      ? { ...discovery.experiencePolicy, tryOnEnabled: false, compareEnabled: false, inquiryEnabled: false }
      : generativeTryOnAvailable
        ? discovery.experiencePolicy
        : { ...discovery.experiencePolicy, tryOnEnabled: false, compareEnabled: false },
    decisionJourney: archivedCampaign
      ? { ...discovery.decisionJourney, enabledStages: [] }
      : generativeTryOnAvailable
        ? discovery.decisionJourney
        : {
            ...discovery.decisionJourney,
            enabledStages: discovery.decisionJourney?.enabledStages.filter((stage) => stage !== 'TRY_ON' && stage !== 'COMPARE') ?? [],
          },
    experience: {
      ...discovery.experience,
      primaryHandoff: merchantHandoffAvailable ? discovery.experience.primaryHandoff : null,
      secondaryHandoff: merchantHandoffAvailable ? discovery.experience.secondaryHandoff : null,
      deliveryPolicy: {
        ...discovery.experience.deliveryPolicy,
        kioskEnabled: kioskDeliveryAvailable && discovery.experience.deliveryPolicy.kioskEnabled,
      },
    },
  }
}

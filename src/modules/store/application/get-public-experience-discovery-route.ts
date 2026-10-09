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
  let generativeTryOnAvailable = false
  let generativeTryOnUnavailableReason: PublicTryOnUnavailableReason | null = 'TEMPORARILY_UNAVAILABLE'
  let merchantHandoffAvailable = false
  let kioskDeliveryAvailable = false
  const runtime = createPublicStoreReadRuntime()

  try {
    const availability = await resolvePublicGenerativeTryOnStatus({
      merchants: runtime.merchants,
      usage: runtime.usage,
      slug,
    })
    generativeTryOnAvailable = availability.available
    generativeTryOnUnavailableReason = availability.unavailableReason
  } catch {
    // Keep cached discovery available during a commercial-usage outage, while
    // conservatively removing only the metered Try-On capability claim.
    generativeTryOnAvailable = false
    generativeTryOnUnavailableReason = 'TEMPORARILY_UNAVAILABLE'
  }

  try {
    const merchant = runtime.merchants.findPublicBySlug
      ? await runtime.merchants.findPublicBySlug(slug)
      : await runtime.merchants.findBySlug(slug)
    if (merchant?.status === 'ACTIVE') {
      const capability = resolveMerchantCommercialCapability(merchant)
      merchantHandoffAvailable = capability.decisions.MERCHANT_HANDOFF.allowed
      kioskDeliveryAvailable = capability.decisions.KIOSK_DELIVERY.allowed
    }
  } catch {
    // Non-metered plan capabilities fail closed without coupling them to the
    // AI usage overlay above.
    merchantHandoffAvailable = false
    kioskDeliveryAvailable = false
  }
  return {
    ...discovery,
    merchant: { ...discovery.merchant, generativeTryOnAvailable, generativeTryOnUnavailableReason },
    experiencePolicy: generativeTryOnAvailable
      ? discovery.experiencePolicy
      : { ...discovery.experiencePolicy, tryOnEnabled: false, compareEnabled: false },
    decisionJourney: generativeTryOnAvailable
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

import { MERCHANT_DISCOVERY_EDITORIAL } from '@/config/merchant-discovery-editorial'
import { isValidLocale } from '@/i18n'
import { publicMerchantImageUrl } from '@/lib/is-loopback-image-url'
import { SITE_CONFIG } from '@/lib/seo'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

const CANARY_DISCOVERY_ORIGIN = 'https://www.visutry.com'

type CanarySourceIdentity = {
  merchant: Pick<PublicExperienceDiscovery['merchant'], 'id' | 'slug' | 'pilotType' | 'referenceData'>
  experience: Pick<PublicExperienceDiscovery['experience'], 'merchantId' | 'type' | 'slug' | 'status' | 'referenceData'>
  visibility: PublicExperienceDiscovery['visibility']
}

export type CanaryDiscoveryFrame = {
  id: string
  name: string
  shape: string
  imageUrl: string | null
  merchantName: string
  canonicalPath: string
  canonicalUrl: string
  storePath: string | null
  campaignPath: string | null
  lastModified: Date
}

export function isCanaryDiscoveryFrameId(frameId: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(frameId)
}

export function canaryDiscoveryFramePath(frameId: string): string {
  return `/en/discover/frames/${encodeURIComponent(frameId)}`
}

export function canaryDiscoveryFrameUrl(frameId: string): string {
  return new URL(canaryDiscoveryFramePath(frameId), SITE_CONFIG.url).toString()
}

/** Only the two independently admitted first-party acquisition sources qualify. */
export function isCanaryDiscoverySource(discovery: CanarySourceIdentity): boolean {
  const { merchant, experience } = discovery
  return merchant.slug === MERCHANT_DISCOVERY_EDITORIAL.merchantSlug
    && merchant.pilotType?.toUpperCase() === 'LIVE'
    && !merchant.referenceData
    && experience.merchantId === merchant.id
    && !experience.referenceData
    && experience.status === 'ACTIVE'
    && discovery.visibility === 'PUBLIC_INDEX'
    && (
      (experience.type === 'STORE' && experience.slug === MERCHANT_DISCOVERY_EDITORIAL.storeExperienceSlug)
      || (experience.type === 'CAMPAIGN' && experience.slug === MERCHANT_DISCOVERY_EDITORIAL.experienceSlug)
    )
}

function isLegacyDemoFrameDestination(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value, CANARY_DISCOVERY_ORIGIN)
    if (![CANARY_DISCOVERY_ORIGIN, 'https://visutry.com'].includes(url.origin)
      || url.username || url.password) return false
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.length === 4 && isValidLocale(parts[0])
      && parts[1] === 'demo' && parts[2] === 'frames'
      && (MERCHANT_DISCOVERY_EDITORIAL.legacyDemoFrameSlugs as readonly string[]).includes(parts[3])
  } catch {
    return false
  }
}

function isMappedCanaryFrame(frame: PublicExperienceDiscovery['frames'][number]): boolean {
  return isCanaryDiscoveryFrameId(frame.id) && Boolean(frame.name.trim())
    && isLegacyDemoFrameDestination(frame.productUrl)
}

/**
 * Project legacy links onto a real, same-tenant detail route by actual frame ID.
 * The reader below uses exactly the same source/frame predicate. This changes
 * neither stored data nor public-index eligibility and never infers identity
 * from a SKU, image or the shape named in a legacy URL.
 */
export function normalizeMerchantDiscoveryDestinations(
  discovery: PublicExperienceDiscovery,
): PublicExperienceDiscovery {
  if (!isCanaryDiscoverySource(discovery)) return discovery
  let changed = false
  const frames = discovery.frames.map((frame) => {
    if (!isMappedCanaryFrame(frame)) return frame
    changed = true
    return { ...frame, productUrl: canaryDiscoveryFrameUrl(frame.id) }
  })
  return changed ? { ...discovery, frames } : discovery
}

function publicReadDate(value: Date | string): Date {
  // Next's persistent data cache JSON-roundtrips Dates. Source reads can mix
  // cache hits (ISO strings) and misses (Dates) in the same render.
  return value instanceof Date ? value : new Date(value)
}

function latestDate(values: Array<Date | string>): Date {
  return new Date(Math.max(...values.map((value) => publicReadDate(value).getTime())))
}

/** Pure projection shared by detail lookup and the dynamic sitemap. */
export function buildCanaryDiscoveryFrames(input: {
  store: PublicExperienceDiscovery | null
  campaign: PublicExperienceDiscovery | null
}): CanaryDiscoveryFrame[] {
  const store = input.store && input.store.experience.type === 'STORE'
    && isCanaryDiscoverySource(input.store) ? input.store : null
  const campaign = input.campaign && input.campaign.experience.type === 'CAMPAIGN'
    && isCanaryDiscoverySource(input.campaign) ? input.campaign : null
  // A cache transition must not combine two different merchant identities just
  // because their public slugs happen to match.
  if (store && campaign && store.merchant.id !== campaign.merchant.id) return []
  const frames = new Map<string, CanaryDiscoveryFrame>()
  const frameUpdatedAt = new Map<string, Date>()

  for (const source of [store, campaign]) {
    if (!source) continue
    for (const frame of source.frames) {
      if (!isMappedCanaryFrame(frame)) continue
      const prior = frames.get(frame.id)
      const lastModified = latestDate([
        source.merchant.updatedAt, source.experience.updatedAt, frame.updatedAt,
        ...(prior ? [prior.lastModified] : []),
      ])
      // Two cached sources can briefly contain different versions of the same
      // actual row. Keep the latest frame facts and both admitted continuations.
      const currentFrameUpdatedAt = publicReadDate(frame.updatedAt)
      const useCurrentFacts = !prior || currentFrameUpdatedAt.getTime() >= frameUpdatedAt.get(frame.id)!.getTime()
      frames.set(frame.id, {
        id: frame.id,
        name: useCurrentFacts ? frame.name.trim() : prior!.name,
        shape: useCurrentFacts ? frame.shape.trim() : prior!.shape,
        imageUrl: useCurrentFacts ? publicMerchantImageUrl(frame.imageUrl) : prior!.imageUrl,
        merchantName: source.merchant.name,
        canonicalPath: canaryDiscoveryFramePath(frame.id),
        canonicalUrl: canaryDiscoveryFrameUrl(frame.id),
        storePath: source.experience.type === 'STORE'
          ? `/en/store/${source.merchant.slug}`
          : prior?.storePath ?? null,
        campaignPath: source.experience.type === 'CAMPAIGN'
          ? `/en/c/${source.merchant.slug}/${source.experience.slug}`
          : prior?.campaignPath ?? null,
        lastModified,
      })
      if (useCurrentFacts) frameUpdatedAt.set(frame.id, currentFrameUpdatedAt)
    }
  }
  return [...frames.values()].sort((a, b) => a.id.localeCompare(b.id))
}

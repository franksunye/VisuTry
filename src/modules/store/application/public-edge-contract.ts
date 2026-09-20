/**
 * Pure contract shared by the application invalidation path and the
 * Cloudflare traffic-layer classifier. Keep this file free of framework,
 * database, and Worker-runtime imports.
 */

export const STORE_CAMPAIGN_EDGE_LOCALES = ['en'] as const
export const STORE_CAMPAIGN_EDGE_LOCALE = STORE_CAMPAIGN_EDGE_LOCALES[0]
export const STORE_CAMPAIGN_PUBLIC_HTML_CACHE_TTL_SECONDS = 3600
export const STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH = 180
export const STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH = 240

export const STORE_CAMPAIGN_PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export type StoreCampaignEdgeRoute = {
  surface: 'STORE' | 'CAMPAIGN'
  locale: (typeof STORE_CAMPAIGN_EDGE_LOCALES)[number]
  merchantSlug: string
  experienceSlug?: string
}

export function isStoreCampaignPublicSlug(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maxLength
    && STORE_CAMPAIGN_PUBLIC_SLUG_PATTERN.test(value)
}

export function isStoreCampaignMerchantSlug(value: unknown): value is string {
  return isStoreCampaignPublicSlug(value, STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH)
}

export function isStoreCampaignExperienceSlug(value: unknown): value is string {
  return isStoreCampaignPublicSlug(value, STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH)
}

export function storeCampaignEdgeRoute(pathname: string): StoreCampaignEdgeRoute | null {
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] as (typeof STORE_CAMPAIGN_EDGE_LOCALES)[number] | undefined
  if (!locale || !STORE_CAMPAIGN_EDGE_LOCALES.includes(locale)) return null

  if (segments.length === 3 && segments[1] === 'store' && isStoreCampaignMerchantSlug(segments[2])) {
    return { surface: 'STORE', locale, merchantSlug: segments[2] }
  }

  if (
    segments.length === 4
    && segments[1] === 'c'
    && isStoreCampaignMerchantSlug(segments[2])
    && isStoreCampaignExperienceSlug(segments[3])
  ) {
    return { surface: 'CAMPAIGN', locale, merchantSlug: segments[2], experienceSlug: segments[3] }
  }

  return null
}

export function publicStoreEdgePath(merchantSlug: string | null | undefined): string | null {
  return isStoreCampaignMerchantSlug(merchantSlug) ? `/${STORE_CAMPAIGN_EDGE_LOCALE}/store/${merchantSlug}` : null
}

export function publicCampaignEdgePath(
  merchantSlug: string | null | undefined,
  experienceSlug: string | null | undefined,
): string | null {
  return isStoreCampaignMerchantSlug(merchantSlug) && isStoreCampaignExperienceSlug(experienceSlug)
    ? `/${STORE_CAMPAIGN_EDGE_LOCALE}/c/${merchantSlug}/${experienceSlug}`
    : null
}

export function publicStoreEdgeCacheTag(merchantSlug: string | null | undefined): string | null {
  return publicStoreEdgePath(merchantSlug)
    ? `visutry:public-html:store:${STORE_CAMPAIGN_EDGE_LOCALE}:${merchantSlug}`
    : null
}

export function publicCampaignEdgeCacheTag(
  merchantSlug: string | null | undefined,
  experienceSlug: string | null | undefined,
): string | null {
  return publicCampaignEdgePath(merchantSlug, experienceSlug)
    ? `visutry:public-html:campaign:${STORE_CAMPAIGN_EDGE_LOCALE}:${merchantSlug}:${experienceSlug}`
    : null
}

export function publicEdgeCacheTagsForRouteMembership(
  merchantSlug: string,
  membership: { store: boolean; campaigns: readonly string[] } | undefined,
): string[] {
  if (!membership) return []
  return [
    ...(membership.store ? [publicStoreEdgeCacheTag(merchantSlug)] : []),
    ...membership.campaigns.map((campaignSlug) => publicCampaignEdgeCacheTag(merchantSlug, campaignSlug)),
  ].filter((tag): tag is string => Boolean(tag))
}

export function publicEdgePathsForRouteMembership(
  merchantSlug: string,
  membership: { store: boolean; campaigns: readonly string[] } | undefined,
): string[] {
  if (!membership) return []
  return [
    ...(membership.store ? [publicStoreEdgePath(merchantSlug)] : []),
    ...membership.campaigns.map((campaignSlug) => publicCampaignEdgePath(merchantSlug, campaignSlug)),
  ].filter((path): path is string => Boolean(path))
}

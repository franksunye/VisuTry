export {
  STORE_CAMPAIGN_EDGE_LOCALES,
  STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH,
  STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH,
  STORE_CAMPAIGN_PUBLIC_HTML_CACHE_TTL_SECONDS,
  STORE_CAMPAIGN_PUBLIC_SLUG_PATTERN,
  isStoreCampaignExperienceSlug,
  isStoreCampaignMerchantSlug,
  isStoreCampaignPublicSlug,
  publicCampaignEdgeCacheTag,
  publicCampaignEdgePath,
  publicEdgeCacheTagsForRouteMembership,
  publicStoreEdgeCacheTag,
  publicStoreEdgePath,
} from './public-edge-contract'
import { publicEdgePathsForRouteMembership as mapPublicEdgePathsForRouteMembership } from './public-edge-contract'
import { publicEdgeCacheTagsForRouteMembership as mapPublicEdgeCacheTagsForRouteMembership } from './public-edge-contract'

export type PublicEdgeRouteMembership = {
  store: boolean
  campaigns: readonly string[]
}

/**
 * Converts the public admission index into the exact edge objects that can be
 * purged. Keeping this mapping beside the route helpers prevents mutation
 * code from constructing broad prefixes or leaking non-public identifiers.
 */
export function publicEdgePathsForRouteMembership(
  merchantSlug: string,
  membership: PublicEdgeRouteMembership | undefined,
): string[] {
  return mapPublicEdgePathsForRouteMembership(merchantSlug, membership)
}

export function publicEdgeTagsForRouteMembership(
  merchantSlug: string,
  membership: PublicEdgeRouteMembership | undefined,
): string[] {
  return mapPublicEdgeCacheTagsForRouteMembership(merchantSlug, membership)
}

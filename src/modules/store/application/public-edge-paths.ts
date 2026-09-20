export const STORE_CAMPAIGN_EDGE_LOCALES = ['en'] as const

export type PublicEdgeRouteMembership = {
  store: boolean
  campaigns: readonly string[]
}

function safeSegment(value: string | null | undefined): string | null {
  return value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) ? value : null
}

export function publicStoreEdgePath(merchantSlug: string | null | undefined): string | null {
  const merchant = safeSegment(merchantSlug)
  return merchant ? `/en/store/${merchant}` : null
}

export function publicCampaignEdgePath(
  merchantSlug: string | null | undefined,
  experienceSlug: string | null | undefined,
): string | null {
  const merchant = safeSegment(merchantSlug)
  const experience = safeSegment(experienceSlug)
  return merchant && experience ? `/en/c/${merchant}/${experience}` : null
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
  if (!membership) return []
  return [
    ...(membership.store ? [publicStoreEdgePath(merchantSlug)] : []),
    ...membership.campaigns.map((campaignSlug) => publicCampaignEdgePath(merchantSlug, campaignSlug)),
  ].filter((path): path is string => Boolean(path))
}

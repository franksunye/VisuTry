export const PUBLIC_DISCOVERY_CACHE = {
  // Public discovery writes invalidate the affected tags on demand. Keep a
  // long safety TTL so normal shopper traffic does not regenerate catalog
  // data on a short clock when nothing changed.
  storeRevalidateSeconds: 6 * 60 * 60,
  campaignRevalidateSeconds: 60 * 60,
  // Sitemap output is invalidated on successful public discovery mutations.
  // Keep a long safety TTL so crawler reads do not rewrite the full sitemap
  // every 30 minutes when no public catalog changed.
  sitemapRevalidateSeconds: 24 * 60 * 60,
  tags: {
    merchant: (merchantSlug: string) => `public-discovery:merchant:${merchantSlug}`,
    catalog: (merchantSlug: string) => `public-discovery:merchant-catalog:${merchantSlug}`,
    experience: (merchantSlug: string, experienceSlug: string | null) =>
      `public-discovery:experience:${merchantSlug}:${experienceSlug || 'store'}`,
    sitemap: 'public-discovery:sitemap',
    routeAdmission: 'public-discovery:route-admission',
  },
} as const

export function publicDiscoveryCacheTags(
  merchantSlug: string,
  experienceSlug?: string | null,
): string[] {
  return [
    PUBLIC_DISCOVERY_CACHE.tags.merchant(merchantSlug),
    PUBLIC_DISCOVERY_CACHE.tags.catalog(merchantSlug),
    PUBLIC_DISCOVERY_CACHE.tags.experience(merchantSlug, experienceSlug ?? null),
  ]
}

export function publicDiscoveryCacheKey(input: {
  locale: string
  merchantSlug: string
  experienceSlug?: string | null
}): string[] {
  return [
    'public-experience-discovery',
    input.locale,
    input.merchantSlug,
    input.experienceSlug || 'store',
  ]
}

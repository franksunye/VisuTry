export const PUBLIC_DISCOVERY_CACHE = {
  storeRevalidateSeconds: 30 * 60,
  campaignRevalidateSeconds: 5 * 60,
  sitemapRevalidateSeconds: 30 * 60,
  tags: {
    merchant: (merchantSlug: string) => `public-discovery:merchant:${merchantSlug}`,
    catalog: (merchantSlug: string) => `public-discovery:merchant-catalog:${merchantSlug}`,
    experience: (merchantSlug: string, experienceSlug: string | null) =>
      `public-discovery:experience:${merchantSlug}:${experienceSlug || 'store'}`,
    sitemap: 'public-discovery:sitemap',
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

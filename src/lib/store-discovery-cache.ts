export const PUBLIC_DISCOVERY_CACHE = {
  // Public discovery writes invalidate the affected tags on demand. Keep a
  // long safety TTL so normal shopper traffic does not regenerate catalog
  // data on a short clock when nothing changed.
  storeRevalidateSeconds: 7 * 24 * 60 * 60,
  campaignRevalidateSeconds: 7 * 24 * 60 * 60,
  // Sitemap output is invalidated on successful public discovery mutations.
  // Keep a long safety TTL so crawler reads do not rewrite the full sitemap
  // on a short clock when no public catalog changed.
  sitemapRevalidateSeconds: 7 * 24 * 60 * 60,
  tags: {
    merchant: (merchantSlug: string) => `public-discovery:merchant:${merchantSlug}`,
    catalog: (merchantSlug: string) => `public-discovery:merchant-catalog:${merchantSlug}`,
    experience: (merchantSlug: string, experienceSlug: string | null) =>
      `public-discovery:experience:${merchantSlug}:${experienceSlug || 'store'}`,
    sitemap: 'public-discovery:sitemap',
    routeAdmission: 'public-discovery:route-admission',
  },
} as const

/**
 * Public Store discovery is persisted in the platform cache, so its keys
 * must not be shared by Local, Preview, and Production. The database
 * identity is deliberately non-secret and gives separate Preview branches
 * their own namespace without embedding a connection string.
 */
export function publicDiscoveryCacheNamespace(
  env: Record<string, string | undefined> = process.env,
): string {
  const appEnvironment = env.APP_ENV?.trim().toLowerCase()
    || env.VERCEL_ENV?.trim().toLowerCase()
    || 'unknown'
  const databaseIdentity = env.VISUTRY_DATABASE_IDENTITY?.trim()
  return databaseIdentity
    ? `public-discovery:${appEnvironment}:${databaseIdentity}`
    : `public-discovery:${appEnvironment}`
}

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
    publicDiscoveryCacheNamespace(),
    // Bump when a scoped production provisioning write happens outside the
    // application invalidation boundary; this prevents an old ISR read model
    // from masking the now-authoritative PUBLIC_INDEX state.
    'public-experience-discovery-v2',
    input.locale,
    input.merchantSlug,
    input.experienceSlug || 'store',
  ]
}

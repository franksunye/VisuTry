import { revalidatePath, revalidateTag } from 'next/cache'
import { PUBLIC_DISCOVERY_CACHE } from '@/lib/store-discovery-cache'
import { locales } from '@/i18n'
import { purgePublicHtmlUrls } from '@/lib/cloudflare-public-html-purge'
import { publicCampaignEdgePath, publicStoreEdgePath } from './public-edge-paths'

export type PublicDiscoveryMutationTarget =
  | { kind: 'merchant'; merchantSlug: string }
  | { kind: 'catalog'; merchantSlug: string }
  | { kind: 'experience'; merchantSlug: string; experienceSlug: string | null }

type InvalidationDecision<T> = boolean | ((result: T) => boolean)

type EdgePaths<T> = {
  before?: readonly string[]
  after?: readonly string[] | ((result: T) => readonly string[] | Promise<readonly string[]>)
}

/**
 * The single application boundary for public Store/Campaign discovery writes.
 * The mutation runs first; tags are derived here and are never part of the
 * caller's input. A rejected mutation cannot invalidate a public read model.
 */
export async function withPublicDiscoveryInvalidation<T>(input: {
  target: PublicDiscoveryMutationTarget
  mutation: () => Promise<T>
  invalidate?: InvalidationDecision<T>
  edgePaths?: EdgePaths<T>
}): Promise<T> {
  const result = await input.mutation()
  const shouldInvalidate = typeof input.invalidate === 'function'
    ? input.invalidate(result)
    : input.invalidate ?? true
  if (!shouldInvalidate) return result

  const tags = new Set<string>([
    PUBLIC_DISCOVERY_CACHE.tags.merchant(input.target.merchantSlug),
    PUBLIC_DISCOVERY_CACHE.tags.sitemap,
    PUBLIC_DISCOVERY_CACHE.tags.routeAdmission,
  ])
  if (input.target.kind === 'catalog') {
    tags.add(PUBLIC_DISCOVERY_CACHE.tags.catalog(input.target.merchantSlug))
  }
  if (input.target.kind === 'experience') {
    tags.add(PUBLIC_DISCOVERY_CACHE.tags.experience(input.target.merchantSlug, input.target.experienceSlug))
  }
  tags.forEach((tag) => revalidateTag(tag))

  // The discovery read model is tagged, but the public page itself is an ISR
  // artifact. Revalidating only the data tags can leave an already-rendered
  // Store page in the Vercel route cache until its long safety TTL expires.
  // Invalidate the concrete localized Store routes after every successful
  // merchant/catalog/Store mutation so the next anonymous request renders the
  // same data as the public API.
  for (const locale of locales) {
    revalidatePath(`/${locale}/store/${input.target.merchantSlug}`)
  }

  if (input.target.kind === 'experience' && input.target.experienceSlug) {
    for (const locale of locales) {
      revalidatePath(`/${locale}/c/${input.target.merchantSlug}/${input.target.experienceSlug}`)
    }
  } else if (input.target.kind !== 'experience') {
    // Merchant and catalog writes can affect any public campaign belonging to
    // this merchant. Use the dynamic route pattern because campaign slugs are
    // not part of the mutation boundary.
    revalidatePath('/[locale]/c/[merchantSlug]/[experienceSlug]', 'page')
  }

  // The dynamic sitemap is a route-level ISR artifact in addition to its
  // tagged merchant read model. Revalidate it only after a successful write.
  revalidatePath('/sitemaps/dynamic.xml')

  const defaultPath = input.target.kind === 'experience'
    ? input.target.experienceSlug
      ? publicCampaignEdgePath(input.target.merchantSlug, input.target.experienceSlug)
      : publicStoreEdgePath(input.target.merchantSlug)
    : publicStoreEdgePath(input.target.merchantSlug)
  const resultSlug = input.target.kind === 'experience'
    && result !== null
    && typeof result === 'object'
    && 'slug' in result
    && typeof result.slug === 'string'
    ? result.slug
    : null
  const resultPath = input.target.kind === 'experience' && resultSlug
    ? publicCampaignEdgePath(input.target.merchantSlug, resultSlug)
    : null
  const after = typeof input.edgePaths?.after === 'function'
    ? await input.edgePaths.after(result)
    : input.edgePaths?.after ?? []
  const edgePaths = [
    ...(input.edgePaths?.before ?? []),
    ...(defaultPath ? [defaultPath] : []),
    ...(resultPath ? [resultPath] : []),
    ...after,
  ]
  // This is intentionally after the database mutation and Next invalidation.
  // A Cloudflare outage is observable but cannot turn a committed write into a
  // false rollback.
  await purgePublicHtmlUrls([...new Set(edgePaths)])
  return result
}

import { revalidatePath, revalidateTag } from 'next/cache'
import { PUBLIC_DISCOVERY_CACHE } from '@/lib/store-discovery-cache'

export type PublicDiscoveryMutationTarget =
  | { kind: 'merchant'; merchantSlug: string }
  | { kind: 'catalog'; merchantSlug: string }
  | { kind: 'experience'; merchantSlug: string; experienceSlug: string | null }

type InvalidationDecision<T> = boolean | ((result: T) => boolean)

/**
 * The single application boundary for public Store/Campaign discovery writes.
 * The mutation runs first; tags are derived here and are never part of the
 * caller's input. A rejected mutation cannot invalidate a public read model.
 */
export async function withPublicDiscoveryInvalidation<T>(input: {
  target: PublicDiscoveryMutationTarget
  mutation: () => Promise<T>
  invalidate?: InvalidationDecision<T>
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
  // The sitemap is a route-level ISR artifact in addition to its tagged
  // merchant read model. Revalidate it only after a successful public write.
  revalidatePath('/sitemap.xml')
  return result
}

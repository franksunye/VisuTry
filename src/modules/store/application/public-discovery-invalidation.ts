import { revalidatePath, revalidateTag } from 'next/cache'
import { PUBLIC_DISCOVERY_CACHE } from '@/lib/store-discovery-cache'
import { locales } from '@/i18n'
import { purgePublicHtmlTags } from '@/lib/cloudflare-public-html-purge'
import { publicCampaignEdgeCacheTag, publicStoreEdgeCacheTag } from './public-edge-contract'

export type PublicDiscoveryMutationTarget =
  | { kind: 'merchant'; merchantSlug: string }
  | { kind: 'catalog'; merchantSlug: string }
  | { kind: 'experience'; merchantSlug: string; experienceSlug: string | null }

export type PublicDiscoveryInvalidationTarget = PublicDiscoveryMutationTarget
  | { kind: 'store'; merchantSlug: string }

export type PublicDiscoveryInvalidationResult = {
  merchantSlug: string
  scope: 'MERCHANT' | 'CATALOG' | 'CAMPAIGN' | 'STORE'
  experienceSlug?: string
  tags: string[]
  paths: string[]
  publicHtmlPurge: {
    attempted: boolean
    success: boolean
    tagCount?: number
    failedBatchCount?: number
  }
}

type InvalidationDecision<T> = boolean | ((result: T) => boolean)

type EdgeTags<T> = {
  before?: readonly string[]
  after?: readonly string[] | ((result: T) => readonly string[] | Promise<readonly string[]>)
}

type InvalidationPlan = {
  tags: string[]
  paths: string[]
  edgeTags: string[]
}

function buildInvalidationPlan<T>(input: {
  target: PublicDiscoveryInvalidationTarget
  result?: T
  edgeTags?: EdgeTags<T>
}): InvalidationPlan {
  const { target } = input
  const tags = new Set<string>([
    PUBLIC_DISCOVERY_CACHE.tags.merchant(target.merchantSlug),
    PUBLIC_DISCOVERY_CACHE.tags.sitemap,
    PUBLIC_DISCOVERY_CACHE.tags.routeAdmission,
  ])
  if (target.kind === 'catalog' || target.kind === 'store') {
    tags.add(PUBLIC_DISCOVERY_CACHE.tags.catalog(target.merchantSlug))
  }
  if (target.kind === 'experience') {
    tags.add(PUBLIC_DISCOVERY_CACHE.tags.experience(target.merchantSlug, target.experienceSlug))
  }
  if (target.kind === 'store') {
    tags.add(PUBLIC_DISCOVERY_CACHE.tags.experience(target.merchantSlug, null))
  }

  const paths = new Set<string>()
  for (const locale of locales) {
    paths.add(`/${locale}/store/${target.merchantSlug}`)
    paths.add(`/${locale}/store/${target.merchantSlug}/kiosk`)
  }

  if (target.kind === 'experience' && target.experienceSlug) {
    for (const locale of locales) {
      paths.add(`/${locale}/c/${target.merchantSlug}/${target.experienceSlug}`)
      paths.add(`/${locale}/c/${target.merchantSlug}/${target.experienceSlug}/kiosk`)
    }
  } else if (target.kind !== 'experience') {
    paths.add('/[locale]/c/[merchantSlug]/[experienceSlug]')
    paths.add('/[locale]/c/[merchantSlug]/[experienceSlug]/kiosk')
  }
  paths.add('/sitemaps/dynamic.xml')

  const result = input.result
  const defaultTag = target.kind === 'experience' && target.experienceSlug
    ? publicCampaignEdgeCacheTag(target.merchantSlug, target.experienceSlug)
    : publicStoreEdgeCacheTag(target.merchantSlug)
  const resultSlug = target.kind === 'experience'
    && result !== null
    && typeof result === 'object'
    && 'slug' in result
    && typeof result.slug === 'string'
    ? result.slug
    : null
  const resultTag = target.kind === 'experience' && target.experienceSlug && resultSlug
    ? publicCampaignEdgeCacheTag(target.merchantSlug, resultSlug)
    : null

  return {
    tags: [...tags],
    paths: [...paths],
    edgeTags: [...new Set([
      ...(input.edgeTags?.before ?? []),
      ...(defaultTag ? [defaultTag] : []),
      ...(resultTag ? [resultTag] : []),
      ...(typeof input.edgeTags?.after === 'function' ? [] : input.edgeTags?.after ?? []),
    ])],
  }
}

async function resolveAfterEdgeTags<T>(edgeTags: EdgeTags<T> | undefined, result: T | undefined) {
  return typeof edgeTags?.after === 'function'
    ? edgeTags.after(result as T)
    : edgeTags?.after ?? []
}

/**
 * Revalidates the canonical public Store/Campaign discovery cache boundaries
 * without performing a business mutation. Callers must supply a bounded,
 * already-validated target; user-facing routes validate slugs before calling.
 */
export async function invalidatePublicDiscovery<T = unknown>(input: {
  target: PublicDiscoveryInvalidationTarget
  result?: T
  edgeTags?: EdgeTags<T>
}): Promise<PublicDiscoveryInvalidationResult> {
  const plan = buildInvalidationPlan(input)
  const afterTags = await resolveAfterEdgeTags(input.edgeTags, input.result)
  const edgeTags = [...new Set([
    ...plan.edgeTags,
    ...afterTags,
  ])]

  plan.tags.forEach((tag) => revalidateTag(tag))
  plan.paths.forEach((path) => {
    if (path.startsWith('/[')) revalidatePath(path, 'page')
    else revalidatePath(path)
  })

  const publicHtmlPurgeResult = await purgePublicHtmlTags(edgeTags)
  const scope = input.target.kind === 'store'
    ? 'STORE'
    : input.target.kind === 'experience'
      ? 'CAMPAIGN'
      : input.target.kind === 'merchant'
        ? 'MERCHANT'
        : 'CATALOG'
  return {
    merchantSlug: input.target.merchantSlug,
    scope,
    ...(input.target.kind === 'experience' && input.target.experienceSlug
      ? { experienceSlug: input.target.experienceSlug }
      : {}),
    tags: plan.tags,
    paths: plan.paths,
    publicHtmlPurge: {
      attempted: publicHtmlPurgeResult.attempted,
      success: publicHtmlPurgeResult.success,
      ...(publicHtmlPurgeResult.tagCount !== undefined ? { tagCount: publicHtmlPurgeResult.tagCount } : {}),
      ...(publicHtmlPurgeResult.failedBatchCount !== undefined
        ? { failedBatchCount: publicHtmlPurgeResult.failedBatchCount }
        : {}),
    },
  }
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
  edgeTags?: EdgeTags<T>
}): Promise<T> {
  const result = await input.mutation()
  const shouldInvalidate = typeof input.invalidate === 'function'
    ? input.invalidate(result)
    : input.invalidate ?? true
  if (!shouldInvalidate) return result
  await invalidatePublicDiscovery({
    target: input.target,
    result,
    edgeTags: input.edgeTags,
  })
  return result
}

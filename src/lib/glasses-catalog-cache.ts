import { revalidateTag, unstable_cache } from 'next/cache'
import { logger } from '@/lib/logger'

/**
 * Public eyewear reference-data cache (GlassesFrame + recommendation mappings).
 *
 * Layer: Next.js Data Cache (`unstable_cache`), not CDN headers.
 * TTL: 3600s. Tag invalidation after successful catalog mutations.
 *
 * Keys:
 * - glasses-catalog-active-frames
 * - glasses-catalog-active-brands
 * - glasses-catalog-frame:{id}
 * - glasses-catalog-frames-by-brand:{brand}
 * - glasses-catalog-frames-by-category:{category}
 * - glasses-catalog-frame-ids
 * - glasses-catalog-categories
 * - glasses-catalog-face-shapes
 * - glasses-catalog-category-by-name:{name}
 *
 * Tag: glasses-catalog
 */
export const GLASSES_CATALOG_TAG = 'glasses-catalog'
export const GLASSES_CATALOG_REVALIDATE_SECONDS = 3600

export const GLASSES_CATALOG_CACHE_KEYS = {
  activeFrames: 'glasses-catalog-active-frames',
  activeBrands: 'glasses-catalog-active-brands',
  frameById: (id: string) => `glasses-catalog-frame:${id}`,
  framesByBrand: (brand: string) => `glasses-catalog-frames-by-brand:${brand.toLowerCase()}`,
  framesByCategory: (category: string) => `glasses-catalog-frames-by-category:${category.toLowerCase()}`,
  frameIds: 'glasses-catalog-frame-ids',
  categories: 'glasses-catalog-categories',
  faceShapes: 'glasses-catalog-face-shapes',
  categoryByName: (name: string) => `glasses-catalog-category-by-name:${name.toLowerCase()}`,
} as const

const inflight = new Map<string, Promise<unknown>>()
let originLoadCount = 0

function shouldTrackOriginLoads(): boolean {
  return process.env.NODE_ENV !== 'production'
}

function recordOriginLoad(key: string): void {
  if (!shouldTrackOriginLoads()) return
  originLoadCount += 1
  logger.debug('database', 'glasses catalog origin load', { key, originLoadCount })
}

export function getGlassesCatalogOriginLoadCount(): number {
  return originLoadCount
}

export function resetGlassesCatalogOriginLoadCount(): void {
  originLoadCount = 0
}

function dedupeInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const pending = run().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, pending)
  return pending
}

export function cacheGlassesCatalogRead<T>(key: string, loader: () => Promise<T>): Promise<T> {
  return dedupeInFlight(key, () =>
    unstable_cache(
      async () => {
        recordOriginLoad(key)
        return loader()
      },
      [key],
      {
        revalidate: GLASSES_CATALOG_REVALIDATE_SECONDS,
        tags: [GLASSES_CATALOG_TAG],
      },
    )(),
  )
}

export function revalidateGlassesCatalog(): void {
  revalidateTag(GLASSES_CATALOG_TAG)
}

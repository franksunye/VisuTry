import { isOwnedBlobReference } from './blob-reference'

/**
 * Per-field Blob deletion targets for TryOnTask retention (pure).
 * Shared by Consumer and Store cleanup — must stay Store-neutral.
 */

export function isDeletableBlobRef(value: string | null | undefined): value is string {
  return isOwnedBlobReference(value, 'tryon/')
}

/**
 * Prefer an owned Blob URL so a historical public object cannot accidentally
 * be sent to today's private store. Pathname-only legacy records fall back
 * to the configured store. Never delete provider URLs or Face Analysis media.
 */
export function collectTryOnRetentionDeleteTargets(input: {
  userImageUrl: string
  itemImageUrl: string
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
  metadata?: Record<string, unknown> | null
}): string[] {
  const meta = input.metadata ?? {}
  const picks = (
    [
      [input.userImageUrl, meta.userPathname],
      [input.itemImageUrl, meta.itemPathname],
      [input.glassesImageUrl, meta.glassesPathname],
      [input.resultImageUrl, meta.resultPathname],
    ] as const
  ).map(([url, pathname]) =>
    isDeletableBlobRef(url) ? url : (typeof pathname === 'string' ? pathname : url),
  )

  const unique: string[] = []
  const seen = new Set<string>()
  for (const pick of picks) {
    if (!isDeletableBlobRef(pick)) continue
    if (seen.has(pick)) continue
    seen.add(pick)
    unique.push(pick)
  }
  return unique
}

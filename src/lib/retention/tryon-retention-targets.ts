/**
 * Per-field Blob deletion targets for TryOnTask retention (pure).
 * Shared by Consumer and Store cleanup — must stay Store-neutral.
 */

export function isDeletableBlobRef(value: string | null | undefined): value is string {
  if (!value) return false
  if (value.startsWith('pending:')) return false
  // Storage pathnames are owned by this Blob store. Absolute URLs are only
  // deletable when they are Vercel Blob URLs; provider/CDN URLs are not ours.
  if (!value.includes('://')) return value.startsWith('tryon/')
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'blob.vercel-storage.com' || hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

/**
 * Prefer pathname per asset field; fall back to URL. Never discard URLs
 * merely because some other field already has a pathname.
 */
export function collectTryOnRetentionDeleteTargets(input: {
  userImageUrl: string
  itemImageUrl: string
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
  metadata?: Record<string, unknown> | null
}): string[] {
  const meta = input.metadata ?? {}
  const picks = [
    (typeof meta.userPathname === 'string' ? meta.userPathname : null) ?? input.userImageUrl,
    (typeof meta.itemPathname === 'string' ? meta.itemPathname : null) ?? input.itemImageUrl,
    (typeof meta.glassesPathname === 'string' ? meta.glassesPathname : null) ??
      input.glassesImageUrl,
    (typeof meta.resultPathname === 'string' ? meta.resultPathname : null) ??
      input.resultImageUrl,
  ]

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

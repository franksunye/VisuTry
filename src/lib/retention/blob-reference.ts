/** Pure Blob ownership check; safe to use in Store and Consumer domain code. */
export function isOwnedBlobReference(reference: string | null | undefined, prefix: 'tryon/' | 'face-analysis/'): reference is string {
  if (!reference || reference.startsWith('pending:')) return false
  if (!reference.includes('://')) return reference.startsWith(prefix)
  try {
    const url = new URL(reference)
    return url.protocol === 'https:'
      && url.pathname.slice(1).startsWith(prefix)
      && /^[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com$/.test(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Local media servers are loopback-only and cannot be fetched by Next's image
 * optimizer. Keep those assets direct while preserving optimization for all
 * non-loopback image URLs.
 */
export function isLoopbackImageUrl(value: string | null | undefined): boolean {
  if (!value) return false

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    return url.protocol === 'http:'
      && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')
  } catch {
    return false
  }
}

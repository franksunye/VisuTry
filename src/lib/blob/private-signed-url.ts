import { issueSignedToken, presignUrl } from '@vercel/blob'

export const PRIVATE_BLOB_SIGNED_URL_TTL_MS = 120 * 1000

/**
 * Issue a single-object, GET-only private Blob URL after application-level
 * authorization has already succeeded. The Blob grant is intentionally not
 * cached or widened to a pathname wildcard.
 */
export async function createPrivateBlobGetUrl(input: {
  pathname: string
  businessExpiresAt?: Date | null
  now?: number
}): Promise<{ url: string; validUntil: number }> {
  const pathname = input.pathname.trim()
  if (!pathname || pathname.includes('*') || pathname.startsWith('/')) {
    throw new Error('Private Blob grants require one exact relative pathname')
  }

  const now = input.now ?? Date.now()
  const businessExpiry = input.businessExpiresAt?.getTime() ?? Number.POSITIVE_INFINITY
  const validUntil = Math.min(now + PRIVATE_BLOB_SIGNED_URL_TTL_MS, businessExpiry)
  if (!Number.isFinite(validUntil) || validUntil <= now) {
    throw new Error('Private Blob grant has expired')
  }

  const token = await issueSignedToken({
    pathname,
    operations: ['get'],
    validUntil,
  })
  const { presignedUrl } = await presignUrl(token, {
    access: 'private',
    operation: 'get',
    pathname,
    validUntil,
  })

  return { url: presignedUrl, validUntil }
}

export function pathnameFromPrivateBlobUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (!url.hostname.endsWith('.private.blob.vercel-storage.com')) return null
    const pathname = decodeURIComponent(url.pathname.replace(/^\//, ''))
    return pathname && !pathname.includes('*') ? pathname : null
  } catch {
    return null
  }
}

export function privateBlobRedirect(url: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: url,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

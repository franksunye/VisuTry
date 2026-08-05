const DEFAULT_PUBLIC_APP_URL = 'https://www.visutry.com'

export function resolveFetchableImageUrl(
  url: string,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    DEFAULT_PUBLIC_APP_URL,
): string {
  const value = url.trim()
  if (!value) throw new Error('Image URL is required')

  const resolved = value.startsWith('/') ? new URL(value, baseUrl) : new URL(value)
  if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') {
    throw new Error('Image URL must use HTTP(S)')
  }
  return resolved.toString()
}

/**
 * Fetch application-local or remote image bytes into a File for generation inputs.
 */

export async function fetchImageAsFile(
  url: string,
  filename: string,
): Promise<File> {
  const response = await fetch(resolveFetchableImageUrl(url))
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`)
  }
  const blob = await response.blob()
  const type = blob.type || 'image/jpeg'
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const safeName = filename.includes('.') ? filename : `${filename}.${extension}`
  return new File([blob], safeName, { type })
}

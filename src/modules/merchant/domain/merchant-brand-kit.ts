/** G1-C Brand Kit: one bounded palette and immutable tenant-owned media URLs. */
export const MERCHANT_BRAND_PALETTE = [
  { name: 'Deep teal', hex: '#1F4B5A' },
  { name: 'Cobalt', hex: '#1D4ED8' },
  { name: 'Violet', hex: '#6D28D9' },
  { name: 'Forest', hex: '#166534' },
  { name: 'Terracotta', hex: '#9A3412' },
  { name: 'Slate', hex: '#334155' },
] as const
export const DEFAULT_MERCHANT_ACCENT = '#1F4B5A'

export class BrandKitError extends Error {
  constructor(readonly code: 'INVALID_BRAND_COLOR' | 'INVALID_BRAND_MEDIA' | 'INVALID_BRAND_UPLOAD' | 'LIVE_CHANGE_CONFIRMATION_REQUIRED' | 'EXPERIENCE_NOT_FOUND', message: string, readonly httpStatus = 400) {
    super(message)
    this.name = 'BrandKitError'
  }
}
export function normalizeBrandAccent(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new BrandKitError('INVALID_BRAND_COLOR', 'Choose one of the supported accessible colors.')
  const match = MERCHANT_BRAND_PALETTE.find(({ hex }) => hex.toLowerCase() === value.trim().toLowerCase())
  if (!match) throw new BrandKitError('INVALID_BRAND_COLOR', 'Choose one of the supported accessible colors.')
  return match.hex
}
export function brandAccentForDisplay(value: string | null | undefined): string {
  const allowed = MERCHANT_BRAND_PALETTE.find(({ hex }) => hex.toLowerCase() === value?.toLowerCase())
  return allowed?.hex ?? DEFAULT_MERCHANT_ACCENT
}

/**
 * A Brand Kit write may only reference bytes previously uploaded into this
 * merchant's own versioned Blob key. No remote HTTP request or redirects.
 */
export function brandMediaPath(merchantId: string, kind: 'logo' | 'hero', experienceId?: string): string {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(merchantId) || (kind === 'hero' && !/^[a-zA-Z0-9_-]{1,120}$/.test(experienceId ?? ''))) {
    throw new BrandKitError('INVALID_BRAND_MEDIA', 'Invalid media owner.')
  }
  return `merchant-brand/${merchantId}/${kind === 'logo' ? 'logo' : `hero/${experienceId}`}/`
}
export function normalizeBrandMediaUrl(value: unknown, merchantId: string, kind: 'logo' | 'hero', experienceId?: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || value.length > 2048 || value.trim() !== value) throw new BrandKitError('INVALID_BRAND_MEDIA', 'Upload an approved image to use for branding.')
  const expectedPath = '/' + brandMediaPath(merchantId, kind, experienceId)
  let parsed: URL
  try { parsed = new URL(value) } catch { throw new BrandKitError('INVALID_BRAND_MEDIA', 'Upload an approved image to use for branding.') }
  if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash
    || !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname)
    || !parsed.pathname.startsWith(expectedPath)
    || !/^[a-zA-Z0-9_-]+\.webp$/.test(parsed.pathname.slice(expectedPath.length))) {
    throw new BrandKitError('INVALID_BRAND_MEDIA', 'The image must be a verified upload for this merchant.')
  }
  return parsed.toString()
}

/** Reject remote media, animated WebP and non-image polyglots before public upload. */
export function inspectBrandImage(bytes: Uint8Array, claimedMime: string, kind: 'logo' | 'hero'): { mime: string; width: number; height: number } {
  const invalid = () => { throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Use a valid PNG, JPEG or non-animated WebP image within the limits.') }
  if (bytes.length < 30 || bytes.length > 4 * 1024 * 1024) return invalid()
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (offset: number, count: number) => Array.from(bytes.slice(offset, offset + count)).map(c => String.fromCharCode(c)).join('')
  let mime = '', width = 0, height = 0
  if (v.getUint32(0) === 0x89504e47 && v.getUint32(4) === 0x0d0a1a0a && ascii(12, 4) === 'IHDR') {
    mime = 'image/png'; width = v.getUint32(16); height = v.getUint32(20)
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    mime = 'image/jpeg'
    let i = 2
    while (i < bytes.length - 9) {
      if (bytes[i] !== 0xff) return invalid()
      while (bytes[i] === 0xff) i++
      const marker = bytes[i++]
      if (marker === 0xd9 || marker === 0xda) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (i + 2 > bytes.length) break
      const size = v.getUint16(i)
      if (size < 2 || i + size > bytes.length) return invalid()
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        height = v.getUint16(i + 3); width = v.getUint16(i + 5); break
      }
      i += size
    }
  } else if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    mime = 'image/webp'
    const chunk = ascii(12, 4)
    if (chunk === 'VP8X') {
      if (bytes[20] & 0x02) return invalid() // animated WebP
      width = 1 + (bytes[24] | bytes[25] << 8 | bytes[26] << 16)
      height = 1 + (bytes[27] | bytes[28] << 8 | bytes[29] << 16)
    } else if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      width = 1 + (bytes[21] | (bytes[22] & 0x3f) << 8)
      height = 1 + ((bytes[22] >> 6) | bytes[23] << 2 | (bytes[24] & 0xf) << 10)
    } else if (chunk === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = v.getUint16(26, true) & 0x3fff; height = v.getUint16(28, true) & 0x3fff
    }
  } else return invalid()
  if (mime !== claimedMime || width < 64 || height < 64 || width > 4096 || height > 4096 || width * height > 12_000_000) return invalid()
  const ratio = width / height
  if (kind === 'logo' && (ratio < 0.25 || ratio > 5)) return invalid()
  if (kind === 'hero' && (ratio < 1.25 || ratio > 3.5 || width < 640)) return invalid()
  return { mime, width, height }
}

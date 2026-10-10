/** Tenant-owned Catalog product media, separate from Logo and Hero media. */
export const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024
export const PRODUCT_IMAGE_MAX_DAILY_UPLOADS = 100

export class MerchantCatalogMediaError extends Error {
  constructor(
    readonly code: 'INVALID_PRODUCT_IMAGE' | 'PRODUCT_MEDIA_LIMIT' | 'PRODUCT_MEDIA_OWNER',
    message: string,
    readonly httpStatus = 400,
  ) { super(message); this.name = 'MerchantCatalogMediaError' }
}

export function catalogProductMediaPrefix(merchantId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(merchantId)) {
    throw new MerchantCatalogMediaError('PRODUCT_MEDIA_OWNER', 'Invalid merchant identity.')
  }
  return 'merchant-catalog/' + merchantId + '/product/'
}

/** Only an immutable tenant-bound Vercel Blob URL passes. */
export function parseCatalogProductMediaUrl(value: unknown): { merchantId: string; url: string } | null {
  if (typeof value !== 'string' || value.length > 2048 || value.trim() !== value) return null
  try {
    const url = new URL(value)
    const match = /^\/merchant-catalog\/([a-zA-Z0-9_-]{1,120})\/product\/[a-f0-9]{32}\.(png|jpg|webp)$/.exec(url.pathname)
    if (url.protocol !== 'https:' || url.port || url.search || url.hash || url.username || url.password
      || !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) || !match) return null
    return { merchantId: match[1], url: url.toString() }
  } catch { return null }
}

export function requireOwnedCatalogProductMediaUrl(value: unknown, merchantId: string): string {
  const parsed = parseCatalogProductMediaUrl(value)
  if (!parsed || parsed.merchantId !== merchantId) {
    throw new MerchantCatalogMediaError('PRODUCT_MEDIA_OWNER', 'Product image does not belong to this merchant.')
  }
  return parsed.url
}

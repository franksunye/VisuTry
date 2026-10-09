/**
 * A Local-only bypass for prepared-demo media. Never allow a merchant-supplied
 * address to direct a Production visitor or the Next image optimizer to an
 * internal service (including numeric/IP aliases of localhost).
 */
const localMediaRuntime = process.env.NODE_ENV !== 'production'

function reservedImageHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true
  if (host.includes(':')) return true // Literal IPv6 is not an approved remote image host.
  const octets = host.split('.')
  if (octets.length === 4 && octets.every((part) => /^\d+$/.test(part))) {
    const numbers = octets.map(Number)
    if (numbers.some((n) => n < 0 || n > 255)) return true
    const [a, b] = numbers
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || b === 0))
      || (a === 198 && (b === 18 || b === 19))
  }
  return false
}

export function isLoopbackImageUrl(value: string | null | undefined): boolean {
  if (!value || !localMediaRuntime) return false
  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    return url.protocol === 'http:'
      && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')
  } catch {
    return false
  }
}

/** Fail closed for merchant-controlled media on every public shopper surface. */
export function publicMerchantImageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value
  try {
    const url = new URL(value)
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null
    if (reservedImageHost(url.hostname) && !isLoopbackImageUrl(value)) return null
    return value
  } catch {
    return null
  }
}

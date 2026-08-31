const MERCHANT_SLUG_MAX_LENGTH = 180
const READABLE_SLUG_ATTEMPTS = 5

function newSlugToken(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid.replace(/[^a-z0-9]/giu, '').toLowerCase().slice(-12)
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(-12)
}

/** Keep early candidates readable, then use a unique-friendly bounded suffix. */
export function merchantSlugForAttempt(baseSlug: string, attempt: number): string {
  if (attempt < READABLE_SLUG_ATTEMPTS) {
    return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
  }

  const suffix = newSlugToken()
  const prefixLength = Math.max(1, MERCHANT_SLUG_MAX_LENGTH - suffix.length - 1)
  return `${baseSlug.slice(0, prefixLength).replace(/-+$/u, '')}-${suffix}`
}

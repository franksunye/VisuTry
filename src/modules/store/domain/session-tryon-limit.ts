export type SessionTryOnLimit = 1 | 2 | 4
export const SESSION_TRYON_CHOICES: readonly SessionTryOnLimit[] = [1, 2, 4]
export const DEFAULT_SESSION_TRYON_LIMIT: SessionTryOnLimit = 2

export function isSessionTryOnLimit(value: unknown): value is SessionTryOnLimit {
  return value === 1 || value === 2 || value === 4
}

export function resolveSessionTryOnLimit(saved: number | null | undefined): SessionTryOnLimit {
  if (saved == null) return DEFAULT_SESSION_TRYON_LIMIT
  if (!isSessionTryOnLimit(saved)) throw new Error('Invalid persisted session Try-On limit')
  return saved
}

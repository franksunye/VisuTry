export type TryOnBlobAccessMode = 'public' | 'private'

export const TRY_ON_BLOB_DELETE_TOKEN_ENV = 'RPIVATE_BLOB_READ_WRITE_TOKEN'

export function resolveTryOnBlobAccessMode(
  configured = process.env.TRY_ON_BLOB_ACCESS_MODE ?? process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE,
): TryOnBlobAccessMode {
  const normalized = configured?.trim().toLowerCase()
  if (!normalized || normalized === 'public') return 'public'
  if (normalized === 'private') return 'private'
  throw new Error('TRY_ON_BLOB_ACCESS_MODE must be "public" or "private"')
}

export function getTryOnBlobStoreId(
  configured = process.env.TRY_ON_BLOB_STORE_ID ?? process.env.FACE_ANALYSIS_BLOB_STORE_ID,
): string {
  const storeId = configured?.trim()
  if (!storeId) {
    throw new Error('TRY_ON_BLOB_STORE_ID is required when Try-On Blob access is private')
  }
  return storeId
}

/**
 * The connected private Blob store uses its project-scoped read-write token.
 * Retention cleanup must pass it explicitly because @vercel/blob otherwise
 * falls back to BLOB_READ_WRITE_TOKEN, which may belong to another store.
 */
export function getTryOnBlobDeleteToken(): string {
  const token = process.env[TRY_ON_BLOB_DELETE_TOKEN_ENV]?.trim()
  if (!token) {
    throw new Error(
      `${TRY_ON_BLOB_DELETE_TOKEN_ENV} is required for Try-On Blob retention cleanup`,
    )
  }
  return token
}

export function getTryOnSourceBlobOptions():
  | { access: 'public' }
  | { access: 'private'; storeId: string } {
  if (resolveTryOnBlobAccessMode() === 'private') {
    return {
      access: 'private',
      storeId: getTryOnBlobStoreId(),
    }
  }
  return { access: 'public' }
}

/**
 * Consumer result media follows the same storage boundary as source media.
 * Public sharing is provided separately by an application-owned result-only
 * capability, so storage visibility never needs to be widened for Share.
 */
export function getTryOnResultBlobOptions():
  | { access: 'public' }
  | { access: 'private'; storeId: string } {
  return getTryOnSourceBlobOptions()
}

export type TryOnBlobAccessMode = 'public' | 'private'

export type TryOnPrivateBlobReadOptions =
  | { access: 'private'; token: string }
  | { access: 'private'; storeId: string }

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

export function getTryOnPrivateBlobReadOptions(
  configuredToken =
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN ??
    process.env.FACE_ANALYSIS_BLOB_READ_WRITE_TOKEN ??
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN,
): TryOnPrivateBlobReadOptions {
  const token = configuredToken?.trim()
  if (token) return { access: 'private', token }

  // Keep OIDC/store binding as the compatibility path when a dedicated
  // private-store token has not been configured. RPIVATE_* above is the
  // existing production integration prefix and is intentionally read-only
  // compatibility; new environments should use TRY_ON_BLOB_READ_WRITE_TOKEN.
  return { access: 'private', storeId: getTryOnBlobStoreId() }
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

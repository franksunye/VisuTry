export type TryOnBlobAccessMode = 'public' | 'private'

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

export type TryOnBlobAccessMode = 'public' | 'private'

export function resolveTryOnBlobAccessMode(
  configured = process.env.TRY_ON_BLOB_ACCESS_MODE ?? process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE,
): TryOnBlobAccessMode {
  return configured?.trim().toLowerCase() === 'private' ? 'private' : 'public'
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

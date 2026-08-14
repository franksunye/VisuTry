export const FACE_ANALYSIS_BLOB_ACCESS_MODE_ENV = 'FACE_ANALYSIS_BLOB_ACCESS_MODE'
export const FACE_ANALYSIS_BLOB_STORE_ID_ENV = 'FACE_ANALYSIS_BLOB_STORE_ID'

export type FaceAnalysisBlobAccessMode = 'public' | 'private'

export type FaceAnalysisBlobOptions =
  | { access: 'public' }
  | { access: 'private'; storeId: string }

/**
 * The current production Blob store is public, so public is the safe
 * compatibility default. Private mode must only be enabled after the Blob
 * store itself has been configured for private access.
 */
export function resolveFaceAnalysisBlobAccessMode(
  configuredMode = process.env[FACE_ANALYSIS_BLOB_ACCESS_MODE_ENV],
): FaceAnalysisBlobAccessMode {
  const normalized = configuredMode?.trim().toLowerCase()

  if (!normalized || normalized === 'public') return 'public'
  if (normalized === 'private') return 'private'

  throw new Error(
    `${FACE_ANALYSIS_BLOB_ACCESS_MODE_ENV} must be "public" or "private"`,
  )
}

export function getFaceAnalysisBlobStoreId(): string {
  const storeId = process.env[FACE_ANALYSIS_BLOB_STORE_ID_ENV]?.trim()
  if (!storeId) {
    throw new Error(
      `${FACE_ANALYSIS_BLOB_STORE_ID_ENV} is required when Face Analysis Blob access is private`,
    )
  }
  return storeId
}

export function getFaceAnalysisBlobOptions(): FaceAnalysisBlobOptions {
  const access = resolveFaceAnalysisBlobAccessMode()
  return access === 'private'
    ? { access, storeId: getFaceAnalysisBlobStoreId() }
    : { access }
}

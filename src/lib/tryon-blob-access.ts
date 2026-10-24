export type TryOnBlobAccessMode = 'public' | 'private'

// Retain the existing environment variable spelling as part of the deployed
// private Blob store contract; both Try-On retention and prepared Demo reads
// must pass it explicitly rather than falling back to BLOB_READ_WRITE_TOKEN.
export const PRIVATE_BLOB_READ_WRITE_TOKEN_ENV = 'RPIVATE_BLOB_READ_WRITE_TOKEN'
export const TRY_ON_BLOB_DELETE_TOKEN_ENV = PRIVATE_BLOB_READ_WRITE_TOKEN_ENV
export const TRY_ON_BLOB_READ_WRITE_TOKEN_ENV = 'TRY_ON_BLOB_READ_WRITE_TOKEN'

/**
 * The pinned @vercel/blob 2.6.x SDK derives the effective store identity
 * from segment 4 of vercel_blob_rw_<id>_<secret>, and does not compare
 * options.storeId when an explicit RW token is present. Validate both here
 * before any private SDK call or Kie routing decision. Do not log credentials.
 * Accept the SDK's store_<id> and bare <id> spellings (case-sensitive).
 */
function assertPrivateTryOnBlobIdentity(storeId: string, token: string): void {
  const match = /^vercel_blob_rw_([A-Za-z0-9]+)_([A-Za-z0-9_-]+)$/.exec(token)
  const declared = storeId.startsWith('store_') ? storeId.slice('store_'.length) : storeId
  if (!match || !/^[A-Za-z0-9]+$/.test(declared) || declared !== match[1]) {
    throw new Error('Private Try-On Blob Store ID and RW token identity do not match or have invalid format')
  }
}

/**
 * Private Try-On must select one complete Store ID + RW Token pair.
 * Preserve the deployed RPIVATE_BLOB_* typo for compatibility, but never
 * implicitly use BLOB_READ_WRITE_TOKEN (which may be a public store).
 */
export function getPrivateTryOnBlobOptions(
  env: Record<string, string | undefined> = process.env,
): { access: 'private'; storeId: string; token: string } {
  const selectedId = env.TRY_ON_BLOB_STORE_ID?.trim()
  const selectedToken = env[TRY_ON_BLOB_READ_WRITE_TOKEN_ENV]?.trim()
  if (selectedId || selectedToken) {
    if (!selectedId || !selectedToken) {
      throw new Error('TRY_ON_BLOB_STORE_ID and TRY_ON_BLOB_READ_WRITE_TOKEN must be configured together')
    }
    assertPrivateTryOnBlobIdentity(selectedId, selectedToken)
    return { access: 'private', storeId: selectedId, token: selectedToken }
  }
  const legacyId = env.RPIVATE_BLOB_STORE_ID?.trim()
  const legacyToken = env[PRIVATE_BLOB_READ_WRITE_TOKEN_ENV]?.trim()
  if (!legacyId || !legacyToken) {
    throw new Error('Private Try-On Blob requires a complete TRY_ON_BLOB_* or RPIVATE_BLOB_* store identity')
  }
  assertPrivateTryOnBlobIdentity(legacyId, legacyToken)
  return { access: 'private', storeId: legacyId, token: legacyToken }
}

export function hasPrivateTryOnBlobIdentity(
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    getPrivateTryOnBlobOptions(env)
    return true
  } catch {
    return false
  }
}

export function getPrivateBlobReadWriteToken(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return env[PRIVATE_BLOB_READ_WRITE_TOKEN_ENV]?.trim() || null
}

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
  return getPrivateTryOnBlobOptions().token
}

export function getTryOnSourceBlobOptions():
  | { access: 'public' }
  | { access: 'private'; storeId: string; token: string } {
  if (resolveTryOnBlobAccessMode() === 'private') {
    return getPrivateTryOnBlobOptions()
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
  | { access: 'private'; storeId: string; token: string } {
  return getTryOnSourceBlobOptions()
}

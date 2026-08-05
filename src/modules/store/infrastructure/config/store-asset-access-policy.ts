import type { StoreAssetAccessMode } from '../../domain/enums'

export const STORE_ASSET_ACCESS_MODE_ENV = 'STORE_ASSET_ACCESS_MODE'
export const STORE_PUBLIC_POC_MODE = 'public-poc'

export type StoreAssetAccessPolicy = {
  assetAccessMode: StoreAssetAccessMode
  blobAccess: 'private' | 'public'
  publicPoc: boolean
}

const PRIVATE_POLICY: StoreAssetAccessPolicy = {
  assetAccessMode: 'PRIVATE_SIGNED',
  blobAccess: 'private',
  publicPoc: false,
}

const PUBLIC_POC_POLICY: StoreAssetAccessPolicy = {
  assetAccessMode: 'PUBLIC_TEMPORARY',
  blobAccess: 'public',
  publicPoc: true,
}

/**
 * Store assets fail closed to private storage unless the temporary POC mode is
 * explicitly enabled. Unknown values are rejected instead of silently
 * weakening the storage policy.
 */
export function resolveStoreAssetAccessPolicy(
  configuredMode = process.env[STORE_ASSET_ACCESS_MODE_ENV],
): StoreAssetAccessPolicy {
  const normalized = configuredMode?.trim().toLowerCase()

  if (!normalized || normalized === 'private') return PRIVATE_POLICY
  if (normalized === STORE_PUBLIC_POC_MODE) return PUBLIC_POC_POLICY

  throw new Error(
    `${STORE_ASSET_ACCESS_MODE_ENV} must be "private" or "${STORE_PUBLIC_POC_MODE}"`,
  )
}

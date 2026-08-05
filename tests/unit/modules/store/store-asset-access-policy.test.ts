import {
  resolveStoreAssetAccessPolicy,
  STORE_PUBLIC_POC_MODE,
} from '@/modules/store/infrastructure/config/store-asset-access-policy'

describe('Store asset access policy', () => {
  it('defaults to private storage', () => {
    expect(resolveStoreAssetAccessPolicy(undefined)).toEqual({
      assetAccessMode: 'PRIVATE_SIGNED',
      blobAccess: 'private',
      publicPoc: false,
    })
  })

  it('enables public storage only through the explicit POC value', () => {
    expect(resolveStoreAssetAccessPolicy(STORE_PUBLIC_POC_MODE)).toEqual({
      assetAccessMode: 'PUBLIC_TEMPORARY',
      blobAccess: 'public',
      publicPoc: true,
    })
  })

  it('rejects unknown values instead of weakening the policy', () => {
    expect(() => resolveStoreAssetAccessPolicy('public')).toThrow(
      'STORE_ASSET_ACCESS_MODE must be "private" or "public-poc"',
    )
  })
})

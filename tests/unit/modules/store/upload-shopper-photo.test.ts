import { uploadShopperPhoto } from '@/modules/store/application/upload-shopper-photo'
import { createMerchantSessionCapability } from '@/modules/store/domain/session'

describe('uploadShopperPhoto asset policy', () => {
  it('propagates explicit Public POC mode without exposing the provider URL', async () => {
    const capability = createMerchantSessionCapability()
    const expiresAt = new Date(Date.now() + 60_000)
    const put = jest.fn(async (input) => ({
      asset: {
        id: 'asset-1',
        ...input,
        body: undefined,
        providerUrl: 'https://public-store.blob.vercel-storage.com/raw-photo.png',
        deletedAt: null,
        retentionStatus: 'ACTIVE',
        deleteFailCount: 0,
        lastDeleteError: null,
        lastDeleteAttemptAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      deliveryUrl: '/api/store/sessions/assets/asset-1',
    }))
    const attachPhotoAsset = jest.fn(async () => undefined)
    const appendIdempotent = jest.fn(async () => ({ created: true }))

    const result = await uploadShopperPhoto({
      merchants: {
        findBySlug: jest.fn(async () => ({
          id: 'merchant-1',
          slug: 'luna-optical',
          status: 'ACTIVE',
        })),
      } as any,
      sessions: {
        findByMerchantAndId: jest.fn(async () => ({
          id: 'session-1',
          merchantId: 'merchant-1',
          status: 'ACTIVE',
          expiresAt,
          capabilityTokenHash: capability.tokenHash,
        })),
        attachPhotoAsset,
      } as any,
      events: { appendIdempotent } as any,
      assets: { put } as any,
      slug: 'luna-optical',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
      file: new File(['photo'], 'customer-name.png', { type: 'image/png' }),
      assetExpiresAt: expiresAt,
      assetAccessMode: 'PUBLIC_TEMPORARY',
    })

    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({
        accessMode: 'PUBLIC_TEMPORARY',
        storageKey: expect.stringMatching(
          /^store\/merchant-1\/sessions\/session-1\/photo-[0-9a-f-]+\.png$/,
        ),
      }),
    )
    expect(put.mock.calls[0][0].storageKey).not.toContain('customer-name')
    expect(result.previewUrl).toBe(
      '/api/store/sessions/assets/asset-1?merchantSlug=luna-optical&merchantSessionId=session-1',
    )
    expect(result.previewUrl).not.toContain('blob.vercel-storage.com')
    expect(attachPhotoAsset).toHaveBeenCalledWith({
      merchantId: 'merchant-1',
      sessionId: 'session-1',
      photoAssetId: 'asset-1',
    })
    expect(appendIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ accessMode: 'PUBLIC_TEMPORARY' }),
      }),
    )
  })
})

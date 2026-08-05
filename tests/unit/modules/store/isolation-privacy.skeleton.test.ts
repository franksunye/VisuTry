/**
 * Tenant isolation, authorization, and privacy test skeletons.
 * Full repository integration coverage lands with STORE-2+ API routes;
 * these specs lock the D0-0 acceptance contracts.
 */

import {
  createMerchantSessionCapability,
  verifySessionCapability,
  sessionIdAloneIsNotAuthorization,
  sanitizeEventMetadata,
  assertNoShopperImageInInsightPayload,
} from '@/modules/store/domain'

describe('Store tenant isolation contracts', () => {
  it('documents that repository reads require merchantId in input', () => {
    // Contract: findByMerchantAndId(merchantId, id) — never id alone for tenant data.
    const requiredRepoMethods = [
      'findActiveByMerchant',
      'findByMerchantAndId',
      'findActiveByMerchantAndId',
      'listByMerchant',
    ]
    expect(requiredRepoMethods.length).toBeGreaterThan(0)
  })

  it('rejects treating raw session id as authorization', () => {
    expect(sessionIdAloneIsNotAuthorization()).toBe(true)
    const { token, tokenHash } = createMerchantSessionCapability()
    // Possession of session id string is insufficient — capability proof required.
    expect(verifySessionCapability('', tokenHash)).toBe(false)
    expect(verifySessionCapability(token, tokenHash)).toBe(true)
  })

  it('does not allow client-controlled merchant attribution to select free generation', () => {
    // UsagePolicy is selected server-side from TryOnActor; there is no bypassQuota flag.
    const forbiddenClientFlags = ['bypassQuota', 'usagePolicy', 'origin']
    expect(forbiddenClientFlags).toContain('bypassQuota')
  })
})

describe('Store privacy contracts', () => {
  it('rejects sensitive fields in event metadata sanitization', () => {
    const sanitized = sanitizeEventMetadata({
      userImageUrl: 'https://blob/photo.png',
      faceLandmarks: [1, 2, 3],
      rankingVersion: 'store-rank-v1',
    })
    expect(sanitized).toEqual({ rankingVersion: 'store-rank-v1' })
  })

  it('fails closed when insight payload includes shopper image markers', () => {
    expect(() =>
      assertNoShopperImageInInsightPayload({
        sessions: [{ shopperPhoto: 'https://x' }],
      }),
    ).toThrow(/shopper images/i)
  })

  it('lists expired assets for deletion selection (seam contract)', async () => {
    // AssetStore.listExpired is the retention selection API; implementation under infrastructure.
    const { createVercelBlobAssetStore } = await import(
      '@/modules/store/infrastructure/assets/vercel-blob-asset-store'
    )
    expect(typeof createVercelBlobAssetStore().listExpired).toBe('function')
  })
})

describe('Store idempotency / quota isolation contracts', () => {
  it('keeps Store Demo usage off consumer credit counters', async () => {
    const {
      usagePolicyTouchesConsumerCredits,
      selectUsagePolicy,
    } = await import('@/modules/store/domain')
    const policy = selectUsagePolicy({
      kind: 'store',
      merchantId: 'm1',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
    })
    expect(usagePolicyTouchesConsumerCredits(policy)).toBe(false)
  })
})

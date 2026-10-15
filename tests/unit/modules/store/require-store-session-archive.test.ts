import { createMerchantSessionCapability } from '@/modules/store/domain'
import { requireOperableStoreSession } from '@/modules/store/application/require-store-session'
import type { MerchantSessionRecord } from '@/modules/store/application/ports/repositories'

const now = new Date()

function session(): MerchantSessionRecord {
  const capability = createMerchantSessionCapability()
  return {
    id: 'session-1',
    merchantId: 'merchant-1',
    experienceId: 'campaign-1',
    anonymousVisitorId: null,
    photoAssetId: null,
    capabilityTokenHash: capability.tokenHash,
    locale: 'en',
    status: 'ACTIVE',
    referenceData: false,
    source: null,
    medium: null,
    campaign: null,
    acquisitionSurface: null,
    referrer: null,
    landingUrl: null,
    aiAgentSource: null,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: new Date(now.getTime() + 60_000),
    __capabilityToken: capability.token,
  } as MerchantSessionRecord & { __capabilityToken: string }
}

describe('archived Campaign shopper-session guard', () => {
  it('rejects a previously issued session capability after the Campaign is archived', async () => {
    const record = session()
    const markExpired = jest.fn()
    const sessions = {
      findByMerchantAndId: jest.fn().mockResolvedValue(record),
      markExpired,
    } as never

    await expect(requireOperableStoreSession({
      sessions,
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      capabilityToken: (record as typeof record & { __capabilityToken: string }).__capabilityToken,
      requireShopperActions: true,
      experiences: {
        findByMerchantAndId: jest.fn().mockResolvedValue({
          id: 'campaign-1', merchantId: 'merchant-1', type: 'CAMPAIGN', status: 'ARCHIVED',
        }),
      } as never,
    })).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED', httpStatus: 409 })
    expect(markExpired).not.toHaveBeenCalled()
  })

  it('keeps ACTIVE Campaign shopper actions available', async () => {
    const record = session()
    const result = await requireOperableStoreSession({
      sessions: { findByMerchantAndId: jest.fn().mockResolvedValue(record) } as never,
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      capabilityToken: (record as typeof record & { __capabilityToken: string }).__capabilityToken,
      requireShopperActions: true,
      experiences: {
        findByMerchantAndId: jest.fn().mockResolvedValue({
          id: 'campaign-1', merchantId: 'merchant-1', type: 'CAMPAIGN', status: 'ACTIVE',
        }),
      } as never,
    })

    expect(result).toBe(record)
  })

  it('fails closed when an existing Experience-bound session cannot verify current lifecycle', async () => {
    const record = session()
    await expect(requireOperableStoreSession({
      sessions: { findByMerchantAndId: jest.fn().mockResolvedValue(record) } as never,
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      capabilityToken: (record as typeof record & { __capabilityToken: string }).__capabilityToken,
      requireShopperActions: true,
    })).rejects.toMatchObject({ code: 'SESSION_UNAUTHORIZED', httpStatus: 401 })
  })
})

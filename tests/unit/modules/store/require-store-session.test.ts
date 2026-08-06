import {
  createMerchantSessionCapability,
  verifySessionCapability,
  isSessionOperable,
  StoreDomainError,
} from '@/modules/store/domain'
import { requireOperableStoreSession } from '@/modules/store/application/require-store-session'
import type { MerchantSessionRecord, MerchantSessionRepository } from '@/modules/store/application'

function makeSession(
  capabilityTokenHash: string,
  overrides: Partial<Omit<MerchantSessionRecord, 'capabilityTokenHash'>> = {},
): MerchantSessionRecord {
  return {
    id: 'session-1',
    merchantId: 'merchant-1',
    anonymousVisitorId: null,
    photoAssetId: null,
    locale: 'en',
    status: 'ACTIVE',
    source: null,
    medium: null,
    campaign: null,
    referrer: null,
    landingUrl: null,
    aiAgentSource: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
    capabilityTokenHash,
  }
}

describe('requireOperableStoreSession', () => {
  it('rejects missing capability token', async () => {
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn(),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }

    await expect(
      requireOperableStoreSession({
        sessions,
        merchantId: 'm1',
        merchantSessionId: 's1',
        capabilityToken: null,
      }),
    ).rejects.toBeInstanceOf(StoreDomainError)
  })

  it('rejects raw session id without matching capability', async () => {
    const capability = createMerchantSessionCapability()
    const session = makeSession(capability.tokenHash)
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue(session),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }

    await expect(
      requireOperableStoreSession({
        sessions,
        merchantId: 'merchant-1',
        merchantSessionId: 'session-1',
        capabilityToken: 'not-the-token',
      }),
    ).rejects.toMatchObject({ code: 'SESSION_UNAUTHORIZED' })

    expect(verifySessionCapability(capability.token, session.capabilityTokenHash)).toBe(true)
  })

  it('accepts a valid capability for an active session', async () => {
    const capability = createMerchantSessionCapability()
    const session = makeSession(capability.tokenHash, {
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 120_000),
    })
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue(session),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }

    const result = await requireOperableStoreSession({
      sessions,
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
    })

    expect(result.id).toBe('session-1')
    expect(isSessionOperable(session)).toBe(true)
  })

  it('marks and rejects expired sessions', async () => {
    const capability = createMerchantSessionCapability()
    const session = makeSession(capability.tokenHash, {
      expiresAt: new Date(Date.now() - 1000),
    })
    const markExpired = jest.fn()
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue(session),
      touch: jest.fn(),
      markExpired,
      attachPhotoAsset: jest.fn(),
    }

    await expect(
      requireOperableStoreSession({
        sessions,
        merchantId: 'merchant-1',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
      }),
    ).rejects.toMatchObject({ code: 'SESSION_EXPIRED' })

    expect(markExpired).toHaveBeenCalledWith('merchant-1', 'session-1')
  })
})

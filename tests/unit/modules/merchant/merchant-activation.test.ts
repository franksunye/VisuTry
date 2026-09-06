jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantActivationEvent: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn() },
}))

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { recordMerchantActivationEvent, recordMerchantActivationEventWithClient } from '@/modules/merchant/application/merchant-activation'

describe('Merchant Activation v1 application service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('writes a bounded, idempotent event through the canonical Prisma boundary', async () => {
    await recordMerchantActivationEvent({
      merchantId: 'merchant-a',
      eventType: 'merchant_workspace_entered',
      source: 'CLIENT',
      sessionId: 'session-12345678',
      correlationId: 'signup-12345678',
      attribution: {
        landingPage: '/en/business?utm_source=google',
        acquisitionSource: 'google',
        acquisitionMedium: 'organic',
        referrerHost: 'www.google.com',
        utmSource: 'google',
      },
    })

    expect(prisma.merchantActivationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchantId_dedupeKey: expect.objectContaining({ merchantId: 'merchant-a' }) },
      create: expect.objectContaining({
        merchantId: 'merchant-a',
        eventType: 'merchant_workspace_entered',
        source: 'CLIENT',
        sessionId: 'session-12345678',
        metadata: expect.objectContaining({
          landing_page: '/en/business',
          acquisition_source: 'google',
          referrer_host: 'www.google.com',
        }),
      }),
      update: {},
    }))
    expect(logger.info).toHaveBeenCalledWith('merchant', 'Merchant activation event recorded', expect.objectContaining({
      activationEvent: 'merchant_workspace_entered',
      merchantId: 'merchant-a',
      source: 'CLIENT',
    }))
  })

  it('rejects an invalid event source and never writes it', async () => {
    await expect(recordMerchantActivationEvent({
      merchantId: 'merchant-a',
      eventType: 'merchant_workspace_entered',
      source: 'CLIENTISH' as never,
      sessionId: 'session-12345678',
    })).rejects.toThrow('Unsupported Merchant activation event source.')
    expect(prisma.merchantActivationEvent.upsert).not.toHaveBeenCalled()
  })

  it('shares the same normalization and dedupe contract with transaction callers', async () => {
    const client = {
      merchantActivationEvent: { upsert: jest.fn().mockResolvedValue({}) },
    }
    await recordMerchantActivationEventWithClient(client, {
      merchantId: 'merchant-a',
      eventType: 'merchant_first_item_added',
      source: 'SERVER',
      resourceId: 'frame-a',
      metadata: { frame_id: 'frame-a', reason: 'owner@example.com', frame_count: 1 },
    })

    const call = client.merchantActivationEvent.upsert.mock.calls[0][0]
    expect(call.where.merchantId_dedupeKey.dedupeKey).toBe('merchant:merchant-a:first_item_added')
    expect(call.create.metadata).toEqual({ frame_id: 'frame-a', frame_count: 1 })
  })
})

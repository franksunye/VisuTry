import {
  buildMerchantActivationDedupeKey,
  MERCHANT_ACTIVATION_EVENT,
  merchantCatalogItemIsReady,
  sanitizeMerchantActivationAttribution,
  summarizeMerchantActivationEvents,
} from '@/modules/merchant/domain/merchant-activation'

function event(input: Partial<{
  eventType: keyof typeof MERCHANT_ACTIVATION_EVENT
  occurredAt: string
  sessionId: string | null
  dedupeKey: string
}> = {}) {
  const eventType = input.eventType ? MERCHANT_ACTIVATION_EVENT[input.eventType] : MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED
  return {
    id: `event-${eventType}`,
    merchantId: 'merchant-a',
    eventType,
    occurredAt: new Date(input.occurredAt ?? '2026-09-07T10:00:00.000Z'),
    source: 'SERVER' as const,
    correlationId: 'signup-12345678',
    sessionId: input.sessionId ?? null,
    dedupeKey: input.dedupeKey ?? `merchant:merchant-a:${eventType}`,
    metadata: null,
  }
}

describe('Merchant Activation v1 domain contract', () => {
  it('keeps first-touch attribution bounded, pathname/host only, and free of PII', () => {
    expect(sanitizeMerchantActivationAttribution({
      landingPage: 'https://visutry.com/en/business?email=owner@example.com',
      acquisitionSource: 'owner@example.com',
      acquisitionMedium: 'paid',
      referrerHost: 'www.google.com',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'launch-september',
      commercialIntent: 'growth',
      signupCorrelationId: 'signup-12345678',
      landingLocale: 'en',
    })).toEqual({
      acquisition_medium: 'paid',
      referrer_host: 'www.google.com',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'launch-september',
      commercial_intent: 'GROWTH',
      signup_correlation_id: 'signup-12345678',
      landing_locale: 'en',
    })
  })

  it('uses one deterministic key for first milestones and session keys for repeatable entry', () => {
    expect(buildMerchantActivationDedupeKey({
      merchantId: 'merchant-a',
      eventType: MERCHANT_ACTIVATION_EVENT.FIRST_ITEM_ADDED,
      sessionId: 'session-11111111',
    })).toBe('merchant:merchant-a:first_item_added')
    expect(buildMerchantActivationDedupeKey({
      merchantId: 'merchant-a',
      eventType: MERCHANT_ACTIVATION_EVENT.WORKSPACE_ENTERED,
      sessionId: 'session-11111111',
    })).not.toBe(buildMerchantActivationDedupeKey({
      merchantId: 'merchant-a',
      eventType: MERCHANT_ACTIVATION_EVENT.WORKSPACE_ENTERED,
      sessionId: 'session-22222222',
    }))
  })

  it('summarizes return sessions, highest stage, and time-to-activation from durable events', () => {
    const summary = summarizeMerchantActivationEvents([
      event({ occurredAt: '2026-09-07T10:00:00.000Z' }),
      event({ eventType: 'WORKSPACE_ENTERED', occurredAt: '2026-09-07T10:01:00.000Z', sessionId: 'session-11111111' }),
      event({ eventType: 'WORKSPACE_ENTERED', occurredAt: '2026-09-08T10:01:00.000Z', sessionId: 'session-22222222' }),
      event({ eventType: 'FIRST_ITEM_ADDED', occurredAt: '2026-09-07T10:05:00.000Z' }),
      event({ eventType: 'CATALOG_READY', occurredAt: '2026-09-07T10:06:00.000Z' }),
      event({ eventType: 'STORE_PUBLISHED', occurredAt: '2026-09-07T10:12:00.000Z' }),
    ])

    expect(summary.workspaceSessionCount).toBe(2)
    expect(summary.returnSessionCount).toBe(1)
    expect(summary.highestStage).toBe('A7')
    expect(summary.timeToFirstItemMs).toBe(5 * 60 * 1000)
    expect(summary.timeToStorePublishedMs).toBe(12 * 60 * 1000)
  })

  it('keeps Catalog Ready on the existing recommendation readiness contract', () => {
    expect(merchantCatalogItemIsReady({
      id: 'frame-a',
      sku: null,
      externalId: 'shopify-product-1',
      productUrl: 'https://shop.example/products/a',
      name: 'Frame A',
      imageUrl: 'https://cdn.example/frame-a.jpg',
      shape: 'round',
      source: 'EXTERNAL',
      status: 'ACTIVE',
      enrichmentStatus: 'APPROVED',
    })).toBe(true)
    expect(merchantCatalogItemIsReady({
      id: 'frame-b',
      externalId: 'shopify-product-2',
      productUrl: 'https://shop.example/products/b',
      name: 'Frame B',
      imageUrl: 'https://cdn.example/frame-b.jpg',
      shape: null,
      source: 'EXTERNAL',
      status: 'ACTIVE',
      enrichmentStatus: 'PENDING',
    })).toBe(false)
  })
})

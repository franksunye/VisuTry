import { merchantHandoffEventMetadata, resolveMerchantHandoff, sanitizeEventMetadata } from '@/modules/store/domain'
import { recordMerchantHandoff } from '@/modules/store/application/record-merchant-handoff'

describe('Merchant Handoff contract', () => {
  it.each([
    ['VISIT_STORE', 'VISIT_STORE'],
    ['BOOK_APPOINTMENT', 'BOOK_APPOINTMENT'],
    ['WHATSAPP', 'WHATSAPP'],
    ['EMAIL', 'EMAIL'],
    ['PRODUCT', 'PRODUCT'],
    ['CUSTOM_LINK', 'CUSTOM_LINK'],
    ['PRODUCT_OR_COLLECTION', 'PRODUCT'],
    ['LINK', 'CUSTOM_LINK'],
  ])('resolves bounded action %s as %s', (type, action) => {
    expect(resolveMerchantHandoff({ type, label: ' Continue ', url: 'https://shop.example/next' })).toEqual({
      action,
      label: 'Continue',
      url: 'https://shop.example/next',
    })
  })

  it.each(['UNKNOWN', 'javascript:alert(1)', '//evil.example', 'mailto:shop@example.com', '/\\evil'])('fails closed for malformed persisted Handoff %s', (value) => {
    expect(resolveMerchantHandoff({ type: value, label: 'Go', url: value })).toBeNull()
  })

  it('emits only bounded metadata and does not leak destination, PII, messages, or capabilities', () => {
    const metadata = merchantHandoffEventMetadata({
      action: 'WHATSAPP',
      surface: 'RESULT',
      clientActionId: 'b2c14fe1-8544-4f4c-9a63-a0f8ca5e7060',
      url: 'https://wa.me/15551234567?text=private',
      email: 'shopper@example.com',
      message: 'private message',
      capabilityToken: 'secret-token',
    } as never)
    expect(sanitizeEventMetadata(metadata)).toEqual({
      action: 'WHATSAPP',
      surface: 'RESULT',
      clientActionId: 'b2c14fe1-8544-4f4c-9a63-a0f8ca5e7060',
    })
    expect(JSON.stringify(metadata)).not.toMatch(/wa\.me|15551234567|private|shopper@example|secret-token/i)
  })

  it('persists one idempotent event only for an action configured on that Experience', async () => {
    const experience = {
      id: 'experience-1', slug: 'spring-edit', type: 'CAMPAIGN',
      primaryCtaType: 'LINK', primaryCtaLabel: 'Visit', primaryCtaUrl: 'https://shop.example/',
      secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null,
    }
    const appendIdempotent = jest.fn().mockResolvedValue({ created: true, record: {} })
    const input = {
      merchants: { findPublicBySlug: jest.fn().mockResolvedValue({ id: 'merchant-1', status: 'ACTIVE' }) } as never,
      experiences: { findPublicCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(experience) } as never,
      events: { appendIdempotent } as never,
      merchantSlug: 'merchant', experienceSlug: 'spring-edit', experienceType: 'CAMPAIGN' as const,
      action: 'CUSTOM_LINK' as const, surface: 'DISCOVERY' as const,
      clientActionId: 'b2c14fe1-8544-4f4c-9a63-a0f8ca5e7060', locale: 'en', deviceType: 'desktop' as const,
    }

    await recordMerchantHandoff(input)
    await recordMerchantHandoff(input)
    expect(appendIdempotent).toHaveBeenCalledTimes(2)
    expect(appendIdempotent.mock.calls[0][0]).toMatchObject({
      type: 'merchant_handoff_invoked',
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
      source: 'CLIENT',
      metadata: { action: 'CUSTOM_LINK', surface: 'DISCOVERY' },
    })
    expect(JSON.stringify(appendIdempotent.mock.calls[0][0].metadata)).not.toContain('https://')
    expect(appendIdempotent.mock.calls[1][0].eventId).toBe(appendIdempotent.mock.calls[0][0].eventId)
    await expect(recordMerchantHandoff({ ...input, action: 'EMAIL' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

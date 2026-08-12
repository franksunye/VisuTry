import { buildStoreOutboundUrl } from '@/lib/store-outbound-links'

describe('buildStoreOutboundUrl', () => {
  it('applies the Store outbound tracking contract and preserves merchant parameters/hash', () => {
    const result = new URL(buildStoreOutboundUrl(
      'https://merchant.example/products/frame-1?variant=blue#details',
      { experienceType: 'STORE', linkType: 'product' },
    ))

    expect(result.searchParams.get('variant')).toBe('blue')
    expect(result.searchParams.get('source')).toBe('visutry')
    expect(result.searchParams.get('medium')).toBe('referral')
    expect(result.searchParams.get('surface')).toBe('store')
    expect(result.searchParams.get('campaign')).toBe('store-discovery')
    expect(result.searchParams.get('utm_source')).toBe('visutry.com')
    expect(result.searchParams.get('utm_medium')).toBe('referral')
    expect(result.searchParams.get('utm_campaign')).toBe('store-discovery')
    expect(result.searchParams.get('utm_content')).toBe('product')
    expect(result.hash).toBe('#details')
  })

  it('uses the Campaign slug and merchant link content for campaign destinations', () => {
    const result = new URL(buildStoreOutboundUrl(
      'https://merchant.example/',
      { experienceType: 'CAMPAIGN', experienceSlug: 'petite-fit', linkType: 'merchant' },
    ))

    expect(result.searchParams.get('surface')).toBe('campaign')
    expect(result.searchParams.get('campaign')).toBe('campaign-petite-fit')
    expect(result.searchParams.get('utm_campaign')).toBe('campaign-petite-fit')
    expect(result.searchParams.get('utm_content')).toBe('merchant')
  })

  it('leaves invalid or non-http destinations unchanged', () => {
    const context = { experienceType: 'STORE' as const, linkType: 'merchant' as const }

    expect(buildStoreOutboundUrl('not a url', context)).toBe('not a url')
    expect(buildStoreOutboundUrl('mailto:hello@example.com', context)).toBe('mailto:hello@example.com')
  })
})

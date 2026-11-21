import { getMerchantDiscoveryEditorial, normalizeMerchantDiscoveryDestinations } from '@/lib/merchant-discovery-editorial'
import { canaryDiscoveryFrameUrl } from '@/lib/canary-discovery-frames'
import { makeCanaryEditorialDiscovery } from '../../fixtures/merchant-discovery-editorial'

describe('reviewed Merchant discovery editorial', () => {
  it('uses the current Campaign frames and same-page IDs without asserting unverified material or dimensions', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames[0].name = 'Current Canary round name'
    const editorial = getMerchantDiscoveryEditorial(discovery)

    expect(editorial?.comparison.map((frame) => frame.frameId)).toEqual(['canary-round', 'canary-rectangle'])
    expect(editorial?.comparison[0]).toMatchObject({
      name: 'Current Canary round name', anchorId: 'frame-canary-round', shape: 'round',
    })
    expect(editorial?.comparison[0]).not.toHaveProperty('material')
    expect(editorial?.comparison[0]).not.toHaveProperty('color')
    expect(editorial?.faqs[0].answer).toContain('Current Canary round name')
    expect(JSON.stringify(editorial)).not.toMatch(/demo-optical|VT-DEMO|\/demo\/frames\//)
    expect(editorial?.nonSaleNotice).toContain('not offered for sale')
  })

  it.each([
    ['other merchant', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.slug = 'some-other-merchant' }],
    ['sales Demo', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.slug = 'visutry-demo-optical' }],
    ['other Campaign', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.slug = 'other-campaign' }],
    ['Store', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.type = 'STORE' }],
    ['different tenant', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.merchantId = 'other-merchant' }],
    ['merchant Reference', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.referenceData = true }],
    ['Campaign Reference', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.referenceData = true }],
    ['Reference pilot', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.pilotType = 'REFERENCE' }],
    ['draft', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.status = 'DRAFT' }],
    ['ended', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.status = 'ENDED' }],
    ['archived', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.status = 'ARCHIVED' }],
    ['private', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.visibility = 'PRIVATE' }],
    ['noindex', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.visibility = 'PUBLIC_NOINDEX' }],
  ])('does not apply the acquisition example to %s', (_label, mutate) => {
    const discovery = makeCanaryEditorialDiscovery()
    mutate(discovery)
    expect(getMerchantDiscoveryEditorial(discovery)).toBeNull()
  })

  it('falls back to the ordinary collection when a comparison frame or its public image is missing', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames = discovery.frames.filter((frame) => frame.shape !== 'rectangle')
    expect(getMerchantDiscoveryEditorial(discovery)).toBeNull()

    const missingImage = makeCanaryEditorialDiscovery()
    missingImage.frames[0].imageUrl = null
    expect(getMerchantDiscoveryEditorial(missingImage)).toBeNull()
    missingImage.frames[0].imageUrl = 'javascript:alert(1)'
    expect(getMerchantDiscoveryEditorial(missingImage)).toBeNull()
  })
})

describe('independent Canary product destinations', () => {
  it('maps the six legacy destinations to real Canary frame IDs without changing stored frames', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames = ['round', 'rectangle', 'oval', 'browline', 'aviator', 'cat-eye'].map((slug, index) => ({
      ...discovery.frames[0], id: `old-canary-${slug}`,
      productUrl: `${index % 2 ? 'https://visutry.com' : 'https://www.visutry.com'}/en/demo/frames/${slug}?source=legacy#details`,
    }))
    const before = discovery.frames.map((frame) => frame.productUrl)
    const view = normalizeMerchantDiscoveryDestinations(discovery)
    expect(view.frames.every((frame) => frame.productUrl === canaryDiscoveryFrameUrl(frame.id))).toBe(true)
    expect(view.frames.some((frame) => frame.productUrl !== null)).toBe(true)
    expect(discovery.frames.map((frame) => frame.productUrl)).toEqual(before)
    expect(view.merchant).toBe(discovery.merchant)
    expect(view.experience).toBe(discovery.experience)
    expect(view.visibility).toBe(discovery.visibility)
    expect(normalizeMerchantDiscoveryDestinations(view)).toBe(view)
  })

  it('preserves actual external product destinations and unknown first-party pages', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames[0].productUrl = 'https://retailer.example/en/demo/frames/round'
    discovery.frames[1].productUrl = 'https://www.visutry.com/en/demo/frames/new-product'
    discovery.frames[2].productUrl = 'https://shop.example/products/frame-123'
    discovery.frames = discovery.frames.slice(0, 3)
    expect(normalizeMerchantDiscoveryDestinations(discovery)).toBe(discovery)
  })

  it.each([
    ['Demo Optical', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.slug = 'visutry-demo-optical' }],
    ['another tenant', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.merchantId = 'another-tenant' }],
    ['Reference merchant', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.referenceData = true }],
    ['Reference Experience', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.referenceData = true }],
    ['Demo pilot', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.merchant.pilotType = 'DEMO' }],
    ['another Canary Campaign', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.slug = 'new-campaign' }],
    ['an archived source', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.experience.status = 'ARCHIVED' }],
    ['a noindex source', (d: ReturnType<typeof makeCanaryEditorialDiscovery>) => { d.visibility = 'PUBLIC_NOINDEX' }],
  ])('does not rewrite %s destinations', (_label, mutate) => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames[0].productUrl = 'https://www.visutry.com/en/demo/frames/round'
    mutate(discovery)
    expect(normalizeMerchantDiscoveryDestinations(discovery)).toBe(discovery)
  })
})

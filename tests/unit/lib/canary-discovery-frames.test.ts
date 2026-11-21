import {
  buildCanaryDiscoveryFrames,
  canaryDiscoveryFrameUrl,
  normalizeMerchantDiscoveryDestinations,
} from '@/lib/canary-discovery-frames'
import { makeCanaryEditorialDiscovery } from '../../fixtures/merchant-discovery-editorial'

function makeStore() {
  const store = makeCanaryEditorialDiscovery()
  store.experience.type = 'STORE'
  store.experience.slug = 'store'
  return store
}

describe('Canary frame destinations and detail admission', () => {
  it('resolves every projected real-ID destination from the same selected sources, without a website', () => {
    const store = makeStore()
    const campaign = makeCanaryEditorialDiscovery()
    campaign.frames = campaign.frames.slice(0, 4)
    expect(store.merchant.websiteUrl).toBeNull()
    const frames = buildCanaryDiscoveryFrames({ store, campaign })
    expect(frames).toHaveLength(6)
    for (const source of [store, campaign]) {
      const projected = normalizeMerchantDiscoveryDestinations(source)
      for (const frame of projected.frames) {
        const detail = frames.find((candidate) => candidate.id === frame.id)
        expect(detail?.canonicalUrl).toBe(frame.productUrl)
        expect(detail?.name).toBe(frame.name)
      }
    }
    expect(frames.find((frame) => frame.id === 'canary-round')).toMatchObject({
      storePath: '/en/store/visutry-demo', campaignPath: '/en/c/visutry-demo/everyday-fit',
    })
    expect(frames.find((frame) => frame.id === 'canary-aviator')?.campaignPath).toBeNull()
  })

  it('only attributes a continuation to a source that actually selected the frame', () => {
    const store = makeStore()
    store.frames = store.frames.filter((frame) => frame.id !== 'canary-round')
    const campaign = makeCanaryEditorialDiscovery()
    const detail = buildCanaryDiscoveryFrames({ store, campaign }).find((frame) => frame.id === 'canary-round')
    expect(detail).toMatchObject({ storePath: null, campaignPath: '/en/c/visutry-demo/everyday-fit' })
  })

  it('uses actual identity instead of inferring a product from a legacy URL, image, or shared SKU', () => {
    const campaign = makeCanaryEditorialDiscovery()
    campaign.frames[0].id = 'actual-persisted-id'
    campaign.frames[0].name = 'Actual persisted name'
    campaign.frames[0].shape = 'oval'
    const frames = buildCanaryDiscoveryFrames({ store: null, campaign })
    const frame = frames.find((candidate) => candidate.id === 'actual-persisted-id')
    expect(frame).toMatchObject({ name: 'Actual persisted name', shape: 'oval', canonicalUrl: canaryDiscoveryFrameUrl('actual-persisted-id') })
    expect(frames.some((candidate) => candidate.id === 'canary-round')).toBe(false)
  })

  it('keeps a mapped detail available while honestly omitting an unsafe or missing image', () => {
    const campaign = makeCanaryEditorialDiscovery()
    campaign.frames[0].imageUrl = 'javascript:alert(1)'
    const frame = buildCanaryDiscoveryFrames({ store: null, campaign }).find((candidate) => candidate.id === 'canary-round')
    expect(frame?.imageUrl).toBeNull()
    expect(normalizeMerchantDiscoveryDestinations(campaign).frames[0].productUrl).toBe(frame?.canonicalUrl)
  })

  it.each([
    ['other tenant', (d: ReturnType<typeof makeStore>) => { d.merchant.slug = 'visutry-demo-optical' }],
    ['merchant identity mismatch', (d: ReturnType<typeof makeStore>) => { d.experience.merchantId = 'other-merchant' }],
    ['Reference merchant', (d: ReturnType<typeof makeStore>) => { d.merchant.referenceData = true }],
    ['Reference Experience', (d: ReturnType<typeof makeStore>) => { d.experience.referenceData = true }],
    ['other Store', (d: ReturnType<typeof makeStore>) => { d.experience.slug = 'other-store' }],
    ['Draft', (d: ReturnType<typeof makeStore>) => { d.experience.status = 'DRAFT' }],
    ['Ended', (d: ReturnType<typeof makeStore>) => { d.experience.status = 'ENDED' }],
    ['Archived', (d: ReturnType<typeof makeStore>) => { d.experience.status = 'ARCHIVED' }],
    ['private', (d: ReturnType<typeof makeStore>) => { d.visibility = 'PRIVATE' }],
    ['noindex', (d: ReturnType<typeof makeStore>) => { d.visibility = 'PUBLIC_NOINDEX' }],
  ])('does not project or expose frames from %s', (_label, mutate) => {
    const store = makeStore()
    mutate(store)
    expect(buildCanaryDiscoveryFrames({ store, campaign: null })).toEqual([])
    expect(normalizeMerchantDiscoveryDestinations(store)).toBe(store)
  })

  it('excludes missing names, invalid IDs and destinations outside the six legacy pages', () => {
    const campaign = makeCanaryEditorialDiscovery()
    campaign.frames[0].name = ' '
    campaign.frames[1].id = '../other-frame'
    campaign.frames[2].productUrl = 'https://merchant.example/products/real-frame'
    campaign.frames[3].productUrl = 'https://www.visutry.com/en/demo/frames/unknown'
    campaign.frames[4].productUrl = 'https://www.visutry.com/en/discover/frames/not-a-source-id'
    campaign.frames[5].productUrl = null
    expect(buildCanaryDiscoveryFrames({ store: null, campaign })).toEqual([])
    expect(normalizeMerchantDiscoveryDestinations(campaign)).toBe(campaign)
  })

  it('normalizes cached ISO dates and fresh Dates before selecting latest facts and sitemap lastmod', () => {
    const store = JSON.parse(JSON.stringify(makeStore())) as ReturnType<typeof makeStore>
    const campaign = makeCanaryEditorialDiscovery()
    campaign.frames[0].name = 'Updated round frame'
    campaign.frames[0].updatedAt = new Date('2026-11-22T02:00:00.000Z')
    campaign.experience.updatedAt = new Date('2026-11-23T03:00:00.000Z')
    const frame = buildCanaryDiscoveryFrames({ store, campaign }).find((candidate) => candidate.id === 'canary-round')
    expect(frame?.name).toBe('Updated round frame')
    expect(frame?.lastModified).toBeInstanceOf(Date)
    expect(frame?.lastModified.toISOString()).toBe('2026-11-23T03:00:00.000Z')
  })

  it('does not combine differing merchant identities, while retaining a legitimate source alone', () => {
    const store = makeStore()
    const campaign = makeCanaryEditorialDiscovery()
    campaign.merchant.id = 'another-persisted-merchant'
    campaign.experience.merchantId = campaign.merchant.id
    expect(buildCanaryDiscoveryFrames({ store, campaign })).toEqual([])
    expect(buildCanaryDiscoveryFrames({ store, campaign: null })).toHaveLength(6)
    expect(buildCanaryDiscoveryFrames({ store: null, campaign })).toHaveLength(6)
  })
})

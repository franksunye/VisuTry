import {
  sanitizeAcquisitionAttribution,
  serializeAttributionForStripe,
  parseAttributionFromStripeMetadata,
} from '@/lib/acquisition-attribution'
import { analytics, getAcquisitionContext, setGrowthContext } from '@/lib/analytics'

describe('acquisition attribution helpers', () => {
  it('sanitizes and serializes attribution for Stripe metadata', () => {
    const attribution = sanitizeAcquisitionAttribution({
      landing_page: '/en/face-shape-detector',
      growth_source: 'seo-cluster',
      medium: 'organic',
      query_cluster: 'face-shape-detector',
      content_cluster: 'search-tool',
      product_path: 'virtual_try_on',
      ignored: 'nope',
    })

    expect(attribution).toEqual({
      landing_page: '/en/face-shape-detector',
      growth_source: 'seo-cluster',
      medium: 'organic',
      query_cluster: 'face-shape-detector',
      content_cluster: 'search-tool',
      product_path: 'virtual_try_on',
    })

    const serialized = serializeAttributionForStripe(attribution)
    expect(serialized).toBeTruthy()
    expect(serialized!.length).toBeLessThanOrEqual(500)
    expect(parseAttributionFromStripeMetadata({ attribution: serialized! })).toEqual(attribution)
  })
})

describe('analytics session attribution', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.dataLayer = []
    window.gtag = jest.fn()
  })

  it('preserves the first landing page and explicit growth source across events', () => {
    window.history.pushState({}, '', '/en/face-shape-detector?source=seo-cluster&utm_medium=organic')
    analytics.trackCustomEvent('first_event')

    window.history.pushState({}, '', '/en/try-on/glasses')
    analytics.trackCustomEvent('second_event')

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'second_event',
      expect.objectContaining({
        landing_page: '/en/face-shape-detector',
        page_path: '/en/try-on/glasses',
        growth_source: 'seo-cluster',
        medium: 'organic',
        landing_locale: 'en',
      }),
    )
  })

  it('carries growth context into acquisition snapshots for checkout', () => {
    window.history.pushState({}, '', '/en/glasses-for-face-shape')
    setGrowthContext({
      query_cluster: 'glasses-for-face-shape',
      content_cluster: 'search-tool',
      product_path: 'face_shape_detector',
    })

    expect(getAcquisitionContext()).toEqual(
      expect.objectContaining({
        landing_page: '/en/glasses-for-face-shape',
        query_cluster: 'glasses-for-face-shape',
        content_cluster: 'search-tool',
        product_path: 'face_shape_detector',
      }),
    )
  })

  it('lets server purchase attribution override cleared session storage', () => {
    window.history.pushState({}, '', '/en/dashboard?payment=success')
    analytics.trackPurchase('cs_test_1', 'CREDITS_PACK', 2.99, {
      landing_page: '/en/face-shape-detector',
      growth_source: 'seo-cluster',
      query_cluster: 'face-shape-detector',
      product_path: 'credits_pack',
    })

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        transaction_id: 'cs_test_1',
        landing_page: '/en/face-shape-detector',
        growth_source: 'seo-cluster',
        query_cluster: 'face-shape-detector',
        product_path: 'credits_pack',
      }),
    )
  })
})

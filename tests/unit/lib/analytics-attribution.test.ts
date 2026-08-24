import {
  sanitizeAcquisitionAttribution,
  serializeAttributionForStripe,
  parseAttributionFromStripeMetadata,
} from '@/lib/acquisition-attribution'
import {
  analytics,
  getAcquisitionContext,
  getCheckoutAttribution,
  setGrowthContext,
  trackLocaleChanged,
} from '@/lib/analytics'

describe('acquisition attribution helpers', () => {
  it('sanitizes and serializes attribution for Stripe metadata', () => {
    const attribution = sanitizeAcquisitionAttribution({
      landing_page: '/en/face-shape-detector',
      acquisition_source: 'google.com',
      acquisition_medium: 'organic',
      source_page: '/what-glasses-suit-my-face',
      query_cluster: 'face-shape-detector',
      content_cluster: 'search-tool',
      product_path: 'virtual_try_on',
      landing_locale: 'en',
      pricing_locale: 'de',
      checkout_locale: 'de',
      site_locale: 'de',
      browser_language: 'de-DE',
      browser_languages: ['de-DE', 'de', 'en-US'],
      locale_changed: true,
      ignored: 'nope',
    })

    expect(attribution).toEqual({
      landing_page: '/en/face-shape-detector',
      acquisition_source: 'google.com',
      acquisition_medium: 'organic',
      source_page: '/what-glasses-suit-my-face',
      query_cluster: 'face-shape-detector',
      content_cluster: 'search-tool',
      product_path: 'virtual_try_on',
      landing_locale: 'en',
      pricing_locale: 'de',
      checkout_locale: 'de',
      site_locale: 'de',
      browser_language: 'de-DE',
      browser_languages: ['de-DE', 'de', 'en-US'],
      locale_changed: true,
    })

    const serialized = serializeAttributionForStripe(attribution)
    expect(serialized).toBeTruthy()
    expect(serialized!.length).toBeLessThanOrEqual(500)
    expect(parseAttributionFromStripeMetadata({ attribution: serialized! })).toEqual(attribution)
  })

  it('never returns invalid JSON when attribution exceeds Stripe metadata limits', () => {
    const serialized = serializeAttributionForStripe({
      landing_page: `/${'landing-'.repeat(50)}`,
      page_path: `/${'page-'.repeat(50)}`,
      acquisition_source: 'google.com',
      acquisition_medium: 'organic',
      source_page: `/${'source-'.repeat(50)}`,
      query_cluster: 'query-'.repeat(50),
      content_cluster: 'search-tool-'.repeat(50),
      product_path: 'virtual_try_on',
      landing_locale: 'en-US',
    })

    expect(serialized).toBeTruthy()
    expect(serialized!.length).toBeLessThanOrEqual(500)
    expect(() => JSON.parse(serialized!)).not.toThrow()
    expect(JSON.parse(serialized!)).toEqual(
      expect.objectContaining({ acquisition_source: 'google.com' }),
    )
  })

  it('maps legacy source fields without treating internal paths as acquisition sources', () => {
    expect(sanitizeAcquisitionAttribution({
      growth_source: '/what-glasses-suit-my-face',
      medium: 'organic',
    })).toEqual({
      source_page: '/what-glasses-suit-my-face',
      acquisition_medium: 'organic',
    })
  })
})

describe('analytics session attribution', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.dataLayer = []
    window.gtag = jest.fn()
  })

  it('preserves first-touch acquisition UTM values across internal navigation', () => {
    window.history.pushState({}, '', '/en/face-shape-detector?utm_source=google&utm_medium=organic')
    analytics.trackCustomEvent('first_event')

    setGrowthContext({ source_page: '/en/face-shape-detector' })
    window.history.pushState({}, '', '/en/try-on/glasses?source_page=%2Fen%2Fface-shape-detector')
    analytics.trackCustomEvent('second_event')

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'second_event',
      expect.objectContaining({
        landing_page: '/en/face-shape-detector',
        page_path: '/en/try-on/glasses',
        acquisition_source: 'google',
        acquisition_medium: 'organic',
        source_page: '/en/face-shape-detector',
        landing_locale: 'en',
      }),
    )
  })

  it('carries source page and growth context into acquisition snapshots for checkout', () => {
    window.history.pushState({}, '', '/en/glasses-for-face-shape?utm_source=chatgpt.com&utm_medium=referral')
    setGrowthContext({
      source_page: '/en/glasses-for-face-shape',
      query_cluster: 'glasses-for-face-shape',
      content_cluster: 'search-tool',
      product_path: 'face_shape_detector',
    })

    expect(getAcquisitionContext()).toEqual(
      expect.objectContaining({
        landing_page: '/en/glasses-for-face-shape',
        acquisition_source: 'chatgpt.com',
        acquisition_medium: 'referral',
        source_page: '/en/glasses-for-face-shape',
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
      acquisition_source: 'google.com',
      acquisition_medium: 'organic',
      source_page: '/what-glasses-suit-my-face',
      query_cluster: 'face-shape-detector',
      product_path: 'credits_pack',
    })

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        transaction_id: 'cs_test_1',
        landing_page: '/en/face-shape-detector',
        acquisition_source: 'google.com',
        acquisition_medium: 'organic',
        source_page: '/what-glasses-suit-my-face',
        query_cluster: 'face-shape-detector',
        product_path: 'credits_pack',
      }),
    )
  })

  it('keeps browser language separate from URL site locale and freezes landing locale', () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'ar-AE' })
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['ar-AE', 'en-US', 'en'] })
    window.history.pushState({}, '', '/en/face-shape-detector')

    analytics.trackCustomEvent('language_context_smoke')

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'language_context_smoke',
      expect.objectContaining({
        browser_language: 'ar-AE',
        browser_languages: ['ar-AE', 'en-US', 'en'],
        landing_locale: 'en',
        site_locale: 'en',
      }),
    )

    window.history.pushState({}, '', '/ar/face-shape-detector')
    analytics.trackCustomEvent('language_context_after_navigation')

    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'language_context_after_navigation',
      expect.objectContaining({ landing_locale: 'en', site_locale: 'ar' }),
    )
  })

  it('captures the first Pricing locale and the Checkout locale independently', () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'de-DE' })
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['de-DE', 'en-US'] })
    window.history.pushState({}, '', '/de/pricing')

    expect(getAcquisitionContext()).toEqual(expect.objectContaining({
      pricing_locale: 'de',
      site_locale: 'de',
      browser_language: 'de-DE',
    }))

    window.history.pushState({}, '', '/en/face-analysis')
    expect(getCheckoutAttribution('en')).toEqual(expect.objectContaining({
      landing_locale: 'de',
      pricing_locale: 'de',
      site_locale: 'en',
      checkout_locale: 'en',
      browser_language: 'de-DE',
    }))
  })

  it('emits locale_changed and remains safe when browser language APIs are unavailable', () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'languages', { configurable: true, value: undefined })
    window.history.pushState({}, '', '/en/face-shape-detector')

    expect(() => trackLocaleChanged('en', 'ar')).not.toThrow()
    expect(window.gtag).toHaveBeenLastCalledWith(
      'event',
      'locale_changed',
      expect.objectContaining({
        from_locale: 'en',
        to_locale: 'ar',
        site_locale: 'ar',
        locale_changed: true,
      }),
    )
    expect(getAcquisitionContext()).toEqual(expect.objectContaining({ locale_changed: true }))
  })
})

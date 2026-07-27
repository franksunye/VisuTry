import { analytics } from '@/lib/analytics'

describe('analytics session attribution', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.dataLayer = []
    window.gtag = jest.fn()
  })

  it('preserves the first landing page and explicit growth source across events', () => {
    window.history.pushState({}, '', '/en/face-shape-detector?source=seo-cluster')
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
        landing_locale: 'en',
      }),
    )
  })
})

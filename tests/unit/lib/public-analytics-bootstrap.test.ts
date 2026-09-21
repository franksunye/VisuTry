import { resolvePublicAnalyticsBootstrap } from '@/lib/public-analytics-bootstrap'

describe('resolvePublicAnalyticsBootstrap', () => {
  it('uses GTM-only for a real container ID and ignores a sibling GA4 ID', () => {
    expect(resolvePublicAnalyticsBootstrap({
      gtmId: 'GTM-ABC123',
      gaId: 'G-6J4ZXNNL4F',
    })).toEqual({ mode: 'gtm', gtmId: 'GTM-ABC123' })
  })

  it('never treats a GA4 measurement ID as a GTM container', () => {
    expect(resolvePublicAnalyticsBootstrap({
      gtmId: 'G-6J4ZXNNL4F',
      gaId: 'G-6J4ZXNNL4F',
    })).toEqual({ mode: 'gtag', gaId: 'G-6J4ZXNNL4F' })
  })

  it('uses gtag-only when only a measurement ID is configured', () => {
    expect(resolvePublicAnalyticsBootstrap({
      gtmId: '',
      gaId: 'G-6J4ZXNNL4F',
    })).toEqual({ mode: 'gtag', gaId: 'G-6J4ZXNNL4F' })
  })

  it('returns none when neither ID is valid', () => {
    expect(resolvePublicAnalyticsBootstrap({
      gtmId: 'UA-123',
      gaId: 'not-an-id',
    })).toEqual({ mode: 'none' })
  })

  it('disables GA bootstrap in Local even when a valid measurement ID is present', () => {
    expect(resolvePublicAnalyticsBootstrap({
      appEnv: 'local',
      gaId: 'G-LOCALSHOULDNOTSEND',
    })).toEqual({ mode: 'none' })
  })

  it('disables GTM bootstrap in Local even when a valid container ID is present', () => {
    expect(resolvePublicAnalyticsBootstrap({
      appEnv: 'local',
      gtmId: 'GTM-LOCALSHOULDNOTSEND',
    })).toEqual({ mode: 'none' })
  })

  it('preserves remote bootstrap behavior for Production and Preview', () => {
    expect(resolvePublicAnalyticsBootstrap({ appEnv: 'production', gaId: 'G-PRODUCTION' })).toEqual({ mode: 'gtag', gaId: 'G-PRODUCTION' })
    expect(resolvePublicAnalyticsBootstrap({ appEnv: 'production', gtmId: 'GTM-PRODUCTION' })).toEqual({ mode: 'gtm', gtmId: 'GTM-PRODUCTION' })
    expect(resolvePublicAnalyticsBootstrap({ appEnv: 'preview', gaId: 'G-PREVIEW' })).toEqual({ mode: 'gtag', gaId: 'G-PREVIEW' })
    expect(resolvePublicAnalyticsBootstrap({ appEnv: 'preview', gtmId: 'GTM-PREVIEW' })).toEqual({ mode: 'gtm', gtmId: 'GTM-PREVIEW' })
  })
})

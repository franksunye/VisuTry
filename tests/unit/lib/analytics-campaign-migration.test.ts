import {
  analytics,
  getAcquisitionContext,
  setGrowthContext,
} from '@/lib/analytics'
import { AnalyticsEvent, ANALYTICS_SCHEMA_VERSION } from '@/lib/analytics-events'
import { setCampaignAnalyticsContext } from '@/lib/analytics-v2'

describe('campaign intelligence analytics migration', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.dataLayer = []
    window.gtag = jest.fn()
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    })
    window.history.pushState({}, '', '/en/try-on/glasses')
  })

  it('routes legacy try-on APIs to canonical events without dual-write', () => {
    analytics.trackTryOnStart('free', 3, undefined, undefined, 'single')
    analytics.trackTryOnComplete('free', 1200, true, 'single')
    analytics.trackTryOnComplete('free', 800, false, 'single')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnStarted,
      expect.objectContaining({
        analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
        try_on_type: 'single',
        product_path: 'virtual_try_on',
      }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnCompleted,
      expect.objectContaining({ success: true }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnFailed,
      expect.objectContaining({ success: false }),
    )

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain('try_on_start')
    expect(eventNames).not.toContain('try_on_complete')
  })

  it('migrates face analysis APIs to canonical names', () => {
    analytics.trackFaceAnalysisStart('credits', 2)
    analytics.trackFaceAnalysisUpload('image/jpeg', 1024, 'credits')
    analytics.trackFaceAnalysisComplete('oval', 0.91, 1500, 'credits')
    analytics.trackFaceAnalysisFailed('no face detected', 'credits')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceAnalysisStarted,
      expect.objectContaining({ analytics_schema_version: ANALYTICS_SCHEMA_VERSION }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceAnalysisPhotoUploaded,
      expect.objectContaining({ photo_source: 'upload' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceAnalysisCompleted,
      expect.objectContaining({ face_shape: 'oval' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceAnalysisFailed,
      expect.objectContaining({ error_message: 'no face detected' }),
    )

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain('face_analysis_start')
    expect(eventNames).not.toContain('face_analysis_upload')
    expect(eventNames).not.toContain('face_analysis_complete')
  })

  it('migrates compare APIs and computes completion_status', () => {
    analytics.trackFrameCompareStart(4, 8)
    analytics.trackFrameCompareComplete({
      frameCount: 4,
      completedCount: 3,
      failedCount: 1,
      processingTimeMs: 4000,
    })

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.ComparisonCreated,
      expect.objectContaining({ frame_count: 4 }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.ComparisonCompleted,
      expect.objectContaining({
        completion_status: 'partial',
        completed_count: 3,
        failed_count: 1,
      }),
    )

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain('frame_compare_start')
    expect(eventNames).not.toContain('frame_compare_complete')
  })

  it('injects campaign context and acquisition fields once per emission', () => {
    window.history.pushState(
      {},
      '',
      '/en/try-on/glasses?utm_source=google&utm_medium=organic&campaign_id=cmp_demo&merchant_id=m_1&store_id=s_1',
    )
    setGrowthContext({ product_path: 'virtual_try_on' })
    setCampaignAnalyticsContext({ entry_point: 'campaign' })

    analytics.trackCustomEvent('smoke_event', { foo: 'bar' })

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'smoke_event',
      expect.objectContaining({
        analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
        campaign_id: 'cmp_demo',
        merchant_id: 'm_1',
        store_id: 's_1',
        entry_point: 'campaign',
        surface: expect.any(String),
        acquisition_source: 'google',
        acquisition_medium: 'organic',
        landing_locale: expect.any(String),
        browser_language: expect.any(String),
        foo: 'bar',
      }),
    )
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual(
      expect.objectContaining({
        event: 'smoke_event',
        analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
      }),
    )
  })

  it('still exposes acquisition snapshots for checkout attribution', () => {
    window.history.pushState({}, '', '/en/pricing?utm_source=newsletter&utm_medium=email')
    setGrowthContext({ product_path: 'credits_pack' })

    expect(getAcquisitionContext()).toEqual(
      expect.objectContaining({
        acquisition_source: 'newsletter',
        acquisition_medium: 'email',
        product_path: 'credits_pack',
      }),
    )
  })
})

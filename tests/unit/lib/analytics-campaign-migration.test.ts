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
      expect.objectContaining({ failure_reason: 'no_face' }),
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

  it('migrates face shape detector APIs to canonical events and journey_continued', () => {
    analytics.trackFaceShapeDetectorStart()
    analytics.trackFaceShapeDetectorUpload('image/jpeg', 2048)
    analytics.trackFaceShapeDetectorComplete('oval', 0.88, 900)
    analytics.trackFaceShapeDetectorFailed('no face')
    analytics.trackFaceShapeDetectorCta('oval', 'face_analysis')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceShapeDetectionStarted,
      expect.objectContaining({ analysis_mode: 'on_device_detector' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceShapePhotoUploaded,
      expect.objectContaining({ file_type: 'image/jpeg' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceShapeDetectionCompleted,
      expect.objectContaining({ face_shape: 'oval' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceShapeDetectionFailed,
      expect.objectContaining({ failure_reason: 'no_face' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.JourneyContinued,
      expect.objectContaining({
        source_journey: 'face_shape_detection',
        destination: 'face_analysis',
        face_shape: 'oval',
      }),
    )

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain('face_shape_detector_start')
    expect(eventNames).not.toContain('face_shape_detector_upload')
    expect(eventNames).not.toContain('face_shape_detector_complete')
    expect(eventNames).not.toContain('face_shape_detector_failed')
    expect(eventNames).not.toContain('face_shape_detector_cta_click')
    expect(eventNames).not.toContain(AnalyticsEvent.FaceAnalysisStarted)
  })

  it('keeps VisuTry /store marketing LP on B2B acquisition taxonomy', () => {
    analytics.trackStoreLandingViewed({
      locale: 'en',
      landingSurface: 'store_marketing',
    })
    analytics.trackStoreCtaClicked({
      locale: 'en',
      ctaLocation: 'hero_primary',
      href: '/en/store#lead',
      intentType: 'request_demo',
      productCategory: 'store_solution',
    })
    analytics.trackStoreLeadFormStarted({ locale: 'en' })
    analytics.trackStoreLeadCreated({
      locale: 'en',
      businessType: 'opticalStore',
      intent: 'demo',
      frameCount: '8-20',
      leadType: 'demo',
    })

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.B2bLandingViewed,
      expect.objectContaining({
        actor_type: 'merchant_prospect',
        journey_type: 'visutry_b2b_acquisition',
        landing_surface: 'store_marketing',
        entry_point: 'b2b',
      }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.B2bSalesIntentClicked,
      expect.objectContaining({
        intent_type: 'request_demo',
        product_category: 'store_solution',
        actor_type: 'merchant_prospect',
      }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.B2bLeadFormStarted,
      expect.objectContaining({ journey_type: 'visutry_b2b_acquisition' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.B2bLeadCreated,
      expect.objectContaining({
        lead_type: 'demo',
        user_intent: 'demo',
        business_type: 'opticalStore',
      }),
    )

    const payloads = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[2] as Record<string, unknown>)
    for (const payload of payloads) {
      expect(payload).not.toHaveProperty('href')
      expect(payload.surface).not.toBe('merchant_store')
    }

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain(AnalyticsEvent.CampaignLanded)
    expect(eventNames).not.toContain(AnalyticsEvent.PurchaseIntentClicked)
    expect(eventNames).not.toContain(AnalyticsEvent.CampaignEngaged)
    expect(eventNames).not.toContain(AnalyticsEvent.LeadCreated)
  })

  it('does not invent campaign_id from utm_campaign', () => {
    window.history.pushState(
      {},
      '',
      '/en/try-on/glasses?utm_source=meta&utm_medium=paid&utm_campaign=summer_glasses_2026',
    )

    analytics.trackCustomEvent('attribution_smoke')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'attribution_smoke',
      expect.objectContaining({
        campaign_name: 'summer_glasses_2026',
        acquisition_source: 'meta',
        acquisition_medium: 'paid',
      }),
    )
    const payload = (window.gtag as jest.Mock).mock.calls.at(-1)?.[2] as Record<string, unknown>
    expect(payload.campaign_id).toBeUndefined()
  })

  it('keeps Merchant onboarding events out of the Consumer funnel', () => {
    window.history.pushState({}, '', '/en/merchant')
    window.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)

    analytics.trackCustomEvent(AnalyticsEvent.MerchantOnboardingStarted, {
      entry_point: 'b2b',
      actor_type: 'merchant_prospect',
      journey_type: 'visutry_b2b_acquisition',
    })

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.MerchantOnboardingStarted,
      expect.objectContaining({ entry_point: 'b2b', actor_type: 'merchant_prospect' }),
    )
    expect(window.fetch).not.toHaveBeenCalled()
  })

  it('migrates style explorer core funnel to recommendation/try-on events', () => {
    analytics.trackStyleExplorerViewed()
    analytics.trackStyleExplorerFramesRecommended({
      styleIntent: 'minimal',
      category: 'metal',
      occasion: 'work',
      presetIds: ['a', 'b', 'c', 'd'],
    })
    analytics.trackStyleExplorerGenerationStarted({
      batchId: 'batch-1',
      presetIds: ['a', 'b', 'c', 'd'],
      styleIntent: 'minimal',
      occasion: 'work',
      category: 'metal',
    })
    analytics.trackStyleExplorerGenerationFinished({
      batchId: 'batch-1',
      completedCount: 3,
      failedCount: 1,
    })
    analytics.trackStyleExplorerShareCompleted('task-1')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.CampaignEngaged,
      expect.objectContaining({ engagement_type: 'style_explorer_viewed' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.RecommendationViewed,
      expect.objectContaining({
        frame_category: 'metal',
        style_count: 4,
        recommendation_count: 4,
      }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnStarted,
      expect.objectContaining({
        try_on_type: 'style_explorer',
        recommendation_count: 4,
      }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnCompleted,
      expect.objectContaining({ completion_status: 'partial', success: true }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.TryOnShared,
      expect.objectContaining({ task_id: 'task-1' }),
    )

    const stylePayloads = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[2] as Record<string, unknown>)
    for (const payload of stylePayloads) {
      expect(payload).not.toHaveProperty('preset_ids')
    }
  })

  it('migrates paywall commerce signals without dual checkout naming', () => {
    analytics.trackPaywallViewed({ source: 'try_on', product_type: 'CREDITS_PACK' })
    analytics.trackCreditsPurchaseClick({ source: 'try_on', value: 2.99 })
    analytics.trackPaywallCheckoutStarted({
      source: 'try_on',
      productType: 'CREDITS_PACK',
      checkoutSessionId: 'cs_test',
      value: 2.99,
    })
    analytics.trackPaywallCheckoutReturnVerified({
      source: 'try_on',
      checkout_session_id: 'cs_test',
    })

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.PaywallViewed,
      expect.objectContaining({ source: 'try_on' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.PurchaseIntentClicked,
      expect.objectContaining({ intent_type: 'credits_pack' }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'begin_checkout',
      expect.objectContaining({ checkout_session_id: 'cs_test', value: 2.99 }),
    )
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'checkout_return_verified',
      expect.objectContaining({ checkout_session_id: 'cs_test' }),
    )

    const eventNames = (window.gtag as jest.Mock).mock.calls
      .filter((call) => call[0] === 'event')
      .map((call) => call[1])
    expect(eventNames).not.toContain('paywall_view')
    expect(eventNames).not.toContain('credits_purchase_click')
    expect(eventNames).not.toContain('checkout_started')
    expect(eventNames).not.toContain('checkout_completed')
    expect(eventNames).not.toContain('purchase')
  })

  it('tags detector handoff uploads with photo_source=detector_handoff', () => {
    analytics.trackFaceAnalysisUpload('image/jpeg', 1024, 'free', 'detector_handoff')

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      AnalyticsEvent.FaceAnalysisPhotoUploaded,
      expect.objectContaining({ photo_source: 'detector_handoff' }),
    )
  })
})

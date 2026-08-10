/**
 * VisuTry Analytics API (legacy-compatible facade)
 *
 * Public methods stay stable for feature components.
 * Transport and campaign context live in analytics-v2 (Campaign Event Layer).
 *
 * Pipeline:
 *   Component → analytics.ts → analytics-v2.ts → GA4 + dataLayer
 *
 * Every event automatically receives:
 * - analytics_schema_version=2
 * - campaign_id / merchant_id / store_id / surface / entry_point (when available)
 * - landing_page / acquisition_* / landing_locale / browser_language
 */

export type UserType = 'anonymous' | 'free' | 'premium' | 'credits'

export type EventSource =
  | 'nav'
  | 'dashboard'
  | 'try_on'
  | 'pricing'
  | 'error_modal'
  | 'direct'
  | 'face_analysis'
  | 'blog'

export type UpgradeLocation = 'quick_actions' | 'subscription_card' | 'nav'

export type { ProductType } from '@/config/pricing'
import type { ProductType } from '@/config/pricing'
import type { AcquisitionAttribution } from '@/lib/acquisition-attribution'
import { sanitizeAcquisitionAttribution } from '@/lib/acquisition-attribution'
import { AnalyticsEvent } from '@/lib/analytics-events'
import { setCampaignAnalyticsContext, trackCampaignEvent } from '@/lib/analytics-v2'

const LANDING_PAGE_KEY = 'visutry_landing_page'
const ACQUISITION_SOURCE_KEY = 'visutry_acquisition_source'
const ACQUISITION_MEDIUM_KEY = 'visutry_acquisition_medium'
const GROWTH_CONTEXT_KEY = 'visutry_growth_context'

export type AcquisitionContext = {
  landing_page: string
  page_path: string
  acquisition_source?: string
  acquisition_medium?: string
  source_page?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
  landing_locale?: string
}

type GrowthContext = {
  source_page?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
}

function getLandingLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language || 'en'
}

function inferReferrerAttribution(): { source?: string; medium?: string } {
  if (typeof document === 'undefined' || typeof window === 'undefined') return {}

  try {
    if (!document.referrer) return { source: 'direct', medium: 'none' }
    const referrer = new URL(document.referrer)
    if (referrer.origin === window.location.origin) return {}

    const host = referrer.hostname.replace(/^www\./, '')
    const organicHosts = [
      'google.com',
      'bing.com',
      'yahoo.com',
      'duckduckgo.com',
      'yandex.com',
      'yandex.ru',
      'baidu.com',
    ]
    const isOrganic = organicHosts.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    )

    return {
      source: host,
      medium: isOrganic ? 'organic' : 'referral',
    }
  } catch {
    return {}
  }
}

function readGrowthContext(): GrowthContext {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.sessionStorage.getItem(GROWTH_CONTEXT_KEY)
    if (!raw) return {}
    const parsed = sanitizeAcquisitionAttribution(JSON.parse(raw))
    if (!parsed) return {}
    return {
      ...(parsed.source_page ? { source_page: parsed.source_page } : {}),
      ...(parsed.query_cluster ? { query_cluster: parsed.query_cluster } : {}),
      ...(parsed.content_cluster ? { content_cluster: parsed.content_cluster } : {}),
      ...(parsed.product_path ? { product_path: parsed.product_path } : {}),
    }
  } catch {
    return {}
  }
}

/** Persist internal funnel context. This must never overwrite acquisition source. */
export function setGrowthContext(context: GrowthContext) {
  if (typeof window === 'undefined') return

  try {
    const next = sanitizeAcquisitionAttribution({
      ...readGrowthContext(),
      ...context,
    })
    if (!next) return
    window.sessionStorage.setItem(
      GROWTH_CONTEXT_KEY,
      JSON.stringify({
        ...(next.source_page ? { source_page: next.source_page } : {}),
        ...(next.query_cluster ? { query_cluster: next.query_cluster } : {}),
        ...(next.content_cluster ? { content_cluster: next.content_cluster } : {}),
        ...(next.product_path ? { product_path: next.product_path } : {}),
      }),
    )
  } catch {
    // Analytics must never block UX.
  }
}

/**
 * Preserve first-touch acquisition separately from internal continuation.
 * UTM values win on entry; otherwise use the external referrer, then direct.
 * Once stored for the browser session, acquisition source/medium are frozen.
 */
function getSessionAttribution(): AcquisitionContext {
  if (typeof window === 'undefined') {
    return { landing_page: '/', page_path: '/' }
  }

  const pagePath = window.location.pathname
  const landingLocale = getLandingLocale()

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const storedLandingPage = window.sessionStorage.getItem(LANDING_PAGE_KEY)
    const storedAcquisitionSource = window.sessionStorage.getItem(ACQUISITION_SOURCE_KEY)
    const storedAcquisitionMedium = window.sessionStorage.getItem(ACQUISITION_MEDIUM_KEY)

    if (!storedLandingPage) {
      window.sessionStorage.setItem(LANDING_PAGE_KEY, pagePath)
    }

    let acquisitionSource = storedAcquisitionSource || undefined
    let acquisitionMedium = storedAcquisitionMedium || undefined

    if (!storedAcquisitionSource) {
      const utmSource = searchParams.get('utm_source') || undefined
      const utmMedium = searchParams.get('utm_medium') || undefined
      const inferred = inferReferrerAttribution()
      acquisitionSource = utmSource || inferred.source
      acquisitionMedium = utmMedium || inferred.medium

      if (acquisitionSource) {
        window.sessionStorage.setItem(ACQUISITION_SOURCE_KEY, acquisitionSource)
      }
      if (acquisitionMedium) {
        window.sessionStorage.setItem(ACQUISITION_MEDIUM_KEY, acquisitionMedium)
      }
    }

    const growthContext = readGrowthContext()

    return {
      landing_page: storedLandingPage || pagePath,
      page_path: pagePath,
      landing_locale: landingLocale,
      ...(acquisitionSource ? { acquisition_source: acquisitionSource } : {}),
      ...(acquisitionMedium ? { acquisition_medium: acquisitionMedium } : {}),
      ...growthContext,
    }
  } catch {
    return {
      landing_page: pagePath,
      page_path: pagePath,
      landing_locale: landingLocale,
    }
  }
}

export function getAcquisitionContext(): AcquisitionContext {
  return getSessionAttribution()
}

function sendEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') return

  // Route through Campaign Event Layer — single emission to GA4 + dataLayer.
  trackCampaignEvent(eventName, {
    ...getSessionAttribution(),
    landing_locale: getLandingLocale(),
    browser_language: getBrowserLanguage(),
    ...parameters,
  })
}

function resolveComparisonCompletionStatus(
  frameCount: number,
  completedCount: number,
  failedCount: number,
): 'full' | 'partial' | 'failed' {
  if (completedCount === frameCount && frameCount > 0) return 'full'
  if (completedCount > 0 && failedCount > 0) return 'partial'
  if (completedCount === 0) return 'failed'
  // All requested frames completed but failedCount is 0 and counts may differ
  // (e.g. completed_count < frame_count with no failures recorded yet).
  if (completedCount > 0 && completedCount < frameCount) return 'partial'
  return 'full'
}

export function setLanguageUserProperties() {
  if (typeof window === 'undefined') return
  if (!window.gtag) return

  const landingLocale = getLandingLocale()
  const browserLanguage = getBrowserLanguage()

  window.gtag('set', 'user_properties', {
    landing_locale: landingLocale,
    browser_language: browserLanguage,
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 GA4 User Properties set:', { landing_locale: landingLocale, browser_language: browserLanguage })
  }
}

export const analytics = {
  trackCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
    sendEvent(eventName, parameters)
  },

  trackLogin(method: string, isNewUser: boolean, isPremium: boolean) {
    sendEvent('login_success', {
      method,
      user_type: isNewUser ? 'new' : 'returning',
      has_premium: isPremium,
    })
  },

  trackFirstTryOn(userId: string, timeSinceSignup: number) {
    sendEvent('first_try_on', {
      user_id: userId,
      time_since_signup: timeSinceSignup,
    })
  },

  trackTryOnStart(userType: UserType, remainingQuota: number, glassesId?: string, glassesName?: string, tryOnType?: string) {
    sendEvent(AnalyticsEvent.TryOnStarted, {
      user_type: userType,
      remaining_quota: remainingQuota,
      glasses_id: glassesId,
      glasses_name: glassesName,
      try_on_type: tryOnType,
      product_path: 'virtual_try_on',
    })
  },

  /**
   * Legacy API kept for call-site compatibility.
   * Internally emits tryon_completed or tryon_failed (never mixed-outcome try_on_complete).
   */
  trackTryOnComplete(
    userType: UserType,
    processingTime: number,
    success: boolean,
    tryOnType?: string,
  ) {
    sendEvent(success ? AnalyticsEvent.TryOnCompleted : AnalyticsEvent.TryOnFailed, {
      user_type: userType,
      processing_time: processingTime,
      success,
      ...(tryOnType ? { try_on_type: tryOnType } : {}),
      product_path: 'virtual_try_on',
    })
  },

  trackFrameCompareStart(frameCount: number, remainingCredits: number) {
    sendEvent(AnalyticsEvent.ComparisonCreated, {
      frame_count: frameCount,
      remaining_credits: remainingCredits,
      product_path: 'frame_compare',
    })
  },

  trackFrameCompareComplete({
    frameCount,
    completedCount,
    failedCount,
    processingTimeMs,
  }: {
    frameCount: number
    completedCount: number
    failedCount: number
    processingTimeMs: number
  }) {
    sendEvent(AnalyticsEvent.ComparisonCompleted, {
      frame_count: frameCount,
      completed_count: completedCount,
      failed_count: failedCount,
      processing_time_ms: processingTimeMs,
      completion_status: resolveComparisonCompletionStatus(frameCount, completedCount, failedCount),
      success: completedCount > 0,
      product_path: 'frame_compare',
    })
  },

  trackQuotaExhaustedCTA(source: EventSource, userType: UserType) {
    sendEvent('quota_exhausted_cta', {
      source,
      user_type: userType,
      remaining_quota: 0,
    })
  },

  trackViewPricing(source: EventSource, userType: UserType, remainingQuota: number) {
    sendEvent('view_pricing', {
      source,
      user_type: userType,
      remaining_quota: remainingQuota,
    })
  },

  trackClickPurchase(planType: ProductType, planPrice: number, userType: UserType, sourcePage: string) {
    sendEvent('click_purchase_button', {
      plan_type: planType,
      plan_price: planPrice,
      user_type: userType,
      source_page: sourcePage,
    })
  },

  trackUpgradeClick(location: UpgradeLocation, userType: UserType, remainingQuota: number, quotaWarning: boolean = false) {
    sendEvent('click_upgrade_button', {
      location,
      user_type: userType,
      remaining_quota: remainingQuota,
      quota_warning: quotaWarning,
    })
  },

  trackViewPaymentHistory(userType: UserType, hasPayments: boolean) {
    sendEvent('view_payment_history', {
      user_type: userType,
      has_payments: hasPayments,
    })
  },

  trackBeginCheckout(
    planType: ProductType,
    value: number,
    context?: {
      checkoutSessionId?: string
      purchaseContext?: 'pricing' | 'face_analysis_report'
      faceAnalysisTaskId?: string
    },
  ) {
    const isReportUnlock = context?.purchaseContext === 'face_analysis_report'
    sendEvent('begin_checkout', {
      currency: 'USD',
      value,
      ...(context?.checkoutSessionId ? { checkout_session_id: context.checkoutSessionId } : {}),
      ...(context?.purchaseContext ? { purchase_context: context.purchaseContext } : {}),
      ...(context?.faceAnalysisTaskId ? { face_analysis_task_id: context.faceAnalysisTaskId } : {}),
      items: [{
        item_id: planType,
        item_name: isReportUnlock ? 'Personalized Glasses Advisor Report' : planType,
        price: value,
      }],
    })
  },

  trackPurchase(
    transactionId: string,
    planType: ProductType,
    value: number,
    attribution?: AcquisitionAttribution,
    context?: {
      purchaseContext?: 'pricing' | 'face_analysis_report'
      faceAnalysisTaskId?: string
    },
  ) {
    const verifiedAttribution = sanitizeAcquisitionAttribution(attribution)
    const isReportUnlock = context?.purchaseContext === 'face_analysis_report'
    sendEvent('purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      ...(context?.purchaseContext ? { purchase_context: context.purchaseContext } : {}),
      ...(context?.faceAnalysisTaskId ? { face_analysis_task_id: context.faceAnalysisTaskId } : {}),
      items: [{
        item_id: planType,
        item_name: isReportUnlock ? 'Personalized Glasses Advisor Report' : planType,
        price: value,
      }],
      ...(verifiedAttribution || {}),
    })
  },

  trackCheckoutCancelled(planType: ProductType, value: number) {
    sendEvent('checkout_cancelled', {
      plan_type: planType,
      value,
    })
  },

  trackFaceAnalysisStart(userType: UserType, remainingQuota: number) {
    sendEvent(AnalyticsEvent.FaceAnalysisStarted, {
      user_type: userType,
      remaining_quota: remainingQuota,
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisUpload(fileType: string, fileSizeBytes: number, userType: UserType) {
    sendEvent(AnalyticsEvent.FaceAnalysisPhotoUploaded, {
      file_type: fileType,
      file_size_bytes: fileSizeBytes,
      user_type: userType,
      photo_source: 'upload',
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisComplete(
    faceShape: string,
    confidence: number,
    processingTimeMs: number,
    userType: UserType
  ) {
    sendEvent(AnalyticsEvent.FaceAnalysisCompleted, {
      face_shape: faceShape,
      confidence,
      processing_time_ms: processingTimeMs,
      user_type: userType,
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisFailed(errorMessage: string, userType: UserType) {
    sendEvent(AnalyticsEvent.FaceAnalysisFailed, {
      error_message: errorMessage.slice(0, 200),
      user_type: userType,
      product_path: 'face_analysis',
    })
  },

  trackFaceShapeDetectorUpload(fileType: string, fileSizeBytes: number) {
    sendEvent(AnalyticsEvent.FaceShapePhotoUploaded, {
      file_type: fileType,
      file_size_bytes: fileSizeBytes,
      processing_mode: 'on_device',
      analysis_mode: 'on_device_detector',
      product_path: 'face_shape_detector',
    })
  },

  trackFaceShapeDetectorStart() {
    sendEvent(AnalyticsEvent.FaceShapeDetectionStarted, {
      processing_mode: 'on_device',
      analysis_mode: 'on_device_detector',
      product_path: 'face_shape_detector',
    })
  },

  trackFaceShapeDetectorComplete(
    faceShape: string,
    qualityScore: number,
    processingTimeMs: number,
  ) {
    sendEvent(AnalyticsEvent.FaceShapeDetectionCompleted, {
      face_shape: faceShape,
      quality_score: qualityScore,
      processing_time_ms: processingTimeMs,
      processing_mode: 'on_device',
      analysis_mode: 'on_device_detector',
      product_path: 'face_shape_detector',
    })
  },

  trackFaceShapeDetectorFailed(reason: string) {
    sendEvent(AnalyticsEvent.FaceShapeDetectionFailed, {
      failure_reason: reason.slice(0, 200),
      processing_mode: 'on_device',
      analysis_mode: 'on_device_detector',
      product_path: 'face_shape_detector',
    })
  },

  /**
   * CTA from Free Face Shape Result — journey continuation only.
   * Does NOT fire face_analysis_started (that happens when analysis actually begins).
   */
  trackFaceShapeDetectorCta(
    faceShape: string,
    destination: 'face_analysis' | 'glasses_advisor' | 'virtual_try_on' | 'frame_compare' | 'face_shape_guide',
  ) {
    const productPath = destination === 'face_shape_guide' ? undefined : destination

    if (productPath) {
      setGrowthContext({ product_path: productPath })
    }

    sendEvent(AnalyticsEvent.JourneyContinued, {
      source_journey: 'face_shape_detection',
      from_stage: 'face_shape_detection',
      destination,
      face_shape: faceShape,
      ...(productPath ? { product_path: productPath } : {}),
    })
  },

  trackFaceShapeDetectorPhotoHandoff(
    faceShape: string,
    status: 'stored' | 'fallback',
  ) {
    // Operational transition — keep dedicated name for reliability diagnosis.
    sendEvent('face_shape_detector_photo_handoff', {
      face_shape: faceShape,
      status,
      storage: status === 'stored' ? 'indexed_db' : 'unavailable',
      source_journey: 'face_shape_detection',
    })
  },

  trackStoreLandingViewed(params: {
    locale: string
    campaignId?: string
    merchantId?: string
    storeId?: string
    landingSurface?: string
  }) {
    setCampaignAnalyticsContext({
      entry_point: 'store',
      surface: 'merchant_store',
      ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
      ...(params.merchantId ? { merchant_id: params.merchantId } : {}),
      ...(params.storeId ? { store_id: params.storeId } : {}),
    })

    sendEvent(AnalyticsEvent.CampaignLanded, {
      source: 'store_landing',
      locale: params.locale,
      landing_surface: params.landingSurface || 'store_marketing',
      entry_point: 'store',
      ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
      ...(params.merchantId ? { merchant_id: params.merchantId } : {}),
      ...(params.storeId ? { store_id: params.storeId } : {}),
    })
  },

  trackStoreCtaClicked(params: {
    locale: string
    ctaLocation: string
    href: string
    intentType?: string
    productCategory?: string
    merchantId?: string
  }) {
    sendEvent(AnalyticsEvent.PurchaseIntentClicked, {
      source: 'store_landing',
      locale: params.locale,
      cta_location: params.ctaLocation,
      href: params.href,
      intent_type: params.intentType || params.ctaLocation,
      ...(params.productCategory ? { product_category: params.productCategory } : {}),
      ...(params.merchantId ? { merchant_id: params.merchantId } : {}),
      entry_point: 'store',
    })
  },

  trackStoreLeadFormStarted(params: { locale: string }) {
    sendEvent(AnalyticsEvent.CampaignEngaged, {
      source: 'store_landing',
      locale: params.locale,
      engagement_type: 'lead_form_started',
      entry_point: 'store',
    })
  },

  trackStoreLeadCreated(params: {
    locale: string
    businessType: string
    intent: string
    frameCount?: string
    campaignId?: string
    merchantId?: string
    storeId?: string
    leadType?: string
  }) {
    sendEvent(AnalyticsEvent.LeadCreated, {
      source: 'store_landing',
      locale: params.locale,
      business_type: params.businessType,
      user_intent: params.intent,
      lead_type: params.leadType || params.intent,
      ...(params.frameCount ? { frame_count: params.frameCount } : {}),
      ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
      ...(params.merchantId ? { merchant_id: params.merchantId } : {}),
      ...(params.storeId ? { store_id: params.storeId } : {}),
      entry_point: 'store',
    })
  },

  trackFaceAnalysisPhotoHandoffRestored(faceShape: string | null) {
    sendEvent('face_analysis_photo_handoff_restored', {
      source: 'free_face_shape_detector',
      ...(faceShape ? { face_shape: faceShape } : {}),
    })
  },

  trackFaceAnalysisUnlockClick(faceShape: string, source: EventSource = 'face_analysis') {
    sendEvent('face_analysis_unlock_click', {
      face_shape: faceShape,
      source,
    })
  },

  trackFaceAnalysisUnlockSuccess(taskId: string) {
    sendEvent('face_analysis_unlock_success', {
      task_id: taskId,
    })
  },

  trackFaceAnalysisFrameSearch(faceShape: string, style: string, query: string) {
    sendEvent('face_analysis_frame_search', {
      face_shape: faceShape,
      style,
      query,
    })
  },

  trackTryOnFromFaceAnalysis(
    faceAnalysisTaskId: string,
    styleCount: number,
    requiredCredits: number,
    action: 'open_try_on' | 'generate_top_picks' = 'generate_top_picks'
  ) {
    sendEvent('try_on_from_face_analysis', {
      face_analysis_task_id: faceAnalysisTaskId,
      style_count: styleCount,
      required_credits: requiredCredits,
      continuation_action: action,
    })
  },

  trackFaceAnalysisTopPicksStart(
    faceAnalysisTaskId: string,
    styleCount: number,
    requiredCredits: number,
    mode: 'generate' | 'complete',
  ) {
    // Keep the established continuation event for existing dashboards while
    // adding a dedicated activation event for the paid Analysis funnel.
    sendEvent('try_on_from_face_analysis', {
      face_analysis_task_id: faceAnalysisTaskId,
      style_count: styleCount,
      required_credits: requiredCredits,
      continuation_action: 'generate_top_picks',
      generation_mode: mode,
    })
    sendEvent('face_analysis_top_picks_start', {
      face_analysis_task_id: faceAnalysisTaskId,
      style_count: styleCount,
      required_credits: requiredCredits,
      generation_mode: mode,
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisTopPicksPricingClick(
    faceAnalysisTaskId: string,
    requiredCredits: number,
    mode: 'generate' | 'complete',
  ) {
    sendEvent('face_analysis_top_picks_pricing_click', {
      face_analysis_task_id: faceAnalysisTaskId,
      required_credits: requiredCredits,
      generation_mode: mode,
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisTopPicksComplete({
    faceAnalysisTaskId,
    batchId,
    completedCount,
    failedCount,
    processingTimeMs,
  }: {
    faceAnalysisTaskId: string
    batchId: string
    completedCount: number
    failedCount: number
    processingTimeMs: number
  }) {
    sendEvent('face_analysis_top_picks_complete', {
      face_analysis_task_id: faceAnalysisTaskId,
      batch_id: batchId,
      completed_count: completedCount,
      failed_count: failedCount,
      processing_time_ms: processingTimeMs,
      success: completedCount === 4,
      product_path: 'face_analysis',
    })
  },

  trackFaceAnalysisExploreMoreStyles(faceAnalysisTaskId: string, batchId?: string) {
    sendEvent('face_analysis_explore_more_styles_click', {
      face_analysis_task_id: faceAnalysisTaskId,
      ...(batchId ? { batch_id: batchId } : {}),
      product_path: 'face_analysis',
    })
  },

  trackBlogFunnelClick({
    sourcePage,
    destination,
    ctaLocation,
    locale,
  }: {
    sourcePage: string
    destination: 'face_shape_detector' | 'face_analysis' | 'glasses_try_on' | 'glasses_for_face_shape'
    ctaLocation: string
    locale: string
  }) {
    sendEvent('blog_funnel_click', {
      source: 'blog',
      source_page: sourcePage,
      destination,
      cta_location: ctaLocation,
      locale,
    })
  },
}

export function getUserType(isPremiumActive: boolean, creditsRemaining: number, isAuthenticated: boolean): UserType {
  if (!isAuthenticated) return 'anonymous'
  if (isPremiumActive) return 'premium'
  if (creditsRemaining > 0) return 'credits'
  return 'free'
}

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void
    dataLayer: Array<Record<string, any>>
  }
}

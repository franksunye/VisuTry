/**
 * 统一的 Google Analytics 追踪工具
 * 提供类型安全的事件追踪接口
 *
 * 语言维度策略：
 * 每个事件自动注入两个 GA4 自定义维度：
 * - landing_locale: 用户当前浏览的页面语言（从 <html lang> 读取，服务端静态输出）
 * - browser_language: 浏览器首选语言（navigator.language）
 *
 * 这使得所有核心业务漏斗事件都可以按语言拆分分析，
 * 无需在各调用方手动传参。
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

  const enrichedParameters: Record<string, any> = {
    ...getSessionAttribution(),
    landing_locale: getLandingLocale(),
    browser_language: getBrowserLanguage(),
    ...parameters,
  }

  if (window.gtag) {
    window.gtag('event', eventName, enrichedParameters)
  }

  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...enrichedParameters,
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, enrichedParameters)
  }
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
    sendEvent('try_on_start', {
      user_type: userType,
      remaining_quota: remainingQuota,
      glasses_id: glassesId,
      glasses_name: glassesName,
      try_on_type: tryOnType,
      product_path: 'virtual_try_on',
    })
  },

  trackTryOnComplete(
    userType: UserType,
    processingTime: number,
    success: boolean,
    tryOnType?: string,
  ) {
    sendEvent('try_on_complete', {
      user_type: userType,
      processing_time: processingTime,
      success,
      ...(tryOnType ? { try_on_type: tryOnType } : {}),
      product_path: 'virtual_try_on',
    })
  },

  trackFrameCompareStart(frameCount: number, remainingCredits: number) {
    sendEvent('frame_compare_start', {
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
    sendEvent('frame_compare_complete', {
      frame_count: frameCount,
      completed_count: completedCount,
      failed_count: failedCount,
      processing_time_ms: processingTimeMs,
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

  trackBeginCheckout(planType: ProductType, value: number) {
    sendEvent('begin_checkout', {
      currency: 'USD',
      value,
      items: [{
        item_id: planType,
        item_name: planType,
        price: value,
      }],
    })
  },

  trackPurchase(
    transactionId: string,
    planType: ProductType,
    value: number,
    attribution?: AcquisitionAttribution,
  ) {
    const verifiedAttribution = sanitizeAcquisitionAttribution(attribution)
    sendEvent('purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      items: [{
        item_id: planType,
        item_name: planType,
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
    sendEvent('face_analysis_start', {
      user_type: userType,
      remaining_quota: remainingQuota,
    })
  },

  trackFaceAnalysisUpload(fileType: string, fileSizeBytes: number, userType: UserType) {
    sendEvent('face_analysis_upload', {
      file_type: fileType,
      file_size_bytes: fileSizeBytes,
      user_type: userType,
    })
  },

  trackFaceAnalysisComplete(
    faceShape: string,
    confidence: number,
    processingTimeMs: number,
    userType: UserType
  ) {
    sendEvent('face_analysis_complete', {
      face_shape: faceShape,
      confidence,
      processing_time_ms: processingTimeMs,
      user_type: userType,
    })
  },

  trackFaceAnalysisFailed(errorMessage: string, userType: UserType) {
    sendEvent('face_analysis_failed', {
      error_message: errorMessage.slice(0, 200),
      user_type: userType,
    })
  },

  trackFaceShapeDetectorUpload(fileType: string, fileSizeBytes: number) {
    sendEvent('face_shape_detector_upload', {
      file_type: fileType,
      file_size_bytes: fileSizeBytes,
      processing_mode: 'on_device',
    })
  },

  trackFaceShapeDetectorStart() {
    sendEvent('face_shape_detector_start', {
      processing_mode: 'on_device',
    })
  },

  trackFaceShapeDetectorComplete(
    faceShape: string,
    qualityScore: number,
    processingTimeMs: number,
  ) {
    sendEvent('face_shape_detector_complete', {
      face_shape: faceShape,
      quality_score: qualityScore,
      processing_time_ms: processingTimeMs,
      processing_mode: 'on_device',
    })
  },

  trackFaceShapeDetectorFailed(reason: string) {
    sendEvent('face_shape_detector_failed', {
      failure_reason: reason.slice(0, 200),
      processing_mode: 'on_device',
    })
  },

  trackFaceShapeDetectorCta(
    faceShape: string,
    destination: 'glasses_advisor' | 'virtual_try_on' | 'frame_compare' | 'face_shape_guide',
  ) {
    const productPath =
      destination === 'glasses_advisor'
        ? 'glasses_advisor'
        : destination === 'virtual_try_on'
          ? 'virtual_try_on'
          : destination === 'frame_compare'
            ? 'frame_compare'
            : undefined

    if (productPath) {
      setGrowthContext({ product_path: productPath })
    }

    sendEvent('face_shape_detector_cta_click', {
      face_shape: faceShape,
      destination,
      ...(productPath ? { product_path: productPath } : {}),
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

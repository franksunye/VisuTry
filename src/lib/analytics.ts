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

// 用户类型
export type UserType = 'anonymous' | 'free' | 'premium' | 'credits'

// 事件来源
export type EventSource =
  | 'nav'
  | 'dashboard'
  | 'try_on'
  | 'pricing'
  | 'error_modal'
  | 'direct'
  | 'face_analysis'
  | 'blog'

// 升级按钮位置
export type UpgradeLocation = 'quick_actions' | 'subscription_card' | 'nav'

// 产品类型
export type { ProductType } from '@/config/pricing'
import type { ProductType } from '@/config/pricing'
import type { AcquisitionAttribution } from '@/lib/acquisition-attribution'
import { sanitizeAcquisitionAttribution } from '@/lib/acquisition-attribution'

const LANDING_PAGE_KEY = 'visutry_landing_page'
const GROWTH_SOURCE_KEY = 'visutry_growth_source'
const GROWTH_MEDIUM_KEY = 'visutry_growth_medium'
const GROWTH_CONTEXT_KEY = 'visutry_growth_context'

export type AcquisitionContext = {
  landing_page: string
  page_path: string
  growth_source?: string
  medium?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
  landing_locale?: string
}

type GrowthContext = {
  query_cluster?: string
  content_cluster?: string
  product_path?: string
}

/**
 * 获取用户当前浏览的页面语言（landing_locale）
 *
 * 从 <html lang="xx"> 属性读取，该属性由服务端布局静态输出，
 * 因此在页面首次加载时即可用，无需等待客户端 hydration。
 */
function getLandingLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

/**
 * 获取浏览器首选语言（browser_language）
 *
 * 返回完整的 BCP 47 标签（如 "ar-SA", "en-US", "ja-JP"），
 * 与 landing_locale 的短标签（如 "ar", "en", "ja"）互补，
 * 可用于分析"浏览器语言与页面语言不一致"的情景。
 */
function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language || 'en'
}

function readGrowthContext(): GrowthContext {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.sessionStorage.getItem(GROWTH_CONTEXT_KEY)
    if (!raw) return {}
    const parsed = sanitizeAcquisitionAttribution(JSON.parse(raw))
    if (!parsed) return {}
    return {
      ...(parsed.query_cluster ? { query_cluster: parsed.query_cluster } : {}),
      ...(parsed.content_cluster ? { content_cluster: parsed.content_cluster } : {}),
      ...(parsed.product_path ? { product_path: parsed.product_path } : {}),
    }
  } catch {
    return {}
  }
}

/**
 * Persist growth taxonomy for later product / purchase events in this session.
 * Funnel links and tool CTAs should call this when the user continues.
 */
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
        ...(next.query_cluster ? { query_cluster: next.query_cluster } : {}),
        ...(next.content_cluster ? { content_cluster: next.content_cluster } : {}),
        ...(next.product_path ? { product_path: next.product_path } : {}),
      }),
    )
  } catch {
    // Ignore storage failures; analytics should never block UX.
  }
}

/**
 * Preserve the first page and explicit growth source for the current browser
 * session so downstream product and revenue events can be attributed back to
 * the acquisition entry point.
 */
function getSessionAttribution(): AcquisitionContext {
  if (typeof window === 'undefined') {
    return { landing_page: '/', page_path: '/' }
  }

  const pagePath = window.location.pathname
  const landingLocale = getLandingLocale()

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const explicitSource = searchParams.get('source') || searchParams.get('utm_source')
    const explicitMedium = searchParams.get('medium') || searchParams.get('utm_medium')
    const storedLandingPage = window.sessionStorage.getItem(LANDING_PAGE_KEY)
    const storedGrowthSource = window.sessionStorage.getItem(GROWTH_SOURCE_KEY)
    const storedMedium = window.sessionStorage.getItem(GROWTH_MEDIUM_KEY)

    if (!storedLandingPage) {
      window.sessionStorage.setItem(LANDING_PAGE_KEY, pagePath)
    }
    if (explicitSource) {
      window.sessionStorage.setItem(GROWTH_SOURCE_KEY, explicitSource)
    }
    if (explicitMedium) {
      window.sessionStorage.setItem(GROWTH_MEDIUM_KEY, explicitMedium)
    }

    const growthSource = explicitSource || storedGrowthSource || undefined
    const medium = explicitMedium || storedMedium || undefined
    const growthContext = readGrowthContext()

    return {
      landing_page: storedLandingPage || pagePath,
      page_path: pagePath,
      landing_locale: landingLocale,
      ...(growthSource ? { growth_source: growthSource } : {}),
      ...(medium ? { medium } : {}),
      ...growthContext,
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsers. Attribution
    // should degrade gracefully without interrupting the product flow.
    return {
      landing_page: pagePath,
      page_path: pagePath,
      landing_locale: landingLocale,
    }
  }
}

/** Snapshot used when creating Checkout so attribution survives Stripe return. */
export function getAcquisitionContext(): AcquisitionContext {
  return getSessionAttribution()
}

/**
 * 发送事件到 Google Analytics
 *
 * 自动注入 landing_locale 和 browser_language 维度，
 * 使所有事件均可按语言拆分分析。
 */
function sendEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') return

  // Session attribution fills defaults; explicit event parameters win so
  // server-verified purchase attribution can overlay a cleared session.
  const enrichedParameters: Record<string, any> = {
    ...getSessionAttribution(),
    landing_locale: getLandingLocale(),
    browser_language: getBrowserLanguage(),
    ...parameters,
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, enrichedParameters)
  }

  // Google Tag Manager (备用)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...enrichedParameters,
    })
  }

  // 开发环境日志
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, enrichedParameters)
  }
}

/**
 * 设置 GA4 用户级语言属性
 *
 * 在页面加载或语言切换时调用一次，
 * 将 landing_locale 和 browser_language 设为用户属性，
 * 使 GA4 受众报告和用户画像也支持按语言筛选。
 *
 * 事件级维度（由 sendEvent 自动注入）用于漏斗分析，
 * 用户级维度（由此函数设置）用于受众细分，两者互补。
 */
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

/**
 * 统一的分析追踪接口
 */
export const analytics = {
  trackCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
    sendEvent(eventName, parameters)
  },

  // ==================== 用户认证事件 ====================
  
  /**
   * 追踪用户登录成功
   */
  trackLogin(method: string, isNewUser: boolean, isPremium: boolean) {
    sendEvent('login_success', {
      method,
      user_type: isNewUser ? 'new' : 'returning',
      has_premium: isPremium,
    })
  },

  /**
   * 追踪首次试戴
   */
  trackFirstTryOn(userId: string, timeSinceSignup: number) {
    sendEvent('first_try_on', {
      user_id: userId,
      time_since_signup: timeSinceSignup,
    })
  },

  // ==================== Try-On 相关事件 ====================
  
  /**
   * 追踪开始试戴
   */
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

  /**
   * 追踪试戴完成
   */
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

  /**
   * 追踪 Frame Compare 开始
   */
  trackFrameCompareStart(frameCount: number, remainingCredits: number) {
    sendEvent('frame_compare_start', {
      frame_count: frameCount,
      remaining_credits: remainingCredits,
      product_path: 'frame_compare',
    })
  },

  /**
   * 追踪 Frame Compare 完成（batch 全部结束）
   */
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

  /**
   * 追踪配额用尽后点击 CTA
   */
  trackQuotaExhaustedCTA(source: EventSource, userType: UserType) {
    sendEvent('quota_exhausted_cta', {
      source,
      user_type: userType,
      remaining_quota: 0,
    })
  },

  // ==================== 定价页面事件 ====================
  
  /**
   * 追踪查看定价页面
   */
  trackViewPricing(source: EventSource, userType: UserType, remainingQuota: number) {
    sendEvent('view_pricing', {
      source,
      user_type: userType,
      remaining_quota: remainingQuota,
    })
  },

  /**
   * 追踪点击购买按钮
   */
  trackClickPurchase(planType: ProductType, planPrice: number, userType: UserType, sourcePage: string) {
    sendEvent('click_purchase_button', {
      plan_type: planType,
      plan_price: planPrice,
      user_type: userType,
      source_page: sourcePage,
    })
  },

  // ==================== Dashboard 事件 ====================
  
  /**
   * 追踪点击升级按钮
   */
  trackUpgradeClick(location: UpgradeLocation, userType: UserType, remainingQuota: number, quotaWarning: boolean = false) {
    sendEvent('click_upgrade_button', {
      location,
      user_type: userType,
      remaining_quota: remainingQuota,
      quota_warning: quotaWarning,
    })
  },

  /**
   * 追踪查看支付历史
   */
  trackViewPaymentHistory(userType: UserType, hasPayments: boolean) {
    sendEvent('view_payment_history', {
      user_type: userType,
      has_payments: hasPayments,
    })
  },

  // ==================== 购买流程事件 ====================
  
  /**
   * 追踪开始结账（GA4 推荐事件）
   */
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

  /**
   * 追踪购买成功（GA4 推荐事件）
   * Optional server attribution overlays session storage after Stripe return.
   */
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

  /**
   * 追踪结账取消
   */
  trackCheckoutCancelled(planType: ProductType, value: number) {
    sendEvent('checkout_cancelled', {
      plan_type: planType,
      value,
    })
  },

  // ==================== Face Analysis 事件 ====================

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

  // ==================== Free Face Shape Detector 事件 ====================

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

/**
 * 辅助函数：获取用户类型
 */
export function getUserType(isPremiumActive: boolean, creditsRemaining: number, isAuthenticated: boolean): UserType {
  if (!isAuthenticated) return 'anonymous'
  if (isPremiumActive) return 'premium'
  if (creditsRemaining > 0) return 'credits'
  return 'free'
}

// 声明全局类型
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

/**
 * 统一的 Google Analytics 追踪工具
 * 提供类型安全的事件追踪接口
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
export type ProductType = 'CREDITS_PACK' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'

/**
 * 发送事件到 Google Analytics
 */
function sendEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') return

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, parameters)
  }

  // Google Tag Manager (备用)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    })
  }

  // 开发环境日志
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, parameters)
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
    })
  },

  /**
   * 追踪试戴完成
   */
  trackTryOnComplete(userType: UserType, processingTime: number, success: boolean) {
    sendEvent('try_on_complete', {
      user_type: userType,
      processing_time: processingTime,
      success,
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
   */
  trackPurchase(transactionId: string, planType: ProductType, value: number) {
    sendEvent('purchase', {
      transaction_id: transactionId,
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

  trackTryOnFromFaceAnalysis(faceAnalysisTaskId: string, styleCount: number, requiredCredits: number) {
    sendEvent('try_on_from_face_analysis', {
      face_analysis_task_id: faceAnalysisTaskId,
      style_count: styleCount,
      required_credits: requiredCredits,
    })
  },

  trackBlogFunnelClick({
    sourcePage,
    destination,
    ctaLocation,
    locale,
  }: {
    sourcePage: string
    destination: 'face_analysis' | 'glasses_try_on' | 'glasses_for_face_shape'
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
    gtag: (command: 'config' | 'event', targetId: string, config?: Record<string, any>) => void
    dataLayer: Array<Record<string, any>>
  }
}

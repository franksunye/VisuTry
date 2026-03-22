/**
 * 统一的 Google Analytics 追踪工具
 * 提供类型安全的事件追踪接口
 */

// 用户类型
export type UserType = 'anonymous' | 'free' | 'premium' | 'credits'

// 事件来源
export type EventSource = 'nav' | 'dashboard' | 'try_on' | 'pricing' | 'error_modal' | 'direct'

// 升级按钮位置
export type UpgradeLocation = 'quick_actions' | 'subscription_card' | 'nav'

// 产品类型
export type ProductType = 'CREDITS_PACK' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
export type AuthEntryMethod = 'nextauth_signin' | 'direct_auth_url'

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
   * 追踪用户点击登录入口（用于诊断登录链路）
   */
  trackLoginStart(method: string, entryMethod: AuthEntryMethod, sourcePath?: string, callbackPath?: string) {
    sendEvent('login_start', {
      method,
      entry_method: entryMethod,
      source_path: sourcePath,
      callback_path: callbackPath,
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
  trackTryOnStart(userType: UserType, remainingQuota: number, glassesId?: string, glassesName?: string) {
    sendEvent('try_on_start', {
      user_type: userType,
      remaining_quota: remainingQuota,
      glasses_id: glassesId,
      glasses_name: glassesName,
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

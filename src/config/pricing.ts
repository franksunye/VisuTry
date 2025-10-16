/**
 * 定价配置
 * 集中管理所有产品的价格、额度、描述
 * 
 * 设计原则：
 * 1. 所有硬编码的价格和额度都从这里读取
 * 2. 支持环境变量覆盖，方便测试和部署
 * 3. 提供默认值，确保应用正常运行
 * 4. 类型安全，使用 TypeScript 类型推导
 */

// ========== 1. 额度配置 ==========
// 从环境变量读取，提供默认值
export const QUOTA_CONFIG = {
  FREE_TRIAL: parseInt(process.env.FREE_TRIAL_LIMIT || "3"),
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_QUOTA || "30"),
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_QUOTA || "420"),
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_AMOUNT || "10"),
} as const

// ========== 2. 价格配置 ==========
// 单位：美分（cents）
export const PRICE_CONFIG = {
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_PRICE || "899"),    // $8.99
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_PRICE || "8999"),     // $89.99
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_PRICE || "299"),       // $2.99
} as const

// ========== 3. 产品元数据配置 ==========
// 集中管理所有产品信息，包括名称、描述、功能列表等
export const PRODUCT_METADATA = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    name: "Standard - Monthly",
    shortName: "Standard",
    description: "Most popular choice",
    quota: QUOTA_CONFIG.MONTHLY_SUBSCRIPTION,
    price: PRICE_CONFIG.MONTHLY_SUBSCRIPTION,
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month`,
      "High-quality image processing",
      "Priority processing queue",
      "Unlimited downloads and sharing",
      "Standard glasses frame library",
      "Priority customer support",
      "Ad-free experience"
    ],
    popular: true,
  },
  PREMIUM_YEARLY: {
    id: "PREMIUM_YEARLY",
    name: "Standard - Annual",
    shortName: "Standard Annual",
    description: "Best value",
    quota: QUOTA_CONFIG.YEARLY_SUBSCRIPTION,
    price: PRICE_CONFIG.YEARLY_SUBSCRIPTION,
    currency: "usd",
    interval: "year" as const,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (360 + 60 bonus)`,
      "High-quality image processing",
      "Priority processing queue",
      "Unlimited downloads and sharing",
      "Standard glasses frame library",
      "Priority customer support",
      "Ad-free experience",
      "Save 2 months + 60 bonus try-ons"
    ],
    popular: false,
  },
  CREDITS_PACK: {
    id: "CREDITS_PACK",
    name: "Credits Pack",
    shortName: "Credits Pack",
    description: "Perfect for occasional users",
    quota: QUOTA_CONFIG.CREDITS_PACK,
    price: PRICE_CONFIG.CREDITS_PACK,
    currency: "usd",
    interval: null,
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.CREDITS_PACK} AI try-ons`,
      "Credits never expire",
      "High-quality image processing",
      "Unlimited downloads and sharing",
      "Priority customer support"
    ],
    popular: false,
  },
} as const

// ========== 4. 类型定义 ==========
export type ProductType = keyof typeof PRODUCT_METADATA
export type ProductMetadata = typeof PRODUCT_METADATA[ProductType]

// ========== 5. 辅助函数 ==========

/**
 * 获取产品配额
 */
export function getProductQuota(productType: ProductType): number {
  return PRODUCT_METADATA[productType].quota
}

/**
 * 获取产品价格（美元格式）
 */
export function getProductPriceInDollars(productType: ProductType): string {
  const cents = PRODUCT_METADATA[productType].price
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * 格式化价格（美分转美元）
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * 计算用户剩余额度
 * 
 * @param isPremiumActive - 是否是高级会员
 * @param subscriptionType - 订阅类型
 * @param freeTrialsUsed - 已使用的免费试用次数
 * @param creditsBalance - Credits 余额
 * @returns 剩余额度信息
 */
export function calculateRemainingQuota(
  isPremiumActive: boolean,
  subscriptionType: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | null,
  freeTrialsUsed: number,
  creditsBalance: number
): {
  subscriptionRemaining: number
  creditsRemaining: number
  totalRemaining: number
  description: string
} {
  let subscriptionRemaining = 0
  let description = ""

  if (isPremiumActive && subscriptionType) {
    // 高级会员：根据订阅类型计算配额
    const quota = subscriptionType === 'PREMIUM_YEARLY' 
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION 
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    subscriptionRemaining = Math.max(0, quota - freeTrialsUsed)
    description = subscriptionType === 'PREMIUM_YEARLY' ? 'Annual' : 'Monthly'
  } else {
    // 免费用户：使用免费试用配额
    subscriptionRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - freeTrialsUsed)
    description = 'Free'
  }

  const totalRemaining = subscriptionRemaining + creditsBalance

  return {
    subscriptionRemaining,
    creditsRemaining: creditsBalance,
    totalRemaining,
    description: creditsBalance > 0
      ? `${description} (${subscriptionRemaining}) + Credits (${creditsBalance})`
      : `${description} Plan`
  }
}

/**
 * 获取订阅配额标签
 * 
 * @param isPremiumActive - 是否是高级会员
 * @param isYearlySubscription - 是否是年度订阅
 * @param freeTrialsUsed - 已使用的免费试用次数
 * @returns 配额标签和剩余数量
 */
export function getSubscriptionQuotaLabel(
  isPremiumActive: boolean,
  isYearlySubscription: boolean,
  freeTrialsUsed: number
): {
  quota: number
  label: string
} {
  if (isPremiumActive) {
    if (isYearlySubscription) {
      const quota = Math.max(0, QUOTA_CONFIG.YEARLY_SUBSCRIPTION - freeTrialsUsed)
      return {
        quota,
        label: `Annual quota (${quota} of ${QUOTA_CONFIG.YEARLY_SUBSCRIPTION})`
      }
    } else {
      const quota = Math.max(0, QUOTA_CONFIG.MONTHLY_SUBSCRIPTION - freeTrialsUsed)
      return {
        quota,
        label: `Monthly quota (${quota} of ${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION})`
      }
    }
  } else {
    const quota = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - freeTrialsUsed)
    return {
      quota,
      label: `Free trials (${quota} of ${QUOTA_CONFIG.FREE_TRIAL})`
    }
  }
}

/**
 * 验证配置有效性
 * 在应用启动时调用，确保配置正确
 */
export function validatePricingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 验证额度配置
  if (QUOTA_CONFIG.FREE_TRIAL <= 0) {
    errors.push('FREE_TRIAL_LIMIT must be greater than 0')
  }
  if (QUOTA_CONFIG.MONTHLY_SUBSCRIPTION <= 0) {
    errors.push('MONTHLY_QUOTA must be greater than 0')
  }
  if (QUOTA_CONFIG.YEARLY_SUBSCRIPTION <= 0) {
    errors.push('YEARLY_QUOTA must be greater than 0')
  }
  if (QUOTA_CONFIG.CREDITS_PACK <= 0) {
    errors.push('CREDITS_PACK_AMOUNT must be greater than 0')
  }

  // 验证价格配置
  if (PRICE_CONFIG.MONTHLY_SUBSCRIPTION <= 0) {
    errors.push('MONTHLY_PRICE must be greater than 0')
  }
  if (PRICE_CONFIG.YEARLY_SUBSCRIPTION <= 0) {
    errors.push('YEARLY_PRICE must be greater than 0')
  }
  if (PRICE_CONFIG.CREDITS_PACK <= 0) {
    errors.push('CREDITS_PACK_PRICE must be greater than 0')
  }

  // 验证 Stripe Price IDs
  if (!PRODUCT_METADATA.PREMIUM_MONTHLY.priceId) {
    errors.push('STRIPE_PREMIUM_MONTHLY_PRICE_ID is not configured')
  }
  if (!PRODUCT_METADATA.PREMIUM_YEARLY.priceId) {
    errors.push('STRIPE_PREMIUM_YEARLY_PRICE_ID is not configured')
  }
  if (!PRODUCT_METADATA.CREDITS_PACK.priceId) {
    errors.push('STRIPE_CREDITS_PACK_PRICE_ID is not configured')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}


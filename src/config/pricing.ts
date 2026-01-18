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
  FREE_TRIAL: parseInt(process.env.FREE_TRIAL_LIMIT || "1"),
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_QUOTA || "90"),
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_QUOTA || "1260"),
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_AMOUNT || "30"),
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
    // 用于支付记录的详细描述
    paymentDescription: `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month + Standard features`,
    quota: QUOTA_CONFIG.MONTHLY_SUBSCRIPTION,
    price: PRICE_CONFIG.MONTHLY_SUBSCRIPTION,
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month`,
      "High-quality image processing",
      "Priority processing queue",
      "1 year data retention",
      "Unlimited downloads and sharing",
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
    // 用于支付记录的详细描述
    paymentDescription: `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (1080 + 180 bonus) + Standard features`,
    quota: QUOTA_CONFIG.YEARLY_SUBSCRIPTION,
    price: PRICE_CONFIG.YEARLY_SUBSCRIPTION,
    currency: "usd",
    interval: "year" as const,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (1080 + 180 bonus)`,
      "High-quality image processing",
      "Priority processing queue",
      "1 year data retention",
      "Unlimited downloads and sharing",
      "Priority customer support",
      "Ad-free experience",
      "Save 2 months + 180 bonus try-ons"
    ],
    popular: false,
  },
  CREDITS_PACK: {
    id: "CREDITS_PACK",
    name: "Credits Pack",
    shortName: "Credits Pack",
    description: "Perfect for occasional users",
    // 用于支付记录的详细描述
    paymentDescription: `Get ${QUOTA_CONFIG.CREDITS_PACK} AI try-on credits (never expire)`,
    quota: QUOTA_CONFIG.CREDITS_PACK,
    price: PRICE_CONFIG.CREDITS_PACK,
    currency: "usd",
    interval: null,
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.CREDITS_PACK} AI try-ons`,
      "Credits never expire",
      "High-quality image processing",
      "Standard generation speed",
      "90 days data retention",
      "Unlimited downloads and sharing",
      "Priority customer support"
    ],
    popular: false,
  },
  CREDITS_PACK_PROMO_60: {
    id: "CREDITS_PACK_PROMO_60",
    name: "Limited Fall Promo",
    shortName: "Promo Pack",
    description: "Special Offer: 6x Credits",
    // 用于支付记录的详细描述
    paymentDescription: `Special Offer: Get 2x Credits (${QUOTA_CONFIG.CREDITS_PACK * 2} AI try-on credits) for $2.99`,
    quota: QUOTA_CONFIG.CREDITS_PACK * 2, // 促销翻倍
    price: PRICE_CONFIG.CREDITS_PACK, // 保持原价 $2.99
    currency: "usd",
    interval: null,
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID, // 复用原 Price ID
    features: [
      `${QUOTA_CONFIG.CREDITS_PACK * 2} AI try-ons (Buy One Get One!)`,
      "Credits never expire",
      "High-quality image processing",
      "Standard generation speed",
      "90 days data retention",
      "Unlimited downloads and sharing",
      "Priority customer support"
    ],
    popular: true,
  },
  PREMIUM_MONTHLY_PROMO: {
    id: "PREMIUM_MONTHLY_PROMO",
    name: "Standard - Monthly (Promo)",
    shortName: "Monthly Promo",
    description: "Special Offer: 2x Credits",
    paymentDescription: `Special Offer: Get 2x Credits (${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION * 2} AI try-ons) for $8.99`,
    quota: QUOTA_CONFIG.MONTHLY_SUBSCRIPTION * 2,
    price: PRICE_CONFIG.MONTHLY_SUBSCRIPTION,
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION * 2} AI try-ons per month (Double!)`,
      "High-quality image processing",
      "Priority processing queue",
      "1 year data retention",
      "Unlimited downloads and sharing",
      "Priority customer support",
      "Ad-free experience"
    ],
    popular: true,
  },
  PREMIUM_YEARLY_PROMO: {
    id: "PREMIUM_YEARLY_PROMO",
    name: "Standard - Annual (Promo)",
    shortName: "Annual Promo",
    description: "Special Offer: 2x Credits",
    paymentDescription: `Special Offer: Get 2x Credits (${QUOTA_CONFIG.YEARLY_SUBSCRIPTION * 2} AI try-ons) for $89.99`,
    quota: QUOTA_CONFIG.YEARLY_SUBSCRIPTION * 2,
    price: PRICE_CONFIG.YEARLY_SUBSCRIPTION,
    currency: "usd",
    interval: "year" as const,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION * 2} AI try-ons per year (Double!)`,
      "High-quality image processing",
      "Priority processing queue",
      "1 year data retention",
      "Unlimited downloads and sharing",
      "Priority customer support",
      "Ad-free experience"
    ],
    popular: true,
  },
} as const

// ========== 3.1 促销代码配置 ==========
// 简单的代码映射，未来可以移至数据库
export const PROMO_CODES: Record<string, keyof typeof PRODUCT_METADATA> = {
  "VISU60": "CREDITS_PACK_PROMO_60",
  "SALE2024": "CREDITS_PACK_PROMO_60", // Default to credits pack if used individually
  "BOGO": "CREDITS_PACK_PROMO_60",
}

// 建立标准产品到促销产品的自动转换映射
export const PROMO_MAPPING: Record<string, ProductType> = {
  "CREDITS_PACK": "CREDITS_PACK_PROMO_60",
  "PREMIUM_MONTHLY": "PREMIUM_MONTHLY_PROMO",
  "PREMIUM_YEARLY": "PREMIUM_YEARLY_PROMO",
}

// ========== 4. 类型定义 ==========
export type ProductType = keyof typeof PRODUCT_METADATA
export type ProductMetadata = typeof PRODUCT_METADATA[ProductType]

// ========== 5. 辅助函数 ==========

/**
 * 解析促销代码
 * @returns 对应的产品类型，如果代码无效则返回 null
 */
export function resolvePromoCode(code: string): ProductType | null {
  if (!code) return null
  const normalizedCode = code.toUpperCase().trim()
  return PROMO_CODES[normalizedCode] as ProductType || null
}

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
 * @param premiumUsageCount - Premium 使用次数
 * @param creditsPurchased - Credits 购买总数
 * @param creditsUsed - Credits 已使用数
 * @returns 剩余额度信息
 */
export function calculateRemainingQuota(
  isPremiumActive: boolean,
  subscriptionType: ProductType | string | null,
  freeTrialsUsed: number,
  premiumUsageCount: number,
  creditsPurchased: number,
  creditsUsed: number
): {
  subscriptionRemaining: number
  creditsRemaining: number
  totalRemaining: number
  description: string
} {
  let subscriptionRemaining = 0
  let description = ""
  const creditsRemaining = creditsPurchased - creditsUsed

  if (isPremiumActive && subscriptionType) {
    // 高级会员：根据订阅类型计算配额
    const quota = getProductQuota(subscriptionType as ProductType)
    subscriptionRemaining = Math.max(0, quota - premiumUsageCount)

    // 基础描述
    if (subscriptionType.includes('YEARLY')) {
      description = 'Annual'
    } else if (subscriptionType.includes('MONTHLY')) {
      description = 'Monthly'
    } else {
      description = 'Standard'
    }
  } else {
    // 免费用户：使用免费试用配额
    subscriptionRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - freeTrialsUsed)
    description = 'Free'
  }

  const totalRemaining = subscriptionRemaining + creditsRemaining

  return {
    subscriptionRemaining,
    creditsRemaining,
    totalRemaining,
    description: creditsRemaining > 0
      ? `${description} (${subscriptionRemaining}) + Credits (${creditsRemaining}/${creditsPurchased})`
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
  subscriptionType: ProductType | string | null,
  freeTrialsUsed: number
): {
  quota: number
  label: string
} {
  if (isPremiumActive && subscriptionType) {
    const totalQuota = getProductQuota(subscriptionType as ProductType)
    const quota = Math.max(0, totalQuota - freeTrialsUsed)

    let typeLabel = "Monthly"
    if (subscriptionType.includes('YEARLY')) {
      typeLabel = "Annual"
    }

    return {
      quota,
      label: `${typeLabel} quota (${quota} of ${totalQuota})`
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


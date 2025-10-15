import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { prisma } from './prisma'

/**
 * 缓存管理工具
 * 提供统一的缓存策略和标签管理
 */

// 缓存标签常量
export const CACHE_TAGS = {
  USER: (userId: string) => `user-${userId}`,
  DASHBOARD: 'dashboard',
  TRYON: 'tryon',
  PAYMENTS: (userId: string) => `payments-${userId}`,
} as const

// 缓存时间常量
export const CACHE_TIMES = {
  SHORT: 10, // 10秒 - 用于频繁变化的数据
  MEDIUM: 60, // 60秒 - 用于一般数据
  LONG: 300, // 5分钟 - 用于相对稳定的数据
} as const

/**
 * 获取用户基本信息（带缓存）
 * 用于Try-On页面和Dashboard页面
 */
export function getCachedUserData(userId: string) {
  return unstable_cache(
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          premiumExpiresAt: true,
          freeTrialsUsed: true,
        },
      })
    },
    [`user-data-${userId}`],
    {
      revalidate: CACHE_TIMES.MEDIUM,
      tags: [CACHE_TAGS.USER(userId), CACHE_TAGS.DASHBOARD, CACHE_TAGS.TRYON],
    }
  )()
}

/**
 * 获取用户最新支付记录（带缓存）
 */
export function getCachedUserPayment(userId: string) {
  return unstable_cache(
    async () => {
      return await prisma.payment.findFirst({
        where: { 
          userId,
          status: 'COMPLETED',
          productType: { in: ['PREMIUM_MONTHLY', 'PREMIUM_YEARLY'] }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          productType: true,
          createdAt: true,
        },
      })
    },
    [`user-payment-${userId}`],
    {
      revalidate: CACHE_TIMES.MEDIUM,
      tags: [CACHE_TAGS.USER(userId), CACHE_TAGS.PAYMENTS(userId)],
    }
  )()
}

/**
 * 获取用户Try-On统计数据（带缓存）
 */
export function getCachedUserStats(userId: string) {
  return unstable_cache(
    async () => {
      const [totalTryOns, completedTryOns] = await Promise.all([
        prisma.tryOnTask.count({
          where: { userId },
        }),
        prisma.tryOnTask.count({
          where: { userId, status: 'COMPLETED' },
        }),
      ])
      
      return { totalTryOns, completedTryOns }
    },
    [`user-stats-${userId}`],
    {
      revalidate: CACHE_TIMES.SHORT, // 统计数据变化较频繁
      tags: [CACHE_TAGS.USER(userId), CACHE_TAGS.DASHBOARD],
    }
  )()
}

/**
 * 清除用户相关的所有缓存
 * 在用户状态发生变化时调用（如支付成功、订阅变更等）
 */
export function clearUserCache(userId: string) {
  console.log(`🧹 清除用户缓存: ${userId}`)
  
  // 清除所有用户相关的缓存标签
  revalidateTag(CACHE_TAGS.USER(userId))
  revalidateTag(CACHE_TAGS.PAYMENTS(userId))
  
  // 清除页面级别的缓存
  revalidateTag(CACHE_TAGS.DASHBOARD)
  revalidateTag(CACHE_TAGS.TRYON)
}

/**
 * 清除特定页面的缓存
 */
export function clearPageCache(page: 'dashboard' | 'tryon') {
  console.log(`🧹 清除页面缓存: ${page}`)
  const tag = page === 'dashboard' ? CACHE_TAGS.DASHBOARD : CACHE_TAGS.TRYON
  revalidateTag(tag)
}

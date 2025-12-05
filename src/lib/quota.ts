import { prisma } from "@/lib/prisma"
import { QUOTA_CONFIG } from "@/config/pricing"
import { User } from "@prisma/client"
import { logger } from "@/lib/logger"
import { revalidateTag } from "next/cache"

/**
 * Check if user has remaining quota for try-on
 */
export function checkUserQuota(user: User): { allowed: boolean; reason?: string } {
  const isPremiumActive = user.isPremium &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

  if (isPremiumActive && user.currentSubscriptionType) {
    // Premium users: check subscription quota + credits
    const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY'
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
    const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
    const totalRemaining = subscriptionRemaining + creditsRemaining

    if (totalRemaining <= 0) {
      return { allowed: false, reason: "No remaining quota. Please purchase Credits Pack." }
    }
  } else if (!isPremiumActive) {
    // Free users: check free trials + credits
    const freeRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed)
    const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
    const totalRemaining = freeRemaining + creditsRemaining

    if (totalRemaining <= 0) {
      return { allowed: false, reason: "No remaining quota. Please purchase Credits Pack or upgrade to Standard." }
    }
  }

  return { allowed: true }
}

/**
 * Deduct quota from user after successful task
 */
export async function deductUserQuota(userId: string, ctx?: any): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const isPremiumActive = user.isPremium &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

  if (!isPremiumActive) {
    // 免费用户：优先消费 credits，如果没有 credits 则消费免费试用
    const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
    const hasCredits = creditsRemaining > 0

    if (hasCredits) {
      // 有 credits：增加已使用计数
      await prisma.user.update({
        where: { id: userId },
        data: { creditsUsed: { increment: 1 } }
      })
      logger.info('quota', 'User consumed credit', { userId, remaining: creditsRemaining - 1 }, ctx)
    } else {
      // 没有 credits：使用免费试用
      await prisma.user.update({
        where: { id: userId },
        data: { freeTrialsUsed: { increment: 1 } }
      })
      logger.info('quota', 'User used free trial', { userId, trialsUsed: user.freeTrialsUsed + 1 }, ctx)
    }
  } else {
    // Premium用户：优先使用订阅配额，然后使用 credits
    const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY'
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
    const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)

    if (subscriptionRemaining > 0) {
      // 有订阅配额：增加 premiumUsageCount
      await prisma.user.update({
        where: { id: userId },
        data: { premiumUsageCount: { increment: 1 } }
      })
      logger.info('quota', 'Premium user used subscription quota', { userId, remaining: subscriptionRemaining - 1 }, ctx)
    } else if (creditsRemaining > 0) {
      // 订阅配额用完，使用 credits
      await prisma.user.update({
        where: { id: userId },
        data: { creditsUsed: { increment: 1 } }
      })
      logger.info('quota', 'Premium user used credit', { userId, remaining: creditsRemaining - 1 }, ctx)
    }
  }

  // Clear cache
  revalidateTag(`user-${userId}`)
}

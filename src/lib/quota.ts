import { prisma } from "@/lib/prisma"
import { QUOTA_CONFIG } from "@/config/pricing"
import { Prisma, TaskStatus, User } from "@prisma/client"
import { logger } from "@/lib/logger"
import { revalidateTag } from "next/cache"

export type QuotaSource = "subscription" | "credit" | "free_trial"

interface QuotaDeductionResult {
  source: QuotaSource | null
  remaining?: number
}

export interface TryOnQuotaSettlementResult {
  settled: boolean
  alreadySettled: boolean
  source: QuotaSource | null
}

export function getRemainingQuotaCount(user: User): number {
  const isPremiumActive =
    user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
  const creditsRemaining = Math.max(0, (user.creditsPurchased || 0) - (user.creditsUsed || 0))

  if (!isPremiumActive) {
    const freeRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed)
    return freeRemaining + creditsRemaining
  }

  const quota =
    user.currentSubscriptionType === "PREMIUM_YEARLY"
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
  const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
  return subscriptionRemaining + creditsRemaining
}

/**
 * Which quota bucket the next successful task would consume.
 * Mirrors deductUserQuota priority order exactly (for Face Analysis unlock logic).
 * Try-On does not call this; it only uses checkUserQuota + deductUserQuota.
 */
export function getNextQuotaSource(user: User): QuotaSource | null {
  const isPremiumActive =
    user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

  if (!isPremiumActive) {
    const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
    if (creditsRemaining > 0) {
      return "credit"
    }

    const freeRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed)
    return freeRemaining > 0 ? "free_trial" : null
  }

  const quota =
    user.currentSubscriptionType === "PREMIUM_YEARLY"
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
  const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
  const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)

  if (subscriptionRemaining > 0) {
    return "subscription"
  }
  if (creditsRemaining > 0) {
    return "credit"
  }
  return null
}

/**
 * Check if user has remaining quota for try-on
 */
export function checkUserQuota(user: User): { allowed: boolean; reason?: string } {
  const isPremiumActive =
    user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

  if (isPremiumActive && user.currentSubscriptionType) {
    // Premium users: check subscription quota + credits
    const quota =
      user.currentSubscriptionType === "PREMIUM_YEARLY"
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
      return {
        allowed: false,
        reason: "No remaining quota. Please purchase Credits Pack or upgrade to Standard.",
      }
    }
  }

  return { allowed: true }
}

type QuotaClient = Prisma.TransactionClient | typeof prisma

async function applyQuotaDeduction(
  client: QuotaClient,
  userId: string,
): Promise<QuotaDeductionResult> {
  const user = await client.user.findUnique({ where: { id: userId } })
  if (!user) return { source: null }

  const source = getNextQuotaSource(user)
  if (source === "credit") {
    await client.user.update({
      where: { id: userId },
      data: { creditsUsed: { increment: 1 } },
    })
    return {
      source,
      remaining: Math.max(0, user.creditsPurchased - user.creditsUsed - 1),
    }
  }

  if (source === "free_trial") {
    await client.user.update({
      where: { id: userId },
      data: { freeTrialsUsed: { increment: 1 } },
    })
    return {
      source,
      remaining: Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed - 1),
    }
  }

  if (source === "subscription") {
    const quota = user.currentSubscriptionType === "PREMIUM_YEARLY"
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    await client.user.update({
      where: { id: userId },
      data: { premiumUsageCount: { increment: 1 } },
    })
    return {
      source,
      remaining: Math.max(0, quota - user.premiumUsageCount - 1),
    }
  }

  return { source: null }
}

function logQuotaDeduction(
  userId: string,
  result: QuotaDeductionResult,
  ctx?: unknown,
) {
  if (result.source === "credit") {
    logger.info("quota", "User consumed credit", { userId, remaining: result.remaining }, ctx)
  } else if (result.source === "free_trial") {
    logger.info("quota", "User used free trial", { userId, remaining: result.remaining }, ctx)
  } else if (result.source === "subscription") {
    logger.info("quota", "Premium user used subscription quota", { userId, remaining: result.remaining }, ctx)
  } else {
    logger.warn("quota", "Quota settlement found no available quota source", { userId }, ctx)
  }
}

/**
 * Deduct quota from user after a successful non-Try-On workflow.
 */
export async function deductUserQuota(userId: string, ctx?: unknown): Promise<void> {
  const result = await applyQuotaDeduction(prisma, userId)
  logQuotaDeduction(userId, result, ctx)
  revalidateTag(`user-${userId}`)
}

/**
 * Settle one completed Try-On task exactly once. The task marker and user quota
 * counter update commit in the same serializable transaction. Transaction
 * conflicts are retried because concurrent poll/cron callers are expected.
 */
export async function settleTryOnTaskQuota(
  taskId: string,
  userId: string,
  ctx?: unknown,
): Promise<TryOnQuotaSettlementResult> {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        const claim = await tx.tryOnTask.updateMany({
          where: {
            id: taskId,
            userId,
            status: TaskStatus.COMPLETED,
            quotaSettledAt: null,
          },
          data: { quotaSettledAt: new Date() },
        })

        if (claim.count === 0) {
          const task = await tx.tryOnTask.findUnique({
            where: { id: taskId },
            select: { userId: true, status: true, quotaSettledAt: true, quotaSource: true },
          })
          if (!task || task.userId !== userId) {
            throw new Error("Try-On task not found for quota settlement")
          }
          if (task.status !== TaskStatus.COMPLETED) {
            throw new Error("Try-On task must be completed before quota settlement")
          }
          if (!task.quotaSettledAt) {
            throw new Error("Try-On quota settlement could not be claimed")
          }
          return {
            settled: false,
            alreadySettled: true,
            source: task.quotaSource as QuotaSource | null,
            deduction: null,
          }
        }

        const deduction = await applyQuotaDeduction(tx, userId)
        await tx.tryOnTask.update({
          where: { id: taskId },
          data: { quotaSource: deduction.source },
        })

        return {
          settled: true,
          alreadySettled: false,
          source: deduction.source,
          deduction,
        }
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })

      if (transactionResult.settled && transactionResult.deduction) {
        logQuotaDeduction(userId, transactionResult.deduction, ctx)
        revalidateTag(`user-${userId}`)
      }

      return {
        settled: transactionResult.settled,
        alreadySettled: transactionResult.alreadySettled,
        source: transactionResult.source,
      }
    } catch (error) {
      const isWriteConflict = (error as { code?: string })?.code === 'P2034'
      if (!isWriteConflict || attempt === maxAttempts) throw error
    }
  }

  throw new Error("Try-On quota settlement retry limit exceeded")
}

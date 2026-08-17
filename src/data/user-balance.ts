import { prisma } from '@/lib/prisma'

export async function getUserBalance(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      creditsPurchased: true,
      creditsUsed: true,
      premiumUsageCount: true,
      freeTrialsUsed: true,
      isPremium: true,
      premiumExpiresAt: true,
      currentSubscriptionType: true,
    },
  })
}

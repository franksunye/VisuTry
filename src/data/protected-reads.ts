import { prisma } from '@/lib/prisma'

export async function getConsumerTryOnHistory(input: {
  userId: string
  page: number
  limit: number
  status?: string | null
}) {
  const where = { userId: input.userId, ...(input.status ? { status: input.status as never } : {}) }
  const [tasks, total] = await Promise.all([
    prisma.tryOnTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        type: true,
        status: true,
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    }),
    prisma.tryOnTask.count({ where }),
  ])
  return { tasks, total }
}

export async function getFaceAnalysisHistory(input: { userId: string; page: number; limit: number }) {
  const where = { userId: input.userId }
  const [tasks, total] = await Promise.all([
    prisma.faceAnalysisTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        status: true,
        userImageUrl: true,
        detectedShape: true,
        confidence: true,
        basicResult: true,
        fullResult: true,
        reportUnlocked: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    prisma.faceAnalysisTask.count({ where }),
  ])
  return { tasks, total }
}

export async function getPaymentHistory(input: { userId: string; page: number; limit: number }) {
  const where = { userId: input.userId, status: { in: ['COMPLETED', 'REFUNDED'] as ('COMPLETED' | 'REFUNDED')[] } }
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        productType: true,
        description: true,
        createdAt: true,
        stripePaymentId: true,
        amount: true,
        currency: true,
        status: true,
      },
    }),
    prisma.payment.count({ where }),
  ])
  return { payments, total }
}

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

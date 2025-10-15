import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // 清除缓存
    revalidateTag(`user-${userId}`)
    revalidateTag('tryon')
    
    // 获取最新用户数据和支付记录
    const [user, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          isPremium: true,
          premiumExpiresAt: true,
          freeTrialsUsed: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.payment.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          productType: true,
          amount: true,
          status: true,
          createdAt: true,
          stripeSessionId: true,
        },
      })
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 计算会员状态（模拟Try-On页面逻辑）
    const isPremiumActive = !!(user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date()))
    
    const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
    const remainingTrials = Math.max(0, freeTrialLimit - user.freeTrialsUsed)

    const result = {
      user: {
        ...user,
        isPremiumActive,
        remainingTrials,
      },
      payments: payments,
      calculations: {
        currentTime: new Date().toISOString(),
        isPremiumActive,
        freeTrialLimit,
        remainingTrials,
        premiumExpiresAt: user.premiumExpiresAt?.toISOString(),
        isPremiumExpired: user.premiumExpiresAt ? user.premiumExpiresAt <= new Date() : false,
        latestPayment: payments[0] || null,
        hasValidPayments: payments.length > 0,
      },
      cacheCleared: true,
      environment: {
        FREE_TRIAL_LIMIT: process.env.FREE_TRIAL_LIMIT,
        NODE_ENV: process.env.NODE_ENV,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in debug user status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

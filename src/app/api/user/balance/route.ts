import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

/**
 * 获取用户最新的余额信息
 * 用于支付成功后轮询检查余额是否已更新
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    // 直接从数据库获取最新数据（绕过所有缓存）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditsPurchased: true,
        creditsUsed: true,
        premiumUsageCount: true,
        freeTrialsUsed: true,
        isPremium: true,
        premiumExpiresAt: true,
        currentSubscriptionType: true,
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // 计算会员状态
    const isPremiumActive = !!(user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date()))

    return NextResponse.json({
      success: true,
      data: {
        creditsPurchased: user.creditsPurchased || 0,
        creditsUsed: user.creditsUsed || 0,
        premiumUsageCount: user.premiumUsageCount || 0,
        freeTrialsUsed: user.freeTrialsUsed || 0,
        isPremiumActive,
        currentSubscriptionType: user.currentSubscriptionType,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Get user balance error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}


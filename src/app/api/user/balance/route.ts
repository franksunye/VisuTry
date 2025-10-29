import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

/**
 * 获取用户最新的余额信息
 * 用于支付成功后轮询检查余额是否已更新
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please sign in to view your balance"
      }, { status: 401 })
    }

    const userId = session.user.id

    // 直接从数据库获取最新数据（绕过所有缓存）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditsBalance: true,
        premiumUsageCount: true,
        freeTrialsUsed: true,
        isPremium: true,
        premiumExpiresAt: true,
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
        creditsBalance: user.creditsBalance || 0,
        premiumUsageCount: user.premiumUsageCount || 0,
        freeTrialsUsed: user.freeTrialsUsed || 0,
        isPremiumActive,
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


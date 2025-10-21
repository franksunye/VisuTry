import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { QUOTA_CONFIG } from "@/config/pricing"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // 从数据库查询用户数据
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        freeTrialsUsed: true,
        creditsBalance: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 计算剩余次数（模拟 JWT 逻辑）
    const isPremiumActive = dbUser.isPremium && (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())
    
    let calculatedRemainingTrials = 0
    if (isPremiumActive) {
      calculatedRemainingTrials = 999
    } else if (dbUser.creditsBalance > 0) {
      calculatedRemainingTrials = dbUser.creditsBalance
    } else {
      calculatedRemainingTrials = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - dbUser.freeTrialsUsed)
    }

    // 查询最近的 try-on 任务
    const recentTryOns = await prisma.tryOnTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
      }
    })

    // 统计任务状态
    const taskStats = {
      total: recentTryOns.length,
      completed: recentTryOns.filter(t => t.status === 'COMPLETED').length,
      failed: recentTryOns.filter(t => t.status === 'FAILED').length,
      processing: recentTryOns.filter(t => t.status === 'PROCESSING').length,
    }

    return NextResponse.json({
      database: {
        user: dbUser,
        isPremiumActive,
        calculatedRemainingTrials,
      },
      session: {
        user: session.user,
        remainingTrialsInSession: session.user.remainingTrials,
      },
      recentTryOns,
      taskStats,
      comparison: {
        dbRemainingTrials: calculatedRemainingTrials,
        sessionRemainingTrials: session.user.remainingTrials,
        match: calculatedRemainingTrials === session.user.remainingTrials,
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


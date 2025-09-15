import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createCheckoutSession, ProductType } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productType, successUrl, cancelUrl } = body

    // 验证产品类型
    const validProductTypes: ProductType[] = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "CREDITS_PACK"]
    if (!validProductTypes.includes(productType)) {
      return NextResponse.json(
        { success: false, error: "无效的产品类型" },
        { status: 400 }
      )
    }

    // 验证URL
    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: "成功和取消URL是必需的" },
        { status: 400 }
      )
    }

    // 创建Stripe Checkout会话
    const checkoutSession = await createCheckoutSession({
      productType,
      userId: session.user.id,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      }
    })

  } catch (error) {
    console.error("创建支付会话失败:", error)
    return NextResponse.json(
      { success: false, error: "创建支付会话失败" },
      { status: 500 }
    )
  }
}

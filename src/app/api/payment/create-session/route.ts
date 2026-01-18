import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createCheckoutSession, ProductType } from "@/lib/stripe"
import { isMockMode } from "@/lib/mocks"
import { mockCreateCheckoutSession } from "@/lib/mocks/stripe"
import { logger, getRequestContext } from "@/lib/logger"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productType, priceId, successUrl, cancelUrl } = body

    // 支持两种参数格式：productType 或 priceId
    let finalProductType: ProductType

    if (productType) {
      // 验证产品类型
      const validProductTypes: ProductType[] = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "CREDITS_PACK", "CREDITS_PACK_PROMO_60", "PREMIUM_MONTHLY_PROMO", "PREMIUM_YEARLY_PROMO"]
      if (!validProductTypes.includes(productType)) {
        return NextResponse.json(
          { success: false, error: "无效的产品类型" },
          { status: 400 }
        )
      }
      finalProductType = productType
    } else if (priceId) {
      // 从priceId映射到productType
      const priceIdMap: Record<string, ProductType> = {
        'price_mock_premium': 'PREMIUM_MONTHLY',
        'price_mock_yearly': 'PREMIUM_YEARLY',
        'price_mock_credits': 'CREDITS_PACK'
      }

      finalProductType = priceIdMap[priceId]
      if (!finalProductType) {
        return NextResponse.json(
          { success: false, error: "无效的价格ID" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: "需要提供productType或priceId" },
        { status: 400 }
      )
    }

    // 在Mock模式下，URL是可选的
    if (!isMockMode && (!successUrl || !cancelUrl)) {
      return NextResponse.json(
        { success: false, error: "成功和取消URL是必需的" },
        { status: 400 }
      )
    }

    // 创建Stripe Checkout会话
    let checkoutSession

    if (isMockMode) {
      console.log('🧪 Mock Payment: Creating mock checkout session')
      logger.info('payment', 'Creating mock checkout session', { productType: finalProductType, userId: session.user.id }, ctx)
      checkoutSession = await mockCreateCheckoutSession({
        productType: finalProductType,
        userId: session.user.id,
        successUrl: successUrl || 'http://localhost:3000/success',
        cancelUrl: cancelUrl || 'http://localhost:3000/cancel',
      })
    } else {
      checkoutSession = await createCheckoutSession({
        productType: finalProductType,
        userId: session.user.id,
        successUrl,
        cancelUrl,
      })
    }

    logger.info('payment', 'Checkout session created successfully', { sessionId: checkoutSession.id, productType: finalProductType }, ctx)
    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      }
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("创建支付会话失败:", error)
    logger.error('payment', 'Failed to create checkout session', err, undefined, ctx)
    return NextResponse.json(
      { success: false, error: "创建支付会话失败" },
      { status: 500 }
    )
  }
}

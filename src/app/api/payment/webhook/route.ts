import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { clearUserCache } from "@/lib/cache"
import {
  verifyWebhookSignature,
  handleSuccessfulPayment,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  ProductType
} from "@/lib/stripe"
import Stripe from "stripe"
import { QUOTA_CONFIG, PRODUCT_METADATA } from "@/config/pricing"
import { logger, getRequestContext } from "@/lib/logger"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required")
    }

    // 验证Webhook签名
    const event = verifyWebhookSignature(body, signature, webhookSecret)

    // 处理不同类型的事件
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, ctx)
        break

      case "customer.subscription.created":
        await handleSubscriptionCreatedEvent(event.data.object as Stripe.Subscription, ctx)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdatedEvent(event.data.object as Stripe.Subscription, ctx)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeletedEvent(event.data.object as Stripe.Subscription, ctx)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, ctx)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, ctx)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
        logger.warn('payment', `Unhandled event type: ${event.type}`, undefined, ctx)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("Webhook处理失败:", error)
    logger.error('payment', 'Webhook处理失败', err, undefined, ctx)
    return NextResponse.json(
      { error: "Webhook处理失败" },
      { status: 400 }
    )
  }
}

// 处理Checkout会话完成
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, context?: any) {
  try {
    const paymentData = await handleSuccessfulPayment(session)

    // 创建支付记录
    await prisma.payment.create({
      data: {
        userId: paymentData.userId,
        stripeSessionId: paymentData.sessionId,
        stripePaymentId: paymentData.paymentIntentId,
        stripeSubscriptionId: session.subscription as string | null,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: "COMPLETED",
        productType: paymentData.productType,
        description: getProductDescription(paymentData.productType),
      }
    })

    // 如果是次数包，增加用户的 credits 购买总数
    if (paymentData.productType === "CREDITS_PACK") {
      await prisma.user.update({
        where: { id: paymentData.userId },
        data: {
          creditsPurchased: {
            increment: QUOTA_CONFIG.CREDITS_PACK
          }
        }
      })
    }

    // 清除用户缓存，确保所有页面立即显示最新数据
    clearUserCache(paymentData.userId)

    console.log(`Payment completed for user ${paymentData.userId}`)
    logger.info('payment', 'Payment completed', { userId: paymentData.userId, amount: paymentData.amount, productType: paymentData.productType }, context)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理支付完成事件失败:", error)
    logger.error('payment', '处理支付完成事件失败', err, undefined, context)
  }
}

// 处理订阅创建
async function handleSubscriptionCreatedEvent(subscription: Stripe.Subscription, context?: any) {
  try {
    const subscriptionData = await handleSubscriptionCreated(subscription)

    // 更新用户的高级会员状态
    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: subscriptionData.expiresAt,
        currentSubscriptionType: subscriptionData.productType,
      }
    })

    // 清除用户缓存，确保所有页面立即显示最新会员状态
    clearUserCache(subscriptionData.userId)

    console.log(`Subscription created for user ${subscriptionData.userId}, type: ${subscriptionData.productType}`)
    logger.info('payment', 'Subscription created', { userId: subscriptionData.userId, productType: subscriptionData.productType }, context)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理订阅创建事件失败:", error)
    logger.error('payment', '处理订阅创建事件失败', err, undefined, context)
  }
}

// 处理订阅更新
async function handleSubscriptionUpdatedEvent(subscription: Stripe.Subscription, context?: any) {
  try {
    const subscriptionData = await handleSubscriptionUpdated(subscription)

    // 更新用户的高级会员状态
    const isPremiumActive = subscription.status === "active"
    const productType = subscription.metadata?.productType as ProductType | undefined

    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: isPremiumActive,
        premiumExpiresAt: isPremiumActive ? subscriptionData.expiresAt : null,
        currentSubscriptionType: isPremiumActive && productType ? productType : null,
      }
    })

    // 清除用户缓存，确保所有页面立即显示最新会员状态
    clearUserCache(subscriptionData.userId)

    console.log(`Subscription updated for user ${subscriptionData.userId}, active: ${isPremiumActive}`)
    logger.info('payment', 'Subscription updated', { userId: subscriptionData.userId, active: isPremiumActive }, context)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理订阅更新事件失败:", error)
    logger.error('payment', '处理订阅更新事件失败', err, undefined, context)
  }
}

// 处理订阅删除
async function handleSubscriptionDeletedEvent(subscription: Stripe.Subscription, context?: any) {
  try {
    const subscriptionData = await handleSubscriptionDeleted(subscription)

    // 取消用户的高级会员状态
    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: false,
        premiumExpiresAt: null,
        currentSubscriptionType: null,
      }
    })

    // 清除用户缓存，确保所有页面立即显示最新会员状态
    clearUserCache(subscriptionData.userId)

    console.log(`Subscription deleted for user ${subscriptionData.userId}`)
    logger.info('payment', 'Subscription deleted', { userId: subscriptionData.userId }, context)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理订阅删除事件失败:", error)
    logger.error('payment', '处理订阅删除事件失败', err, undefined, context)
  }
}

// 处理发票支付成功（订阅续费）
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, context?: any) {
  try {
    if (invoice.subscription) {
      console.log(`Invoice payment succeeded for subscription ${invoice.subscription}`)
      logger.info('payment', 'Invoice payment succeeded', { subscriptionId: invoice.subscription }, context)

      // 🔥 重要：订阅续费时重置 Premium 用户的使用计数器
      // 这样每个计费周期都会重新开始计数
      const payment = await prisma.payment.findFirst({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        select: {
          userId: true,
        }
      })

      if (payment?.userId) {
        // 重置 premiumUsageCount 为 0
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            premiumUsageCount: 0
          }
        })

        // 清除用户缓存，确保 Dashboard 立即显示重置后的配额
        clearUserCache(payment.userId)

        console.log(`✅ Reset premiumUsageCount for user ${payment.userId} on subscription renewal`)
        logger.info('payment', 'Reset premiumUsageCount on subscription renewal', { userId: payment.userId }, context)
      } else {
        console.warn(`⚠️ No payment record found for subscription ${invoice.subscription}`)
        logger.warn('payment', 'No payment record found for subscription', { subscriptionId: invoice.subscription }, context)
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理发票支付成功事件失败:", error)
    logger.error('payment', '处理发票支付成功事件失败', err, undefined, context)
  }
}

// 处理发票支付失败
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, context?: any) {
  try {
    if (invoice.subscription) {
      console.log(`Invoice payment failed for subscription ${invoice.subscription}`)
      logger.warn('payment', 'Invoice payment failed', { subscriptionId: invoice.subscription }, context)
      // 这里可以添加通知用户支付失败的逻辑
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理发票支付失败事件失败:", error)
    logger.error('payment', '处理发票支付失败事件失败', err, undefined, context)
  }
}

// 获取产品描述
// 🔥 使用统一的价格配置，确保描述与产品元数据一致
function getProductDescription(productType: ProductType): string {
  const product = PRODUCT_METADATA[productType]
  if (!product) {
    return "Unknown Product"
  }

  // 使用专门为支付记录设计的详细描述
  return product.paymentDescription
}

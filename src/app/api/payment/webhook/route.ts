import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import {
  verifyWebhookSignature,
  handleSuccessfulPayment,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  ProductType
} from "@/lib/stripe"
import Stripe from "stripe"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.created":
        await handleSubscriptionCreatedEvent(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdatedEvent(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeletedEvent(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook处理失败:", error)
    return NextResponse.json(
      { error: "Webhook处理失败" },
      { status: 400 }
    )
  }
}

// 处理Checkout会话完成
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const paymentData = await handleSuccessfulPayment(session)
    
    // 创建支付记录
    await prisma.payment.create({
      data: {
        userId: paymentData.userId,
        stripeSessionId: paymentData.sessionId,
        stripePaymentId: paymentData.paymentIntentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: "COMPLETED",
        productType: paymentData.productType,
        description: getProductDescription(paymentData.productType),
      }
    })

    // 如果是次数包，增加用户的试戴次数
    if (paymentData.productType === "CREDITS_PACK") {
      await prisma.user.update({
        where: { id: paymentData.userId },
        data: {
          freeTrialsUsed: {
            decrement: 20 // 增加20次试戴机会
          }
        }
      })
    }

    console.log(`Payment completed for user ${paymentData.userId}`)
  } catch (error) {
    console.error("处理支付完成事件失败:", error)
  }
}

// 处理订阅创建
async function handleSubscriptionCreatedEvent(subscription: Stripe.Subscription) {
  try {
    const subscriptionData = await handleSubscriptionCreated(subscription)
    
    // 更新用户的高级会员状态
    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: subscriptionData.expiresAt,
      }
    })

    console.log(`Subscription created for user ${subscriptionData.userId}`)
  } catch (error) {
    console.error("处理订阅创建事件失败:", error)
  }
}

// 处理订阅更新
async function handleSubscriptionUpdatedEvent(subscription: Stripe.Subscription) {
  try {
    const subscriptionData = await handleSubscriptionUpdated(subscription)
    
    // 更新用户的高级会员状态
    const isPremiumActive = subscription.status === "active"
    
    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: isPremiumActive,
        premiumExpiresAt: isPremiumActive ? subscriptionData.expiresAt : null,
      }
    })

    console.log(`Subscription updated for user ${subscriptionData.userId}`)
  } catch (error) {
    console.error("处理订阅更新事件失败:", error)
  }
}

// 处理订阅删除
async function handleSubscriptionDeletedEvent(subscription: Stripe.Subscription) {
  try {
    const subscriptionData = await handleSubscriptionDeleted(subscription)
    
    // 取消用户的高级会员状态
    await prisma.user.update({
      where: { id: subscriptionData.userId },
      data: {
        isPremium: false,
        premiumExpiresAt: null,
      }
    })

    console.log(`Subscription deleted for user ${subscriptionData.userId}`)
  } catch (error) {
    console.error("处理订阅删除事件失败:", error)
  }
}

// 处理发票支付成功
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      console.log(`Invoice payment succeeded for subscription ${invoice.subscription}`)
    }
  } catch (error) {
    console.error("处理发票支付成功事件失败:", error)
  }
}

// 处理发票支付失败
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      console.log(`Invoice payment failed for subscription ${invoice.subscription}`)
      // 这里可以添加通知用户支付失败的逻辑
    }
  } catch (error) {
    console.error("处理发票支付失败事件失败:", error)
  }
}

// 获取产品描述
function getProductDescription(productType: ProductType): string {
  switch (productType) {
    case "PREMIUM_MONTHLY":
      return "高级会员 - 月付"
    case "PREMIUM_YEARLY":
      return "高级会员 - 年付"
    case "CREDITS_PACK":
      return "试戴次数包 - 20次"
    default:
      return "未知产品"
  }
}

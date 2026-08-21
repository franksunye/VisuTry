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
import { QUOTA_CONFIG, PRODUCT_METADATA, getProductQuota } from "@/config/pricing"
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

      case "checkout.session.async_payment_succeeded":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, ctx)
        break

      case "checkout.session.async_payment_failed":
        await handleCheckoutSessionPaymentFailed(event.data.object as Stripe.Checkout.Session, ctx)
        break

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session, ctx)
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
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    logger.info('payment', 'Checkout completed with payment still pending', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      userId: session.client_reference_id,
      productType: session.metadata?.productType,
    }, context)
    return
  }

  try {
    const paymentData = await handleSuccessfulPayment(session)

    // Payment creation, credit fulfillment, and report unlocking are atomic.
    // The unique stripeSessionId makes retries and concurrent webhook deliveries safe.
    const fulfilled = await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: {
          stripeSessionId: paymentData.sessionId,
          userId: paymentData.userId,
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: {
          stripePaymentId: paymentData.paymentIntentId,
          stripeSubscriptionId: session.subscription as string | null,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'COMPLETED',
          statusReason: 'stripe_webhook_paid',
          completedAt: new Date(),
          failedAt: null,
          description: getProductDescription(paymentData.productType, paymentData.unlockTaskId),
          ...(paymentData.attribution ? { attribution: paymentData.attribution } : {}),
          ...(paymentData.unlockTaskId ? { unlockTaskId: paymentData.unlockTaskId } : {}),
        },
      })

      if (claimed.count === 0) {
        const existing = await tx.payment.findUnique({
          where: { stripeSessionId: paymentData.sessionId },
          select: { status: true },
        })

        if (existing?.status === 'COMPLETED') return false

        // Backward compatibility for Sessions created before pending Checkout
        // rows were introduced.
        await tx.payment.create({
          data: {
            userId: paymentData.userId,
            stripeSessionId: paymentData.sessionId,
            stripePaymentId: paymentData.paymentIntentId,
            stripeSubscriptionId: session.subscription as string | null,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: "COMPLETED",
            statusReason: 'stripe_webhook_paid',
            completedAt: new Date(),
            productType: paymentData.productType,
            description: getProductDescription(paymentData.productType, paymentData.unlockTaskId),
            unlockTaskId: paymentData.unlockTaskId,
            ...(paymentData.attribution
              ? { attribution: paymentData.attribution }
              : {}),
          },
        })
      }

      if (paymentData.productType.startsWith("CREDITS_PACK")) {
        const quota = getProductQuota(paymentData.productType)
        await tx.user.update({
          where: { id: paymentData.userId },
          data: {
            creditsPurchased: {
              increment: quota
            }
          }
        })
      }

      if (paymentData.unlockTaskId) {
        await tx.faceAnalysisTask.updateMany({
          where: {
            id: paymentData.unlockTaskId,
            userId: paymentData.userId,
          },
          data: { reportUnlocked: true },
        })
      }

      return true
    })

    if (!fulfilled) {
      logger.info('payment', 'Checkout session already fulfilled', {
        sessionId: session.id,
      }, context)
      return
    }

    logger.info('payment', 'payment_fulfilled', {
      productType: paymentData.productType,
      status: 'COMPLETED',
      fulfillment: paymentData.unlockTaskId ? 'credits_and_unlock' : 'payment',
    })

    // 清除用户缓存，确保所有页面立即显示最新数据
    clearUserCache(paymentData.userId)

    console.log(`Payment completed for user ${paymentData.userId}`)
  } catch (error) {
    // A repeated Stripe event is already fulfilled; acknowledge it without
    // incrementing credits or unlocking the report again.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      logger.info('payment', 'Checkout session already fulfilled', {
        sessionId: session.id,
      }, context)
      return
    }

    const err = error instanceof Error ? error : new Error(String(error))
    console.error("处理支付完成事件失败:", error)
    logger.error('payment', 'payment_fulfillment_failed', undefined, {
      stage: 'checkout_session_completed',
      retryable: true,
    })
    // Returning a non-2xx response lets Stripe retry transient fulfillment failures.
    throw err
  }
}

async function handleCheckoutSessionPaymentFailed(session: Stripe.Checkout.Session, context?: any) {
  await markCheckoutFailed(session, 'async_payment_failed')
  logger.warn('payment', 'Asynchronous Checkout payment failed', {
    sessionId: session.id,
    userId: session.client_reference_id,
    productType: session.metadata?.productType,
    paymentStatus: session.payment_status,
  }, context)
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session, context?: any) {
  await markCheckoutFailed(session, 'checkout_session_expired')
  logger.info('payment', 'Checkout session expired before payment', {
    sessionId: session.id,
    userId: session.client_reference_id,
    productType: session.metadata?.productType,
    paymentStatus: session.payment_status,
    attribution: session.metadata?.attribution,
  }, context)
}

async function markCheckoutFailed(session: Stripe.Checkout.Session, reason: string) {
  await prisma.payment.updateMany({
    where: {
      stripeSessionId: session.id,
      status: 'PENDING',
    },
    data: {
      status: 'FAILED',
      statusReason: reason,
      failedAt: new Date(),
    },
  })
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
function getProductDescription(productType: ProductType, unlockTaskId?: string): string {
  const product = PRODUCT_METADATA[productType]
  if (!product) {
    return "Unknown Product"
  }

  if (unlockTaskId) {
    return `Personalized Glasses Advisor Report + ${getProductQuota(productType)} non-expiring credits`
  }

  // 使用专门为支付记录设计的详细描述
  return product.paymentDescription
}

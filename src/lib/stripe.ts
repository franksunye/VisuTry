import Stripe from "stripe"
import { mockStripe, isMockMode } from './mocks/stripe'
import { PRODUCT_METADATA, QUOTA_CONFIG } from '@/config/pricing'

// Only require Stripe key in production mode
if (!process.env.STRIPE_SECRET_KEY && !isMockMode && !process.env.SKIP_ENV_VALIDATION) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

export const stripe = isMockMode
  ? (mockStripe as any)
  : new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
      typescript: true,
    })

// Product configuration - now using centralized config
export const PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: PRODUCT_METADATA.PREMIUM_MONTHLY.name,
    description: `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month + Standard features`,
    price: PRODUCT_METADATA.PREMIUM_MONTHLY.price,
    currency: PRODUCT_METADATA.PREMIUM_MONTHLY.currency,
    interval: PRODUCT_METADATA.PREMIUM_MONTHLY.interval,
    priceId: PRODUCT_METADATA.PREMIUM_MONTHLY.priceId,
  },
  PREMIUM_YEARLY: {
    name: PRODUCT_METADATA.PREMIUM_YEARLY.name,
    description: `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (360 + 60 bonus) + Standard features`,
    price: PRODUCT_METADATA.PREMIUM_YEARLY.price,
    currency: PRODUCT_METADATA.PREMIUM_YEARLY.currency,
    interval: PRODUCT_METADATA.PREMIUM_YEARLY.interval,
    priceId: PRODUCT_METADATA.PREMIUM_YEARLY.priceId,
  },
  CREDITS_PACK: {
    name: PRODUCT_METADATA.CREDITS_PACK.name,
    description: `Get ${QUOTA_CONFIG.CREDITS_PACK} AI try-on credits (never expire)`,
    price: PRODUCT_METADATA.CREDITS_PACK.price,
    currency: PRODUCT_METADATA.CREDITS_PACK.currency,
    priceId: PRODUCT_METADATA.CREDITS_PACK.priceId,
  },
} as const

export type ProductType = keyof typeof PRODUCTS

// 创建Checkout会话
export async function createCheckoutSession({
  productType,
  userId,
  successUrl,
  cancelUrl,
}: {
  productType: ProductType
  userId: string
  successUrl: string
  cancelUrl: string
}) {
  const product = PRODUCTS[productType]
  
  if (!product.priceId) {
    throw new Error(`Price ID not configured for product: ${productType}`)
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: productType === "CREDITS_PACK" ? "payment" : "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      productType,
    },
  }

  // 对于订阅，添加试用期配置
  if (productType !== "CREDITS_PACK") {
    sessionParams.subscription_data = {
      metadata: {
        userId,
        productType,
      },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session
}

// 获取客户的订阅信息
export async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
  })
  
  return subscriptions.data
}

// 取消订阅
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

// 验证Webhook签名
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// 处理成功的支付
export async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  const productType = session.metadata?.productType as ProductType
  
  if (!userId || !productType) {
    throw new Error("Missing required metadata in checkout session")
  }

  return {
    userId,
    productType,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    sessionId: session.id,
    paymentIntentId: session.payment_intent as string,
  }
}

// 处理订阅创建
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const productType = subscription.metadata?.productType as ProductType
  
  if (!userId || !productType) {
    throw new Error("Missing required metadata in subscription")
  }

  // 计算到期时间
  const expiresAt = new Date(subscription.current_period_end * 1000)
  
  return {
    userId,
    productType,
    subscriptionId: subscription.id,
    status: subscription.status,
    expiresAt,
  }
}

// 处理订阅更新
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    throw new Error("Missing userId in subscription metadata")
  }

  const expiresAt = new Date(subscription.current_period_end * 1000)
  
  return {
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    expiresAt,
  }
}

// 处理订阅删除
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    throw new Error("Missing userId in subscription metadata")
  }

  return {
    userId,
    subscriptionId: subscription.id,
  }
}

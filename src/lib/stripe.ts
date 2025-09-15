import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
})

// 产品配置
export const PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: "高级会员 - 月付",
    description: "无限次AI试戴 + 高级功能",
    price: 999, // 9.99 USD in cents
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  },
  PREMIUM_YEARLY: {
    name: "高级会员 - 年付",
    description: "无限次AI试戴 + 高级功能 + 2个月免费",
    price: 9999, // 99.99 USD in cents
    currency: "usd",
    interval: "year" as const,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  },
  CREDITS_PACK: {
    name: "试戴次数包",
    description: "额外获得20次AI试戴机会",
    price: 299, // 2.99 USD in cents
    currency: "usd",
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID,
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

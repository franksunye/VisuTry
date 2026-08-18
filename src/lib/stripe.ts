import Stripe from "stripe"
import { mockStripe, isMockMode } from './mocks/stripe'
import { PRODUCT_METADATA, QUOTA_CONFIG } from '@/config/pricing'
import type { AcquisitionAttribution } from '@/lib/acquisition-attribution'
import {
  parseAttributionFromStripeMetadata,
  sanitizeAcquisitionAttribution,
  serializeAttributionForStripe,
} from '@/lib/acquisition-attribution'
import type { Locale } from '@/i18n'

// Only require Stripe key in production mode. Cloudflare Workers Builds has no
// Vercel secrets; skip the import-time check and do not construct Stripe.
if (
  !process.env.STRIPE_SECRET_KEY &&
  !isMockMode &&
  !process.env.SKIP_ENV_VALIDATION &&
  process.env.CLOUDFLARE_BUILD !== '1'
) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

export const stripe = isMockMode
  ? (mockStripe as any)
  : process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
        typescript: true,
      })
    : (mockStripe as any)

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
    description: `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (1080 + 180 bonus) + Standard features`,
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
  CREDITS_PACK_PROMO_60: {
    name: PRODUCT_METADATA.CREDITS_PACK_PROMO_60.name,
    description: PRODUCT_METADATA.CREDITS_PACK_PROMO_60.description,
    price: PRODUCT_METADATA.CREDITS_PACK_PROMO_60.price,
    currency: PRODUCT_METADATA.CREDITS_PACK_PROMO_60.currency,
    priceId: PRODUCT_METADATA.CREDITS_PACK_PROMO_60.priceId,
  },
  PREMIUM_MONTHLY_PROMO: {
    name: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.name,
    description: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.description,
    price: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.price,
    currency: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.currency,
    interval: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.interval,
    priceId: PRODUCT_METADATA.PREMIUM_MONTHLY_PROMO.priceId,
  },
  PREMIUM_YEARLY_PROMO: {
    name: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.name,
    description: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.description,
    price: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.price,
    currency: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.currency,
    interval: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.interval,
    priceId: PRODUCT_METADATA.PREMIUM_YEARLY_PROMO.priceId,
  },
} as const

export type ProductType = keyof typeof PRODUCTS

const STRIPE_CHECKOUT_LOCALES: Record<Locale, Stripe.Checkout.SessionCreateParams.Locale> = {
  en: 'en',
  id: 'id',
  // The pinned Stripe API version doesn't expose Arabic as an explicit locale.
  // Auto still lets Checkout use the customer's browser language when supported.
  ar: 'auto',
  ru: 'ru',
  de: 'de',
  ja: 'ja',
  es: 'es',
  pt: 'pt',
  fr: 'fr',
}

const CREDIT_CHECKOUT_MESSAGES: Record<Locale, (credits: number) => string> = {
  en: (credits) => `One-time purchase: ${credits} AI credits that never expire. Face analysis purchases unlock the full report automatically.`,
  id: (credits) => `Pembelian satu kali: ${credits} kredit AI yang tidak kedaluwarsa. Pembelian dari analisis wajah membuka laporan lengkap secara otomatis.`,
  ar: (credits) => `عملية شراء لمرة واحدة: ${credits} رصيدًا للذكاء الاصطناعي لا تنتهي صلاحيته. عند الشراء من تحليل الوجه، يُفتح التقرير الكامل تلقائيًا.`,
  ru: (credits) => `Разовая покупка: ${credits} AI-кредитов без ограничения срока действия. При покупке из анализа лица полный отчёт откроется автоматически.`,
  de: (credits) => `Einmaliger Kauf: ${credits} AI-Credits ohne Ablaufdatum. Beim Kauf über die Gesichtsanalyse wird der vollständige Bericht automatisch freigeschaltet.`,
  ja: (credits) => `1回限りの購入：有効期限のないAIクレジット${credits}回分。顔分析から購入すると、完全版レポートが自動で解除されます。`,
  es: (credits) => `Compra única: ${credits} créditos de IA que no caducan. Si compras desde el análisis facial, el informe completo se desbloquea automáticamente.`,
  pt: (credits) => `Compra única: ${credits} créditos de IA que não expiram. Ao comprar pela análise facial, o relatório completo é desbloqueado automaticamente.`,
  fr: (credits) => `Achat unique : ${credits} crédits IA sans expiration. Depuis l’analyse du visage, le rapport complet est débloqué automatiquement.`,
}

const REPORT_UNLOCK_CHECKOUT_MESSAGES: Record<Locale, (credits: number) => string> = {
  en: (credits) => `Pay once to unlock this personalized glasses report. You will also receive ${credits} non-expiring credits to try and compare your shortlist.`,
  id: (credits) => `Bayar sekali untuk membuka laporan kacamata personal ini. Anda juga menerima ${credits} kredit tanpa kedaluwarsa untuk mencoba dan membandingkan pilihan Anda.`,
  ar: (credits) => `ادفع مرة واحدة لفتح تقرير النظارات المخصص هذا. ستحصل أيضًا على ${credits} رصيدًا لا تنتهي صلاحيته لتجربة خياراتك ومقارنتها.`,
  ru: (credits) => `Оплатите один раз, чтобы открыть этот персональный отчёт по очкам. Вы также получите ${credits} бессрочных кредитов для примерки и сравнения выбранных оправ.`,
  de: (credits) => `Einmal bezahlen und diesen persönlichen Brillenbericht freischalten. Zusätzlich erhalten Sie ${credits} Credits ohne Ablaufdatum, um Ihre Auswahl anzuprobieren und zu vergleichen.`,
  ja: (credits) => `1回のお支払いで、このパーソナライズされたメガネレポートを解除できます。候補の試着・比較に使える有効期限なしのクレジット${credits}回分も含まれます。`,
  es: (credits) => `Paga una vez para desbloquear este informe personalizado de gafas. También recibirás ${credits} créditos sin caducidad para probar y comparar tu selección.`,
  pt: (credits) => `Pague uma vez para desbloquear este relatório personalizado de óculos. Também recebe ${credits} créditos sem validade para experimentar e comparar a sua seleção.`,
  fr: (credits) => `Payez une fois pour débloquer ce rapport de lunettes personnalisé. Vous recevrez aussi ${credits} crédits sans expiration pour essayer et comparer votre sélection.`,
}

const SUBSCRIPTION_CHECKOUT_MESSAGES: Record<Locale, string> = {
  en: 'Secure subscription. Manage or cancel anytime from your billing portal.',
  id: 'Langganan aman. Kelola atau batalkan kapan saja melalui portal penagihan.',
  ar: 'اشتراك آمن. يمكنك إدارته أو إلغاؤه في أي وقت من بوابة الفوترة.',
  ru: 'Безопасная подписка. Управлять подпиской или отменить её можно в любое время в платёжном кабинете.',
  de: 'Sicheres Abonnement. Jederzeit im Abrechnungsportal verwalten oder kündigen.',
  ja: '安全なサブスクリプションです。請求ポータルからいつでも管理・解約できます。',
  es: 'Suscripción segura. Puedes gestionarla o cancelarla en cualquier momento desde el portal de facturación.',
  pt: 'Subscrição segura. Pode geri-la ou cancelá-la a qualquer momento no portal de faturação.',
  fr: 'Abonnement sécurisé. Gérez-le ou résiliez-le à tout moment depuis le portail de facturation.',
}

// 创建Checkout会话
export async function createCheckoutSession({
  productType,
  userId,
  successUrl,
  cancelUrl,
  unlockTaskId,
  attribution,
  customerEmail,
  checkoutLocale = 'en',
}: {
  productType: ProductType
  userId: string
  successUrl: string
  cancelUrl: string
  unlockTaskId?: string
  attribution?: AcquisitionAttribution
  customerEmail?: string | null
  checkoutLocale?: Locale
}) {
  const product = PRODUCTS[productType]

  if (!product.priceId) {
    throw new Error(`Price ID not configured for product: ${productType}`)
  }

  const sanitizedAttribution = sanitizeAcquisitionAttribution(attribution)
  const serializedAttribution = serializeAttributionForStripe(sanitizedAttribution)
  const normalizedEmail = customerEmail?.trim()
  const isCreditsPurchase = productType.startsWith("CREDITS_PACK")

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: isCreditsPurchase ? "payment" : "subscription",
    // Let Stripe dynamically show the enabled methods that best match the
    // customer's device, currency, and location (for example, Google Pay).
    after_expiration: {
      recovery: {
        enabled: true,
      },
    },
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    locale: STRIPE_CHECKOUT_LOCALES[checkoutLocale],
    custom_text: {
      submit: {
        message: isCreditsPurchase
          ? unlockTaskId
            ? REPORT_UNLOCK_CHECKOUT_MESSAGES[checkoutLocale](PRODUCT_METADATA[productType].quota)
            : CREDIT_CHECKOUT_MESSAGES[checkoutLocale](PRODUCT_METADATA[productType].quota)
          : SUBSCRIPTION_CHECKOUT_MESSAGES[checkoutLocale],
      },
    },
    ...(normalizedEmail && normalizedEmail.length <= 800 && normalizedEmail.includes('@')
      ? { customer_email: normalizedEmail }
      : {}),
    metadata: {
      userId,
      productType,
      ...(unlockTaskId ? { unlockTaskId } : {}),
      ...(serializedAttribution ? { attribution: serializedAttribution } : {}),
    },
  }

  // 对于订阅，添加订阅元数据（Credits Pack 系列都是一次性付款，不需要）
  if (!isCreditsPurchase) {
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

// Create Stripe customer billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
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
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
    unlockTaskId: session.metadata?.unlockTaskId,
    attribution: parseAttributionFromStripeMetadata(session.metadata),
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

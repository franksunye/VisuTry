import type Stripe from "stripe"
import { getProductQuota } from "@/config/pricing"

const CREDIT_PRODUCT_TYPES = ["CREDITS_PACK", "CREDITS_PACK_PROMO_60"] as const
const CREDIT_REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

type CreditProductType = (typeof CREDIT_PRODUCT_TYPES)[number]

type RefundUser = {
  id: string
  email: string | null
  creditsPurchased: number
  creditsUsed: number
}

type RefundPayment = {
  id: string
  userId: string
  stripePaymentId: string | null
  amount: number
  currency: string
  status: string
  productType: string
  createdAt: Date
  refundId: string | null
  refundedAt: Date | null
  creditsRevoked: number
  user: RefundUser
}

type RefundTransactionClient = {
  payment: {
    findUnique: (args: unknown) => Promise<RefundPayment | null>
    updateMany: (args: unknown) => Promise<{ count: number }>
  }
  user: {
    updateMany: (args: unknown) => Promise<{ count: number }>
  }
}

type RefundPrismaClient = {
  payment: {
    findUnique: (args: unknown) => Promise<RefundPayment | null>
    findMany: (args: unknown) => Promise<Array<{ id: string; productType: string }>>
  }
  $transaction: <T>(callback: (tx: RefundTransactionClient) => Promise<T>) => Promise<T>
}

type RefundStripeClient = {
  refunds: {
    list: (params: Stripe.RefundListParams) => Promise<Stripe.ApiList<Stripe.Refund>>
    create: (
      params: Stripe.RefundCreateParams,
      options?: Stripe.RequestOptions,
    ) => Promise<Stripe.Refund>
  }
}

export type RefundMode = "dry-run" | "execute"

export type RefundPreflight = {
  payment: RefundPayment
  creditPaymentCount: number
  creditsToRevoke: number
  canExecute: boolean
  reasons: string[]
}

export type RefundResult = {
  mode: RefundMode
  status: "DRY_RUN" | "REFUNDED" | "ALREADY_REFUNDED"
  paymentId: string
  stripeRefundId?: string
  creditsRevoked: number
  preflight: RefundPreflight
}

export type RefundDependencies = {
  prisma: RefundPrismaClient
  stripe: RefundStripeClient
  clearUserCache: (userId: string) => void
  now?: () => Date
}

export class RefundPreflightError extends Error {
  constructor(public readonly preflight: RefundPreflight) {
    super(`Refund preflight failed: ${preflight.reasons.join("; ")}`)
    this.name = "RefundPreflightError"
  }
}

function isCreditProduct(productType: string): productType is CreditProductType {
  return (CREDIT_PRODUCT_TYPES as readonly string[]).includes(productType)
}

function paymentQuery(paymentId: string) {
  return {
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          creditsPurchased: true,
          creditsUsed: true,
        },
      },
    },
  }
}

async function loadPayment(
  prisma: RefundPrismaClient,
  paymentId: string,
): Promise<RefundPayment> {
  const payment = await prisma.payment.findUnique(paymentQuery(paymentId))
  if (!payment) throw new Error(`Payment not found: ${paymentId}`)
  return payment
}

export async function inspectPaymentRefund(
  dependencies: Pick<RefundDependencies, "prisma"> & { now?: () => Date },
  paymentId: string,
): Promise<RefundPreflight> {
  const payment = await loadPayment(dependencies.prisma, paymentId)
  const now = (dependencies.now ?? (() => new Date()))()
  const reasons: string[] = []
  let creditPaymentCount = 0
  let creditsToRevoke = 0

  if (payment.status === "REFUNDED" || payment.refundId) {
    reasons.push("payment is already marked as refunded")
  } else if (payment.status !== "COMPLETED") {
    reasons.push(`payment status is ${payment.status}, expected COMPLETED`)
  }

  if (!payment.stripePaymentId) reasons.push("payment has no Stripe PaymentIntent")
  if (!isCreditProduct(payment.productType)) {
    reasons.push(`unsupported product type ${payment.productType}; only Credits Packs are automated`)
  }

  if (isCreditProduct(payment.productType)) {
    const creditPayments = await dependencies.prisma.payment.findMany({
      where: {
        userId: payment.userId,
        status: "COMPLETED",
        productType: { in: [...CREDIT_PRODUCT_TYPES] },
      },
      select: { id: true, productType: true },
    })
    creditPaymentCount = creditPayments.length
    const quota = getProductQuota(payment.productType)
    const ageMs = now.getTime() - payment.createdAt.getTime()

    if (ageMs < 0 || ageMs > CREDIT_REFUND_WINDOW_MS) {
      reasons.push("Credits Pack is outside the 7-day refund window")
    }
    if (payment.user.creditsUsed !== 0) {
      reasons.push("user has already used credits; automatic full refund is blocked")
    }
    if (creditPaymentCount !== 1) {
      reasons.push("credit ownership is ambiguous because the user has multiple completed Credits Pack payments")
    }
    if (payment.user.creditsPurchased !== quota) {
      reasons.push(`user balance is ${payment.user.creditsPurchased} purchased credits, expected ${quota}`)
    }

    if (
      payment.status === "COMPLETED" &&
      !payment.refundId &&
      payment.stripePaymentId &&
      ageMs >= 0 &&
      ageMs <= CREDIT_REFUND_WINDOW_MS &&
      payment.user.creditsUsed === 0 &&
      creditPaymentCount === 1 &&
      payment.user.creditsPurchased === quota
    ) {
      creditsToRevoke = quota
    }
  }

  return {
    payment,
    creditPaymentCount,
    creditsToRevoke,
    canExecute: reasons.length === 0,
    reasons,
  }
}

function getActiveRefunds(
  refunds: Stripe.ApiList<Stripe.Refund>,
): Stripe.Refund[] {
  return refunds.data.filter((refund) => refund.status === "succeeded" || refund.status === "pending")
}

async function getOrCreateFullRefund(
  dependencies: RefundDependencies,
  preflight: RefundPreflight,
): Promise<Stripe.Refund> {
  const stripePaymentId = preflight.payment.stripePaymentId
  if (!stripePaymentId) throw new Error("Payment has no Stripe PaymentIntent")

  const existing = await dependencies.stripe.refunds.list({
    payment_intent: stripePaymentId,
    limit: 100,
  })
  const activeRefunds = getActiveRefunds(existing)
  const refundedAmount = activeRefunds.reduce((sum, refund) => sum + refund.amount, 0)

  if (refundedAmount > 0 && refundedAmount < preflight.payment.amount) {
    throw new Error("Stripe already contains a partial refund; automatic full refund is blocked")
  }
  if (refundedAmount >= preflight.payment.amount && activeRefunds[0]) {
    return activeRefunds[0]
  }

  return dependencies.stripe.refunds.create(
    {
      payment_intent: stripePaymentId,
      reason: "requested_by_customer",
    },
    { idempotencyKey: `visutry-refund-${preflight.payment.id}` },
  )
}

export async function refundPayment(
  dependencies: RefundDependencies,
  request: { paymentId: string; mode: RefundMode; confirmation?: string },
): Promise<RefundResult> {
  const preflight = await inspectPaymentRefund(dependencies, request.paymentId)

  if (request.mode === "dry-run") {
    return {
      mode: request.mode,
      status: "DRY_RUN",
      paymentId: request.paymentId,
      creditsRevoked: 0,
      preflight,
    }
  }

  if (preflight.payment.refundId && preflight.payment.status === "REFUNDED") {
    return {
      mode: request.mode,
      status: "ALREADY_REFUNDED",
      paymentId: request.paymentId,
      stripeRefundId: preflight.payment.refundId,
      creditsRevoked: preflight.payment.creditsRevoked,
      preflight,
    }
  }

  if (request.confirmation !== request.paymentId) {
    throw new Error("Execution requires --confirm <paymentId>")
  }
  if (!preflight.canExecute) throw new RefundPreflightError(preflight)

  const stripeRefund = await getOrCreateFullRefund(dependencies, preflight)
  if (stripeRefund.status !== "succeeded" && stripeRefund.status !== "pending") {
    throw new Error(`Stripe refund ${stripeRefund.id} has status ${stripeRefund.status}`)
  }

  const creditsRevoked = await dependencies.prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique(paymentQuery(request.paymentId))
    if (!currentPayment) throw new Error(`Payment disappeared during refund: ${request.paymentId}`)
    if (currentPayment.refundId === stripeRefund.id || currentPayment.status === "REFUNDED") {
      return currentPayment.creditsRevoked
    }
    if (currentPayment.status !== "COMPLETED") {
      throw new Error(`Payment changed during refund: ${currentPayment.status}`)
    }

    const claimed = await tx.payment.updateMany({
      where: { id: request.paymentId, status: "COMPLETED", refundId: null },
      data: {
        status: "REFUNDED",
        statusReason: `stripe_refund:${stripeRefund.id}`,
        refundId: stripeRefund.id,
        refundedAt: new Date(),
        creditsRevoked: preflight.creditsToRevoke,
      },
    })
    if (claimed.count !== 1) throw new Error("Refund claim lost a concurrent update")

    if (preflight.creditsToRevoke > 0) {
      const updatedUser = await tx.user.updateMany({
        where: {
          id: currentPayment.userId,
          creditsUsed: 0,
          creditsPurchased: { gte: preflight.creditsToRevoke },
        },
        data: { creditsPurchased: { decrement: preflight.creditsToRevoke } },
      })
      if (updatedUser.count !== 1) {
        throw new Error("User credits changed during refund; transaction rolled back")
      }
    }

    return preflight.creditsToRevoke
  })

  dependencies.clearUserCache(preflight.payment.userId)
  return {
    mode: request.mode,
    status: "REFUNDED",
    paymentId: request.paymentId,
    stripeRefundId: stripeRefund.id,
    creditsRevoked,
    preflight,
  }
}

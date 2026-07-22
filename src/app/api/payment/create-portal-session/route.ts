import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { createBillingPortalSession, stripe } from "@/lib/stripe"
import { isMockMode } from "@/lib/mocks"
import { logger, getRequestContext } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const body = await request.json().catch(() => ({}))
    const returnUrl =
      typeof body.returnUrl === "string" && body.returnUrl.startsWith("http")
        ? body.returnUrl
        : `${request.nextUrl.origin}/payments`

    if (isMockMode) {
      return NextResponse.json({
        success: true,
        data: { url: returnUrl },
      })
    }

    const latestSubscriptionPayment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        stripeSubscriptionId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { stripeSubscriptionId: true },
    })

    if (!latestSubscriptionPayment?.stripeSubscriptionId) {
      return NextResponse.json(
        { success: false, error: "No active subscription found" },
        { status: 404 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(
      latestSubscriptionPayment.stripeSubscriptionId
    )
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Stripe customer not found" },
        { status: 404 }
      )
    }

    const portalSession = await createBillingPortalSession(customerId, returnUrl)
    logger.info(
      "payment",
      "Billing portal session created",
      { userId: userId, customerId },
      ctx
    )

    return NextResponse.json({
      success: true,
      data: { url: portalSession.url },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error("payment", "Failed to create billing portal session", err, undefined, ctx)
    return NextResponse.json(
      { success: false, error: "Failed to create billing portal session" },
      { status: 500 }
    )
  }
}

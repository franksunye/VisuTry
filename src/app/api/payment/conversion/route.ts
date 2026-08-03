import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeAcquisitionAttribution } from '@/lib/acquisition-attribution'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const sessionId = request.nextUrl.searchParams.get('session_id')?.trim()
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json(
      { success: false, error: 'A valid checkout session ID is required' },
      { status: 400 },
    )
  }

  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      userId: true,
      stripeSessionId: true,
      amount: true,
      currency: true,
      status: true,
      productType: true,
      attribution: true,
    },
  })

  // Stripe can redirect before the webhook transaction is committed. A 202
  // tells the client to retry without exposing whether another user's session
  // exists.
  if (!payment) {
    return NextResponse.json(
      { success: true, status: 'pending' },
      { status: 202 },
    )
  }

  if (payment.userId !== auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Payment not found' },
      { status: 404 },
    )
  }

  if (payment.status !== 'COMPLETED') {
    return NextResponse.json({ success: true, status: payment.status.toLowerCase() })
  }

  const attribution = sanitizeAcquisitionAttribution(payment.attribution)

  return NextResponse.json({
    success: true,
    status: 'completed',
    data: {
      transactionId: payment.stripeSessionId,
      productType: payment.productType,
      value: payment.amount / 100,
      currency: payment.currency.toUpperCase(),
      ...(attribution ? { attribution } : {}),
    },
  })
}

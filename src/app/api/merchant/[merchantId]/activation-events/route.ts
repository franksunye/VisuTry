import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { recordMerchantActivationEvent } from '@/modules/merchant/application/merchant-activation'
import { MERCHANT_ACTIVATION_CLIENT_EVENTS } from '@/modules/merchant/domain/merchant-activation'

export const dynamic = 'force-dynamic'

const attributionSchema = z.object({
  landingPage: z.string().max(240).optional(),
  acquisitionSource: z.string().max(120).optional(),
  acquisitionMedium: z.string().max(80).optional(),
  referrerHost: z.string().max(255).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(160).optional(),
  commercialIntent: z.string().max(32).optional(),
  signupCorrelationId: z.string().max(96).optional(),
  landingLocale: z.string().max(16).optional(),
}).strict()

const eventSchema = z.object({
  eventType: z.enum(MERCHANT_ACTIVATION_CLIENT_EVENTS),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,96}$/u),
  correlationId: z.string().regex(/^[A-Za-z0-9_-]{8,96}$/u).optional(),
  resourceId: z.string().regex(/^[A-Za-z0-9_-]{1,96}$/u).optional(),
  commercialIntent: z.enum(['FREE', 'FOUNDING_PILOT', 'LAUNCH', 'GROWTH', 'SCALE']).optional(),
  attribution: attributionSchema.optional(),
}).strict()

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_ACTIVATION_EVENT' }, { status: 400 })
  if (parsed.data.eventType === 'merchant_commercial_intent' && !parsed.data.commercialIntent) {
    return NextResponse.json({ success: false, error: 'COMMERCIAL_INTENT_REQUIRED' }, { status: 400 })
  }

  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    await recordMerchantActivationEvent({
      merchantId: params.merchantId,
      eventType: parsed.data.eventType,
      source: 'CLIENT',
      sessionId: parsed.data.sessionId,
      correlationId: parsed.data.correlationId,
      resourceId: parsed.data.resourceId,
      intent: parsed.data.commercialIntent,
      attribution: parsed.data.attribution,
    })
    return NextResponse.json({ success: true, data: { recorded: true } })
  } catch (error) {
    if (error instanceof Error && error.name === 'MerchantAccessError') {
      return NextResponse.json({ success: false, error: 'MERCHANT_ACCESS_NOT_FOUND' }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

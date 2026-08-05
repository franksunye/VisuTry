import { NextRequest, NextResponse } from 'next/server'
import { parseCreateSessionRequest, storeApiError } from '@/modules/store/contracts'
import {
  assertStoreSessionCreateAllowed,
  clientIpFromRequest,
  createStoreRuntime,
  createStoreSession,
  storeErrorResponse,
} from '@/modules/store/application'
import { applyStoreCapabilityCookie } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseCreateSessionRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid session request', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const merchant = await runtime.merchants.findBySlug(parsed.data.merchantSlug)
    if (merchant) {
      await assertStoreSessionCreateAllowed({
        merchantId: merchant.id,
        ip: clientIpFromRequest(request.headers),
      })
    }

    const result = await createStoreSession({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      events: runtime.events,
      usage: runtime.usage,
      slug: parsed.data.merchantSlug,
      locale: parsed.data.locale ?? null,
      anonymousVisitorId: parsed.data.anonymousVisitorId ?? null,
      deviceType: parsed.data.deviceType ?? null,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        merchantId: result.merchantId,
        merchantSessionId: result.merchantSessionId,
        expiresAt: result.expiresAt,
      },
    })

    applyStoreCapabilityCookie(response, result.capabilityToken)
    return response
  } catch (error) {
    return storeErrorResponse(error)
  }
}

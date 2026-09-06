import { NextRequest, NextResponse } from 'next/server'
import { parseCreateSessionRequest, storeApiError } from '@/modules/store/contracts'
import {
  assertStoreSessionCreateAllowed,
  clientIpFromRequest,
  createStoreRuntime,
  createStoreSession,
  storeErrorResponse,
} from '@/modules/store/application'
import {
  applyStoreCapabilityCookie,
  applyStoreVisitorCookie,
  ensureStoreVisitorIdentity,
} from '@/modules/store/infrastructure'

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
    const visitor = ensureStoreVisitorIdentity(request)
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
      usage: runtime.usage,
      analytics: runtime.analytics,
      experiences: runtime.experiences,
      slug: parsed.data.merchantSlug,
      experienceSlug: parsed.data.experienceSlug ?? null,
      locale: parsed.data.locale ?? null,
      anonymousVisitorId: visitor.identity.tokenHash,
      deviceType: parsed.data.deviceType ?? null,
      acquisition: parsed.data.acquisition ?? null,
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
    if (visitor.created) applyStoreVisitorCookie(response, visitor.identity.token)
    return response
  } catch (error) {
    return storeErrorResponse(error)
  }
}

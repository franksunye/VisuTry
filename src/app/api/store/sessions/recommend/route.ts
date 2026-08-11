import { NextRequest, NextResponse } from 'next/server'
import { parseRecommendFramesRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  recommendMerchantFrames,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseRecommendFramesRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid recommendation request', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await recommendMerchantFrames({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      experiences: runtime.experiences,
      events: runtime.events,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      signals: {
        measuredShape: parsed.data.measuredShape,
        faceAspectRatio: parsed.data.faceAspectRatio,
        styleHints: parsed.data.styleHints,
      },
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
      limit: parsed.data.limit,
      clientActionId: parsed.data.clientActionId ?? null,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

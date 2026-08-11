import { NextRequest, NextResponse } from 'next/server'
import { parseSelectFramesRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  recordFrameSelections,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseSelectFramesRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid frame selection', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await recordFrameSelections({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      experiences: runtime.experiences,
      events: runtime.events,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      frameIds: parsed.data.frameIds,
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
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

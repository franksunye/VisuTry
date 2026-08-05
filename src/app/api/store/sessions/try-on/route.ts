import { NextRequest, NextResponse } from 'next/server'
import { parseStoreTryOnSubmitRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  storeErrorResponse,
  submitStoreFrameTryOn,
  clientIpFromRequest,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseStoreTryOnSubmitRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid try-on request', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await submitStoreFrameTryOn({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      events: runtime.events,
      usage: runtime.usage,
      assets: runtime.assets,
      generation: runtime.generation,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      merchantFrameId: parsed.data.merchantFrameId,
      batchId: parsed.data.batchId,
      clientSubmissionId: parsed.data.clientSubmissionId,
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
      clientIp: clientIpFromRequest(request.headers),
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

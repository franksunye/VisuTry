import { NextRequest, NextResponse } from 'next/server'
import { parseRecordIntentRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  recordStoreIntent,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseRecordIntentRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid intent request', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await recordStoreIntent({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      intents: runtime.intents,
      events: runtime.events,
      experiences: runtime.experiences,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      type: parsed.data.type,
      merchantFrameId: parsed.data.merchantFrameId ?? null,
      clientActionId: parsed.data.clientActionId,
      email: parsed.data.email ?? null,
      name: parsed.data.name ?? null,
      note: parsed.data.note ?? null,
      productUrl: parsed.data.productUrl ?? null,
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

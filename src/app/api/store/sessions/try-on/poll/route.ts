import { NextRequest, NextResponse } from 'next/server'
import { parseStoreTryOnPollRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  pollStoreFrameTryOn,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseStoreTryOnPollRequest(body)
    if (!parsed.ok) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid poll request', parsed.issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await pollStoreFrameTryOn({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      events: runtime.events,
      usage: runtime.usage,
      generation: runtime.generation,
      experiences: runtime.experiences,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      taskId: parsed.data.taskId,
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

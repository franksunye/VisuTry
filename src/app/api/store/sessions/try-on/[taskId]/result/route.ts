import { NextRequest, NextResponse } from 'next/server'
import {
  createStoreRuntime,
  resolveStoreTryOnResult,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Capability-authenticated Store try-on result media.
 * Private Blob URLs must never be handed to the browser as img src.
 */
export async function GET(
  request: NextRequest,
  context: { params: { taskId: string } },
) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantSlug = searchParams.get('merchantSlug')
    const merchantSessionId = searchParams.get('merchantSessionId')
    if (!merchantSlug || !merchantSessionId) {
      return NextResponse.json(
        { success: false, error: 'merchantSlug and merchantSessionId are required' },
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await resolveStoreTryOnResult({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      experiences: runtime.experiences,
      slug: merchantSlug,
      merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      taskId: context.params.taskId,
    })

    return new NextResponse(new Uint8Array(result.body), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

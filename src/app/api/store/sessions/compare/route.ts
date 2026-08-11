import { NextRequest, NextResponse } from 'next/server'
import { requireString, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  recordCompareStarted,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid compare request'),
        { status: 400 },
      )
    }
    const record = body as Record<string, unknown>
    const issues = [
      requireString(record.merchantSlug, 'merchantSlug', 120),
      requireString(record.merchantSessionId, 'merchantSessionId', 120),
      requireString(record.clientActionId, 'clientActionId', 200),
    ].filter(Boolean) as { path: string; message: string }[]

    if (record.frameIds !== undefined && !Array.isArray(record.frameIds)) {
      issues.push({ path: 'frameIds', message: 'frameIds must be an array of strings' })
    }

    if (issues.length) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Invalid compare request', issues),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const result = await recordCompareStarted({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      events: runtime.events,
      experiences: runtime.experiences,
      slug: String(record.merchantSlug).trim(),
      merchantSessionId: String(record.merchantSessionId).trim(),
      capabilityToken: readStoreCapabilityToken(request),
      clientActionId: String(record.clientActionId).trim(),
      locale: typeof record.locale === 'string' ? record.locale : null,
      deviceType: typeof record.deviceType === 'string' ? record.deviceType : null,
      frameIds: Array.isArray(record.frameIds)
        ? record.frameIds.filter((id): id is string => typeof id === 'string').map((id) => id.trim()).filter(Boolean)
        : undefined,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

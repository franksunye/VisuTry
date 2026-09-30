import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { parseStoreTryOnSubmitRequest, storeApiError } from '@/modules/store/contracts'
import {
  createStoreRuntime,
  createDecisionResultAssetRef,
  presentPreparedDemoResult,
  resolveStoreTryOnExecutionMode,
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
    const authSession = await getServerSession(authOptions)
    const merchant = await runtime.merchants.findBySlug(parsed.data.merchantSlug)
    if (merchant && resolveStoreTryOnExecutionMode(merchant) === 'PREPARED_DEMO') {
      if (!parsed.data.decisionResultToken) {
        return NextResponse.json(
          storeApiError('VALIDATION_ERROR', 'A private Decision Result is required for this Demo result.'),
          { status: 409 },
        )
      }
      const result = await presentPreparedDemoResult({
        merchants: runtime.merchants,
        frames: runtime.frames,
        sessions: runtime.sessions,
        experiences: runtime.experiences,
        decisionResults: runtime.decisionResults,
        assets: runtime.assets,
        slug: parsed.data.merchantSlug,
        merchantSessionId: parsed.data.merchantSessionId,
        capabilityToken: readStoreCapabilityToken(request),
        shareToken: parsed.data.decisionResultToken,
        merchantFrameId: parsed.data.merchantFrameId,
        locale: parsed.data.locale ?? null,
        deviceType: parsed.data.deviceType ?? null,
      })
      const reference = {
        source: 'PREPARED_DEMO' as const,
        sourceRef: result.sourceRef,
        frameId: result.merchantFrameId,
        status: 'PREPARED' as const,
        presentedAt: result.presentedAt,
      }
      const assetRef = createDecisionResultAssetRef(parsed.data.decisionResultToken, reference)
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          status: 'prepared',
          taskId: null,
          imageUrl: `/api/store/results/${encodeURIComponent(parsed.data.decisionResultToken)}/try-on/${assetRef}`,
        },
      })
    }

    const result = await submitStoreFrameTryOn({
      merchants: runtime.merchants,
      frames: runtime.frames,
      sessions: runtime.sessions,
      events: runtime.events,
      usage: runtime.usage,
      sponsoredUsage: runtime.sponsoredUsage,
      assets: runtime.assets,
      generation: runtime.generation,
      experiences: runtime.experiences,
      slug: parsed.data.merchantSlug,
      merchantSessionId: parsed.data.merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      merchantFrameId: parsed.data.merchantFrameId,
      batchId: parsed.data.batchId,
      clientSubmissionId: parsed.data.clientSubmissionId,
      locale: parsed.data.locale ?? null,
      deviceType: parsed.data.deviceType ?? null,
      clientIp: clientIpFromRequest(request.headers),
      userId: authSession?.user?.id ?? null,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

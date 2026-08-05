import { NextRequest, NextResponse } from 'next/server'
import {
  createStoreRuntime,
  resolveStoreSessionAsset,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Capability-authenticated media proxy.
 * Raw Blob URLs must not be treated as shopper authorization.
 */
export async function GET(
  request: NextRequest,
  context: { params: { assetId: string } },
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
    const asset = await resolveStoreSessionAsset({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      assets: runtime.assets,
      slug: merchantSlug,
      merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      assetId: context.params.assetId,
    })

    return new NextResponse(new Uint8Array(asset.body), {
      status: 200,
      headers: {
        'Content-Type': asset.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

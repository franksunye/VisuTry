import { NextRequest, NextResponse } from 'next/server'
import {
  createStoreRuntime,
  resolveStoreSessionAsset,
  resolveStoreSessionAssetAccess,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'
import { isMockMode } from '@/lib/mocks'
import {
  createPrivateBlobGetUrl,
  privateBlobRedirect,
} from '@/lib/blob/private-signed-url'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Capability-authenticated media delivery.
 * Raw Blob URLs are never treated as shopper authorization; private assets
 * receive an exact-path signed redirect after the application checks.
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
    const access = await resolveStoreSessionAssetAccess({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      assets: runtime.assets,
      slug: merchantSlug,
      merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      assetId: context.params.assetId,
    })

    if (access.accessMode === 'PRIVATE_SIGNED' && !isMockMode) {
      const grant = await createPrivateBlobGetUrl({
        pathname: access.storageKey,
        businessExpiresAt: access.expiresAt,
      })
      return privateBlobRedirect(grant.url)
    }

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

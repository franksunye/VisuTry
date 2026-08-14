import { NextRequest, NextResponse } from 'next/server'
import { isMockMode } from '@/lib/mocks'
import {
  createStoreRuntime,
  resolveStoreTryOnResult,
  resolveStoreTryOnResultAccess,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'
import {
  createPrivateBlobGetUrl,
  pathnameFromPrivateBlobUrl,
  privateBlobRedirect,
} from '@/lib/blob/private-signed-url'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Capability-authenticated Store try-on result media.
 * Private results receive a short-lived exact-path signed redirect only after
 * all application ownership checks succeed.
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
    const access = await resolveStoreTryOnResultAccess({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      experiences: runtime.experiences,
      slug: merchantSlug,
      merchantSessionId,
      capabilityToken: readStoreCapabilityToken(request),
      taskId: context.params.taskId,
    })

    if (access.accessMode === 'PRIVATE_SIGNED' && !isMockMode) {
      const pathname = access.resultPathname || pathnameFromPrivateBlobUrl(access.resultImageUrl)
      if (!pathname) {
        throw new Error('Private Store result is missing a Blob pathname')
      }
      const grant = await createPrivateBlobGetUrl({
        pathname,
        businessExpiresAt: access.expiresAt,
      })
      return privateBlobRedirect(grant.url)
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { createStoreRuntime, storeErrorResponse } from '@/modules/store/application'
import { clearStoreCapabilityCookie, clearStoreVisitorCookie, readStoreCapabilityToken } from '@/modules/store/infrastructure'
import { resolveExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import { hashSessionCapability, verifySessionCapability } from '@/modules/store/domain/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { merchantSlug?: unknown; experienceSlug?: unknown; merchantSessionId?: unknown } | null
    if (typeof body?.merchantSlug !== 'string' || typeof body.experienceSlug !== 'string'
      || (body.merchantSessionId !== undefined && typeof body.merchantSessionId !== 'string')) {
      return NextResponse.json({ success: false, error: 'Invalid kiosk reset request' }, { status: 400 })
    }
    const runtime = createStoreRuntime()
    const merchant = await runtime.merchants.findBySlug(body.merchantSlug)
    if (!merchant) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    const activeExperience = body.experienceSlug === 'store'
      ? await runtime.experiences.findDefaultStore(merchant.id)
      : await runtime.experiences.findActiveCampaignByMerchantAndSlug(merchant.id, body.experienceSlug)
    // An archived Campaign cannot create another shopper, but a Kiosk that
    // already holds this Campaign's session capability must still be able to
    // erase that shopper's private state.
    const archivedExperience = !activeExperience && body.experienceSlug !== 'store'
      ? await runtime.experiences.findPublicCampaignByMerchantAndSlug?.(merchant.id, body.experienceSlug)
      : null
    const experience = activeExperience ?? (archivedExperience?.status === 'ARCHIVED' ? archivedExperience : null)
    if (!experience || !resolveExperienceDeliveryPolicy(experience.deliveryPolicy).kioskEnabled) {
      return NextResponse.json({ success: false, error: 'Kiosk reset is not enabled' }, { status: 403 })
    }

    const capabilityToken = readStoreCapabilityToken(request)
    const session = body.merchantSessionId
      ? await runtime.sessions.findByMerchantAndId(merchant.id, body.merchantSessionId)
      : capabilityToken && runtime.sessions.findByCapabilityTokenHash
        ? await runtime.sessions.findByCapabilityTokenHash(merchant.id, hashSessionCapability(capabilityToken))
        : null
    if (body.merchantSessionId && (!session || !capabilityToken
      || !verifySessionCapability(capabilityToken, session.capabilityTokenHash))) {
      return NextResponse.json({ success: false, error: 'Session reset is not authorized' }, { status: 403 })
    }
    if (experience.status === 'ARCHIVED' && !session) {
      return NextResponse.json({ success: false, error: 'Session reset is not authorized' }, { status: 403 })
    }
    if (session) {
      if (!capabilityToken || !verifySessionCapability(capabilityToken, session.capabilityTokenHash)
        || session.experienceId !== experience.id) {
        return NextResponse.json({ success: false, error: 'Session reset is not authorized' }, { status: 403 })
      }
      // Make the old session unusable before external Blob I/O. A failed
      // deletion leaves the photo reference in place for an exact retry.
      await runtime.sessions.markExpired(merchant.id, session.id)
      if (session.photoAssetId) {
        if (!runtime.sessions.expireAndDetachPhoto) {
          return NextResponse.json({ success: false, error: 'Kiosk privacy reset could not be confirmed' }, {
            status: 503,
            headers: { 'Cache-Control': 'no-store' },
          })
        }
        try {
          const deletion = await runtime.assets.delete(session.photoAssetId, merchant.id)
          if (!deletion.deleted) throw new Error('Photo deletion was not confirmed')
        } catch {
          return NextResponse.json({ success: false, error: 'Kiosk privacy reset could not be confirmed' }, {
            status: 503,
            headers: { 'Cache-Control': 'no-store' },
          })
        }
      }
      const photoAssetId = runtime.sessions.expireAndDetachPhoto
        ? await runtime.sessions.expireAndDetachPhoto(merchant.id, session.id)
        : null
      if (photoAssetId && photoAssetId !== session.photoAssetId) {
        return NextResponse.json({ success: false, error: 'Kiosk privacy reset could not be confirmed' }, {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        })
      }
    }

    const response = NextResponse.json({ success: true })
    clearStoreCapabilityCookie(response)
    clearStoreVisitorCookie(response)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return storeErrorResponse(error)
  }
}

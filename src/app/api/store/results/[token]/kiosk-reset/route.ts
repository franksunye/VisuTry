import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashSessionCapability, verifySessionCapability } from '@/modules/store/domain/session'
import { resolveExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import { createStoreRuntime } from '@/modules/store/application/runtime'
import { clearStoreCapabilityCookie, clearStoreVisitorCookie, readStoreCapabilityToken } from '@/modules/store/infrastructure/http/session-cookie'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token
  if (!token || token.length > 200 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 })
  }

  const share = await prisma.decisionResultShare.findUnique({
    where: { tokenHash: hashSessionCapability(token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      result: {
        select: {
          merchantId: true,
          merchantSessionId: true,
          expiresAt: true,
          merchant: { select: { status: true } },
          experience: { select: { deliveryPolicy: true } },
        },
      },
    },
  })
  const now = Date.now()
  if (!share || share.revokedAt || share.expiresAt.getTime() <= now || share.result.expiresAt.getTime() <= now
    || share.result.merchant.status !== 'ACTIVE'
    || !resolveExperienceDeliveryPolicy(share.result.experience?.deliveryPolicy).kioskEnabled) {
    return NextResponse.json({ success: false, error: 'Kiosk reset is not authorized' }, { status: 404 })
  }

  // The Result token grants continuation/read access, never shared-device
  // mutation authority. Reset additionally requires the Kiosk's HttpOnly
  // capability for this exact MerchantSession.
  const capabilityToken = readStoreCapabilityToken(_request)
  if (!capabilityToken) {
    return NextResponse.json({ success: false, error: 'Kiosk reset is not authorized' }, { status: 404 })
  }

  const runtime = createStoreRuntime()
  const reset = await prisma.$transaction(async (tx) => {
    const session = await tx.merchantSession.findFirst({
      where: { id: share.result.merchantSessionId, merchantId: share.result.merchantId },
      select: { photoAssetId: true, capabilityTokenHash: true, experienceId: true },
    })
    if (!session || !verifySessionCapability(capabilityToken, session.capabilityTokenHash)) return null
    const result = await tx.merchantSession.updateMany({
      where: {
        id: share.result.merchantSessionId,
        merchantId: share.result.merchantId,
        experienceId: session.experienceId,
        capabilityTokenHash: session.capabilityTokenHash,
      },
      data: { status: 'EXPIRED', photoAssetId: null },
    })
    return result.count === 1 ? { photoAssetId: session.photoAssetId } : null
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  if (!reset) {
    return NextResponse.json({ success: false, error: 'Kiosk reset is not authorized' }, { status: 404 })
  }
  if (reset.photoAssetId) await runtime.assets.delete(reset.photoAssetId, share.result.merchantId)

  const response = NextResponse.json({ success: true })
  clearStoreCapabilityCookie(response)
  clearStoreVisitorCookie(response)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

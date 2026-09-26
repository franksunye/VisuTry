import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashSessionCapability } from '@/modules/store/domain/session'
import { resolveExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import { createStoreRuntime } from '@/modules/store/application/runtime'
import { clearStoreCapabilityCookie, clearStoreVisitorCookie } from '@/modules/store/infrastructure/http/session-cookie'

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

  const runtime = createStoreRuntime()
  const photoAssetId = await prisma.$transaction(async (tx) => {
    const session = await tx.merchantSession.findFirst({
      where: { id: share.result.merchantSessionId, merchantId: share.result.merchantId },
      select: { photoAssetId: true },
    })
    if (!session) return null
    await tx.merchantSession.updateMany({
      where: { id: share.result.merchantSessionId, merchantId: share.result.merchantId },
      data: { status: 'EXPIRED', photoAssetId: null },
    })
    return session.photoAssetId
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  if (photoAssetId) await runtime.assets.delete(photoAssetId, share.result.merchantId)

  const response = NextResponse.json({ success: true })
  clearStoreCapabilityCookie(response)
  clearStoreVisitorCookie(response)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

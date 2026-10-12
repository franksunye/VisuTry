import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { updateMerchantFrame } from '@/modules/merchant/application/merchant-onboarding'
import { deleteUnusedMerchantFrame } from '@/modules/merchant/application/merchant-catalog-delete'
import { catalogErrorResponse, isRecord } from '../catalog-http'
import { catalogFrameInputSchema } from '../catalog-http'

export const dynamic = 'force-dynamic'

function actorFor(userId: string, merchantId: string, membershipId: string) {
  return { actorType: 'HUMAN' as const, actorId: userId, merchantId, membershipId }
}

export async function PATCH(request: NextRequest, { params }: { params: { merchantId: string; frameId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const body = await request.json() as unknown
    if (!isRecord(body) || !isRecord(body.frame)) return NextResponse.json({ success: false, error: 'INVALID_CATALOG' }, { status: 400 })
    const parsed = catalogFrameInputSchema.safeParse(body.frame)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_CATALOG', message: 'Catalog correction is invalid.' }, { status: 400 })
    const data = await updateMerchantFrame({ actor: actorFor(auth.userId, params.merchantId, membership.membershipId), frameId: params.frameId, frame: parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

/** Human-only; never auto-delete Blob bytes or referenced shopper history. */
export async function DELETE(request: NextRequest, { params }: { params: { merchantId: string; frameId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const body = await request.json().catch(() => null) as unknown
    if (!isRecord(body) || body.approved !== true) {
      return NextResponse.json({ success: false, error: 'APPROVAL_REQUIRED', message: 'Confirm product deletion before continuing.' }, { status: 400 })
    }
    const data = await deleteUnusedMerchantFrame({
      actor: actorFor(auth.userId, params.merchantId, membership.membershipId),
      frameId: params.frameId,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

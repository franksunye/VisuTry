import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { changeMerchantFrameLifecycle } from '@/modules/merchant/application/merchant-catalog-lifecycle'
import { catalogErrorResponse, isRecord } from '../../catalog-http'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string; frameId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({
      userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'],
    })
    const body = await request.json().catch(() => null) as unknown
    if (!isRecord(body) || body.approved !== true || (body.action !== 'ARCHIVE' && body.action !== 'RESTORE')) {
      return NextResponse.json({
        success: false, error: 'APPROVAL_REQUIRED',
        message: 'Select Archive or Restore and confirm the action.',
      }, { status: 400 })
    }
    const data = await changeMerchantFrameLifecycle({
      actor: { actorType: 'HUMAN', actorId: auth.userId, merchantId: params.merchantId, membershipId: membership.membershipId },
      frameId: params.frameId,
      action: body.action,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

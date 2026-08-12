import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { requireMerchantMembership, getMerchantProfile } from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId })
    const profile = await getMerchantProfile({
      actor: {
        actorType: 'HUMAN',
        actorId: auth.userId,
        merchantId: params.merchantId,
        membershipId: membership.membershipId,
      },
    })
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

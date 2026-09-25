import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'
import { getMerchantLivePulse } from '@/modules/merchant/application/merchant-live-pulse'

export const dynamic = 'force-dynamic'

function privateNoStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return privateNoStore(auth.response)

  try {
    await requireMerchantMembership({
      userId: auth.userId,
      merchantId: params.merchantId,
      roles: ['OWNER', 'ADMIN'],
    })
    const pulse = await getMerchantLivePulse({ merchantId: params.merchantId })
    return privateNoStore(NextResponse.json({ success: true, data: pulse }))
  } catch (error) {
    return privateNoStore(merchantAgentErrorResponse(error))
  }
}

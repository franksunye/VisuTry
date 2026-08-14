import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { revokeMerchantOAuthAuthorization } from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, { params }: { params: { merchantId: string; authorizationId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const authorization = await revokeMerchantOAuthAuthorization({ userId: auth.userId, merchantId: params.merchantId, authorizationId: params.authorizationId })
    return NextResponse.json({ success: true, data: { authorization } })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

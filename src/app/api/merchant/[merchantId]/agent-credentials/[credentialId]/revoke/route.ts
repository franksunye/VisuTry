import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { revokeMerchantAgentCredential } from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { merchantId: string; credentialId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const credential = await revokeMerchantAgentCredential({
      userId: auth.userId,
      merchantId: params.merchantId,
      credentialId: params.credentialId,
    })
    return NextResponse.json({ success: true, data: { credential } })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

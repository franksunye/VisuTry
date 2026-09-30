import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { listMerchantOAuthAuthorizations } from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, props: { params: Promise<{ merchantId: string }> }) {
  const params = await props.params;
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const authorizations = await listMerchantOAuthAuthorizations({ userId: auth.userId, merchantId: params.merchantId })
    return NextResponse.json({ success: true, data: { authorizations } })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

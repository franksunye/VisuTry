import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { publishCampaign } from '@/modules/store/application/campaign-service'
import { campaignErrorResponse } from '../../campaign-http'

export const dynamic = 'force-dynamic'
const schema = z.object({ approved: z.literal(true) }).strict()

export async function POST(request: NextRequest, { params }: { params: { merchantId: string; campaignId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'APPROVAL_REQUIRED', message: 'Confirm that you approve publishing this Campaign.' }, { status: 400 }) }
    if (!schema.safeParse(body).success) return NextResponse.json({ success: false, error: 'APPROVAL_REQUIRED', message: 'Confirm that you approve publishing this Campaign.' }, { status: 400 })
    const data = await publishCampaign({ merchantId: params.merchantId, campaignId: params.campaignId, approved: true })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

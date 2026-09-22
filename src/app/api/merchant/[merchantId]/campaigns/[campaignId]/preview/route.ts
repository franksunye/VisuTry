import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { previewCampaign } from '@/modules/store/application/campaign-service'
import { campaignErrorResponse } from '../../campaign-http'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, { params }: { params: { merchantId: string; campaignId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const data = await previewCampaign({ merchantId: params.merchantId, campaignId: params.campaignId })
    if (data.status !== 'DRAFT') return NextResponse.json({ success: false, error: 'DRAFT_PREVIEW_ONLY', message: 'Private Preview is available while this Campaign is a Draft.' }, { status: 409 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

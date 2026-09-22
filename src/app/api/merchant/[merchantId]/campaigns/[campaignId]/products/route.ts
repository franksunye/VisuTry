import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { setCampaignFrames } from '@/modules/store/application/campaign-service'
import { campaignErrorResponse } from '../../campaign-http'

export const dynamic = 'force-dynamic'
const schema = z.object({ frameIds: z.array(z.string().trim().min(1).max(200)).max(100) }).strict()

export async function PUT(request: NextRequest, { params }: { params: { merchantId: string; campaignId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await setCampaignFrames({ merchantId: params.merchantId, campaignId: params.campaignId, ...parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

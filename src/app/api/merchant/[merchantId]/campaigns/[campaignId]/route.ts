import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getCampaign, updateCampaign } from '@/modules/store/application/campaign-service'
import { CAMPAIGN_GATES, CAMPAIGN_OBJECTIVES } from '@/modules/store/domain/campaign-policy'
import { PRESENTATION_MODES } from '@/modules/store/domain/presentation-mode'
import { campaignErrorResponse } from '../campaign-http'

export const dynamic = 'force-dynamic'

const details = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  headline: z.string().trim().max(240).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  objective: z.enum(CAMPAIGN_OBJECTIVES).optional(),
  gate: z.enum(CAMPAIGN_GATES).optional(),
  presentationMode: z.enum(PRESENTATION_MODES).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  primaryCtaType: z.string().trim().max(40).nullable().optional(),
  primaryCtaLabel: z.string().trim().max(120).nullable().optional(),
  primaryCtaUrl: z.string().trim().max(2000).nullable().optional(),
  secondaryCtaType: z.string().trim().max(40).nullable().optional(),
  secondaryCtaLabel: z.string().trim().max(120).nullable().optional(),
  secondaryCtaUrl: z.string().trim().max(2000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one Campaign change.')

export async function GET(_request: NextRequest, { params }: { params: { merchantId: string; campaignId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const data = await getCampaign({ merchantId: params.merchantId, campaignId: params.campaignId })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { merchantId: string; campaignId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = details.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST', message: 'Review the Campaign details and try again.' }, { status: 400 })
    const data = await updateCampaign({ merchantId: params.merchantId, campaignId: params.campaignId, ...parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

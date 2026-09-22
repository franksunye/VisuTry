import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { createCampaignDraft, listCampaigns } from '@/modules/store/application/campaign-service'
import { CAMPAIGN_GATES, CAMPAIGN_OBJECTIVES } from '@/modules/store/domain/campaign-policy'
import { PRESENTATION_MODES } from '@/modules/store/domain/presentation-mode'
import { campaignErrorResponse } from './campaign-http'

export const dynamic = 'force-dynamic'

const details = z.object({
  name: z.string().trim().min(1).max(120),
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
}).strict()

async function authorize(userId: string, merchantId: string) {
  return requireMerchantMembership({ userId, merchantId, roles: ['OWNER', 'ADMIN'] })
}

export async function GET(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await authorize(auth.userId, params.merchantId)
    const rawLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50
    const data = await listCampaigns({ merchantId: params.merchantId, cursor: request.nextUrl.searchParams.get('cursor') ?? undefined, limit })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await authorize(auth.userId, params.merchantId)
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = details.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST', message: 'Enter a Campaign name to continue.' }, { status: 400 })
    const data = await createCampaignDraft({ merchantId: params.merchantId, ...parsed.data })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return campaignErrorResponse(error)
  }
}

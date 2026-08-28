import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { updateMerchantSubscription } from '@/modules/merchant/application/merchant-billing'
import { billingErrorResponse } from '../billing-http'

export const dynamic = 'force-dynamic'
const inputSchema = z.object({ planCode: z.enum(['LAUNCH', 'GROWTH', 'SCALE']) }).strict()

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth(); if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = inputSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await updateMerchantSubscription({ merchantId: params.merchantId, planCode: parsed.data.planCode })
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return billingErrorResponse(error) }
}

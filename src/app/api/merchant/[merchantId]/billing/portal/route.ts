import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import { createMerchantBillingPortalSession } from '@/modules/merchant/application/merchant-billing'
import { billingErrorResponse, merchantBillingUrl } from '../billing-http'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth(); if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const data = await createMerchantBillingPortalSession({ merchantId: params.merchantId, returnUrl: merchantBillingUrl(request.nextUrl.origin, params.merchantId).toString() })
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return billingErrorResponse(error) }
}

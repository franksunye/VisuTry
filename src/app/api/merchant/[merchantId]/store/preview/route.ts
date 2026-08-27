import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import { previewMerchantStore } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { storeErrorResponse } from '../store-http'

export const dynamic = 'force-dynamic'

const schema = z.object({ storeId: z.string().trim().min(1).max(200) }).strict()

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await previewMerchantStore({ actor: { actorType: 'HUMAN', actorId: auth.userId, merchantId: params.merchantId, membershipId: membership.membershipId }, ...parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

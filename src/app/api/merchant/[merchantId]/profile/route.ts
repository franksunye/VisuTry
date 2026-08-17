import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, getMerchantProfile, MerchantProfileError, updateMerchantProfile } from '@/modules/merchant/cloudflare'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http-cloudflare'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId })
    const profile = await getMerchantProfile({
      actor: {
        actorType: 'HUMAN',
        actorId: auth.userId,
        merchantId: params.merchantId,
        membershipId: membership.membershipId,
      },
    })
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }
  const payload = body as { name?: unknown; websiteUrl?: unknown }
  if ((payload.name !== undefined && typeof payload.name !== 'string') || (payload.websiteUrl !== undefined && payload.websiteUrl !== null && typeof payload.websiteUrl !== 'string')) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  try {
    const profile = await updateMerchantProfile({
      userId: auth.userId,
      merchantId: params.merchantId,
      name: payload.name as string | undefined,
      websiteUrl: payload.websiteUrl as string | null | undefined,
    })
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    if (error instanceof MerchantProfileError) return NextResponse.json({ success: false, error: error.code }, { status: 400 })
    return merchantAgentErrorResponse(error)
  }
}

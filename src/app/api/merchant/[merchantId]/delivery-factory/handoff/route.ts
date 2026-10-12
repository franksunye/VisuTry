import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantSupportHandoff } from '@/modules/merchant/application/merchant-support-handoff'

export const dynamic = 'force-dynamic'

const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

/**
 * Read-only support handoff, not a Factory Apply or public verification.
 * No merchantId from query/body can override the membership-bound path.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({
      userId: auth.userId,
      merchantId: params.merchantId,
      roles: ['OWNER', 'ADMIN'],
    })
    const handoff = await getMerchantSupportHandoff({ merchantId: params.merchantId })
    return reply({ success: true, data: handoff })
  } catch (error) {
    if (error instanceof MerchantAccessError) return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    // Never expose foreign-tenant details or underlying database exceptions.
    return reply({ success: false, error: 'HANDOFF_UNAVAILABLE' }, 500)
  }
}

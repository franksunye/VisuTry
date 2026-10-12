import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'

export const dynamic = 'force-dynamic'

const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

/** Strictly READ-ONLY. Never accepts an "approved" flag or performs Apply. */
export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({
      userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'],
    })
    const manifest = await request.json().catch(() => null) as unknown
    const plan = await getMerchantFactoryDryRun({
      actor: {
        actorType: 'HUMAN', actorId: auth.userId,
        merchantId: params.merchantId, membershipId: membership.membershipId,
      },
      proposal: manifest,
    })
    return response({
      success: true, data: plan,
      note: 'Read-only proposal only. Actual Apply requires a separate authenticated and approved operation.',
    })
  } catch (error) {
    if (error instanceof MerchantAccessError || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return response({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) {
      return response({ success: false, error: 'INVALID_FACTORY_MANIFEST', message: 'The v1 delivery manifest does not satisfy the canonical contract.' }, 400)
    }
    // Do not expose unexpected internal errors or tenant configuration.
    return response({ success: false, error: 'FACTORY_PLAN_UNAVAILABLE' }, 500)
  }
}

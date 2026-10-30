import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { verifyMerchantFactoryConfigurationV1 } from '@/modules/merchant/domain/merchant-delivery-factory-verify-v1'

export const dynamic = 'force-dynamic'
const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

/**
 * Read actual canonical merchant state and verify a manifest matches it.
 * No write, no approving flags, no vendor APIs, no claim of public E2E PASS.
 */
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
    const proposal: unknown = await request.json().catch(() => null)
    const plan = await getMerchantFactoryDryRun({
      actor: {
        actorType: 'HUMAN', actorId: auth.userId, merchantId: params.merchantId,
        membershipId: membership.membershipId,
      },
      proposal,
    })
    const verification = verifyMerchantFactoryConfigurationV1({ proposal, plan })
    return respond({ success: true, data: verification })
  } catch (error) {
    if (error instanceof MerchantAccessError
      || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return respond({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) {
      return respond({ success: false, error: 'INVALID_FACTORY_MANIFEST' }, 400)
    }
    return respond({ success: false, error: 'FACTORY_VERIFY_UNAVAILABLE' }, 500)
  }
}

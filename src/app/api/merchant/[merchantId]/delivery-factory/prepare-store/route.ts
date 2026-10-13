import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { prepareMerchantFactoryDraftStoreV1 } from '@/modules/merchant/application/merchant-delivery-factory-apply'
import { MerchantFactoryApplyError } from '@/modules/merchant/domain/merchant-delivery-factory-apply-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

export const dynamic = 'force-dynamic'
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

/** Read-only; produces an approval target but never an authorization to write. */
export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({
      userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER'],
    })
    const proposal = merchantDeliveryManifestV1Schema.parse(await request.json().catch(() => null))
    const preview = await prepareMerchantFactoryDraftStoreV1({
      actor: {
        actorType: 'HUMAN', actorId: auth.userId,
        merchantId: params.merchantId, membershipId: membership.membershipId,
      },
      proposal,
    })
    return reply({ success: true, data: preview,
      note: 'Read-only approval target. Confirm the exact manifest and revision separately before Apply.',
    })
  } catch (error) {
    if (error instanceof MerchantAccessError
      || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_MANIFEST' }, 400)
    if (error instanceof MerchantFactoryApplyError) {
      return reply({ success: false, error: 'FACTORY_DRAFT_STORE_CONFLICT' }, 409)
    }
    return reply({ success: false, error: 'FACTORY_PREPARE_UNAVAILABLE' }, 500)
  }
}

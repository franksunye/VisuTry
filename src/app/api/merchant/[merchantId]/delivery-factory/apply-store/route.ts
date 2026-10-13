import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { applyMerchantFactoryDraftStoreV1 } from '@/modules/merchant/application/merchant-delivery-factory-apply'
import { MerchantFactoryApplyError } from '@/modules/merchant/domain/merchant-delivery-factory-apply-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'

/**
 * Provider-neutral known serialization conflicts only; unrelated SQL errors
 * must remain 500 so FK / schema failures are never masked as safe retries.
 */
function isFactoryStoreWriteConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const item = error as {
    code?: unknown
    meta?: { code?: unknown; driverAdapterError?: unknown }
  }
  if (item.code === 'P2034' || item.code === '40001') return true
  if (item.code !== 'P2010') return false
  if (item.meta?.code === '40001') return true
  const adapter = item.meta?.driverAdapterError
  if (adapter === 'TransactionWriteConflict') return true
  if (!adapter || typeof adapter !== 'object') return false
  const conflict = adapter as { kind?: unknown; originalCode?: unknown; cause?: { kind?: unknown; originalCode?: unknown } }
  return conflict.kind === 'TransactionWriteConflict'
    || conflict.originalCode === '40001'
    || conflict.cause?.kind === 'TransactionWriteConflict'
    || conflict.cause?.originalCode === '40001'
}

export const dynamic = 'force-dynamic'
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

// This endpoint is NOT a generic Factory Apply. An explicit, target-bound
// Human Owner request can update only existing private Draft Store settings.
// Approval is never imported from a Manifest, Agent or prior Plan result.
const requestSchema = z.strictObject({
  approved: z.literal(true),
  expectedStoreUpdatedAt: z.iso.datetime({ offset: true }),
  expectedStoreId: z.string().min(1).max(120),
  manifestDigest: z.string().regex(/^[a-f0-9]{64}$/),
  manifest: merchantDeliveryManifestV1Schema,
})

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
    const body: unknown = await request.json().catch(() => null)
    const input = requestSchema.parse(body)
    const applied = await applyMerchantFactoryDraftStoreV1({
      actor: {
        actorType: 'HUMAN', actorId: auth.userId,
        merchantId: params.merchantId, membershipId: membership.membershipId,
      },
      proposal: input.manifest,
      expectedStoreUpdatedAt: new Date(input.expectedStoreUpdatedAt).toISOString(),
      expectedStoreId: input.expectedStoreId,
      manifestDigest: input.manifestDigest,
    })
    return response({
      success: true, data: applied,
      note: 'Only private Draft Store configuration is updated; Brand, Catalog selection, Campaign, publication and public verification are excluded.',
    })
  } catch (error) {
    if (error instanceof MerchantAccessError
      || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return response({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) return response({ success: false, error: 'INVALID_FACTORY_APPLY_REQUEST' }, 400)
    if (error instanceof MerchantFactoryApplyError
      || (error instanceof ExperienceCommandError && (
        error.message === 'FACTORY_DRAFT_STORE_STALE_REVISION'
        || error.message === 'Agent changes are limited to Draft Experiences.'
      ))
      || isFactoryStoreWriteConflict(error)) {
      return response({ success: false, error: 'FACTORY_DRAFT_STORE_CONFLICT' }, 409)
    }
    // No leaking SQL, credentials, rejected tenant identity or hidden state.
    return response({ success: false, error: 'FACTORY_APPLY_UNAVAILABLE' }, 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftStoreCreation,
  createMerchantFactoryDraftStore,
} from '@/modules/merchant/application/merchant-delivery-factory-create-store'
import { MerchantFactoryCreateStoreConflict } from '@/modules/merchant/domain/merchant-delivery-factory-create-store-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

export const dynamic = 'force-dynamic'
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

const createRequest = z.strictObject({
  approved: z.literal(true),
  expectedStoreAbsent: z.literal(true),
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
    const parsed = createRequest.parse(body)
    const result = await createMerchantFactoryDraftStore({
      actor: { actorType: 'HUMAN', actorId: auth.userId, merchantId: params.merchantId, membershipId: membership.membershipId },
      proposal: parsed.manifest,
      manifestDigest: parsed.manifestDigest,
      expectedStoreAbsent: parsed.expectedStoreAbsent,
    })
    return reply({ success: true, data: result })
  } catch (error) {
    if (error instanceof MerchantAccessError
      || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_CREATE_REQUEST' }, 400)
    if (error instanceof MerchantFactoryCreateStoreConflict) {
      return reply({ success: false, error: 'FACTORY_CREATE_CONFLICT' }, 409)
    }
    // PostgreSQL serialization/write-conflict outcomes are recoverable, never 500.
    if (error && typeof error === 'object' && 'code' in error
      && (error.code === 'P2034' || error.code === '40001')) {
      return reply({ success: false, error: 'FACTORY_CREATE_CONFLICT' }, 409)
    }
    return reply({ success: false, error: 'FACTORY_CREATE_UNAVAILABLE' }, 500)
  }
}

/** Strict read-only preparation; no approval may be smuggled into the manifest. */
export async function PUT(
  request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({
      userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER'],
    })
    const raw: unknown = await request.json().catch(() => null)
    const proposal = merchantDeliveryManifestV1Schema.parse(raw)
    const result = await prepareMerchantFactoryDraftStoreCreation({
      actor: { actorType: 'HUMAN', actorId: auth.userId, merchantId: params.merchantId, membershipId: membership.membershipId },
      proposal,
    })
    return reply({ success: true, data: result })
  } catch (error) {
    if (error instanceof MerchantAccessError
      || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
      return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_MANIFEST' }, 400)
    if (error instanceof MerchantFactoryCreateStoreConflict) {
      return reply({ success: false, error: 'FACTORY_CREATE_CONFLICT' }, 409)
    }
    return reply({ success: false, error: 'FACTORY_CREATE_UNAVAILABLE' }, 500)
  }
}

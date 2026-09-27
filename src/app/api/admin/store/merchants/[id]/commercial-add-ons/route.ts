import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import {
  getMerchantPlanDefinition,
  isMerchantPlanCode,
  KIOSK_ADD_ON_CODE,
} from '@/modules/merchant/domain/merchant-commercial-plans'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'

export const dynamic = 'force-dynamic'

const commercialAddOnsSchema = z.object({
  addOns: z.array(z.literal(KIOSK_ADD_ON_CODE)).max(1),
}).strict()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }
  const parsed = commercialAddOnsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true, planCode: true },
  })
  if (!merchant) {
    return NextResponse.json({ success: false, error: 'MERCHANT_NOT_FOUND' }, { status: 404 })
  }
  if (!isMerchantPlanCode(merchant.planCode)) {
    return NextResponse.json({ success: false, error: 'CANONICAL_PLAN_REQUIRED' }, { status: 409 })
  }

  const addOns = [...new Set(parsed.data.addOns)]
  const plan = getMerchantPlanDefinition(merchant.planCode)
  const wantsKiosk = addOns.includes(KIOSK_ADD_ON_CODE)
  if (wantsKiosk && plan.kioskDelivery !== 'add_on' && plan.kioskDelivery !== 'custom') {
    return NextResponse.json({
      success: false,
      error: plan.kioskDelivery === 'included' ? 'KIOSK_ALREADY_INCLUDED' : 'KIOSK_NOT_AVAILABLE',
    }, { status: 409 })
  }

  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'merchant', merchantSlug: merchant.slug },
    mutation: () => prisma.$transaction(async (tx) => {
      const row = await tx.merchant.update({
        where: { id: merchant.id },
        data: { commercialAddOns: addOns },
        select: { id: true, commercialAddOns: true },
      })
      await tx.merchantOperationAudit.create({
        data: {
          merchantId: merchant.id,
          actorType: 'ADMIN',
          actorId: auth.userId,
          action: 'commercial_add_ons_set',
          resourceType: 'MERCHANT_COMMERCIAL',
          resourceId: merchant.id,
          result: 'SUCCESS',
        },
      })
      return row
    }),
  })

  return NextResponse.json({
    success: true,
    data: {
      merchantId: updated.id,
      commercialAddOns: updated.commercialAddOns,
      kioskDelivery: plan.kioskDelivery,
    },
  })
}

import { prisma } from '@/lib/prisma'

/**
 * Read-only M1b SHADOW assessment. Never reserves, settles, or releases
 * credits. No image, shopper identity or provider payload is read.
 * This is operational preview only; ENFORCE remains separately gated.
 */
export async function inspectMerchantAiPeriodShadow(input: {
  merchantId: string
  now?: Date
  db?: typeof prisma
}): Promise<
  | { decision: 'INELIGIBLE'; planCode: string | null }
  | { decision: 'AVAILABLE' | 'EXHAUSTED' | 'PERIOD_INACTIVE'; planCode: string | null; limit: number; occupied: number; remaining: number }
  | null
> {
  const db = input.db ?? prisma
  const merchant = await db.merchant.findUnique({
    where: { id: input.merchantId },
    select: {
      planCode: true, commercialStatus: true, entitlementVersion: true,
      pricingVersion: true, standardRenderAllowance: true,
      entitlementEffectiveFrom: true, billingPeriodEnd: true,
    },
  })
  if (!merchant) return null
  if (merchant.entitlementVersion !== 'v2' && !merchant.pricingVersion?.startsWith('v2-')) return null

  const limit = merchant.standardRenderAllowance
  if (
    merchant.entitlementVersion !== 'v2'
    || !merchant.pricingVersion?.startsWith('v2-')
    || !['LAUNCH', 'GROWTH', 'SCALE'].includes(merchant.planCode ?? '')
    || !['PAID_ACTIVE', 'USAGE_WARNING', 'CANCEL_AT_PERIOD_END'].includes(merchant.commercialStatus ?? '')
    || !Number.isInteger(limit) || limit === null || limit <= 0
    || !merchant.entitlementEffectiveFrom || !merchant.billingPeriodEnd
  ) return { decision: 'INELIGIBLE', planCode: merchant.planCode }

  const now = input.now ?? new Date()
  const start = merchant.entitlementEffectiveFrom
  const end = merchant.billingPeriodEnd
  if (start >= end || now < start || now >= end) {
    return { decision: 'PERIOD_INACTIVE', planCode: merchant.planCode, limit, occupied: 0, remaining: 0 }
  }
  const occupied = await db.merchantAiRenderReservation.count({
    where: {
      merchantId: input.merchantId,
      periodStart: start, periodEnd: end,
      status: { in: ['RESERVED', 'SETTLED'] },
    },
  })
  return {
    decision: occupied >= limit ? 'EXHAUSTED' : 'AVAILABLE',
    planCode: merchant.planCode,
    limit, occupied, remaining: Math.max(0, limit - occupied),
  }
}

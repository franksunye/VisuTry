import { prisma } from '@/lib/prisma'
import { merchantAiBudgetMode } from './merchant-ai-period-admission'

/** Read-only, tenant-scoped billing-period counters. No simulated events. */
export type MerchantAiUsageSnapshot = {
  limit: number
  successful: number
  held: number
  remaining: number
  usedPercent: number
  periodStart: string
  periodEnd: string
}

export async function getMerchantAiUsageSnapshot(merchantId: string): Promise<MerchantAiUsageSnapshot | null> {
  // SHADOW/OFF has no authoritative v2 reservation ledger to report.
  if (merchantAiBudgetMode() !== 'ENFORCE') return null
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      entitlementVersion: true, pricingVersion: true, standardRenderAllowance: true,
      entitlementEffectiveFrom: true, billingPeriodEnd: true,
    },
  })
  if (!merchant || merchant.entitlementVersion !== 'v2'
    || !merchant.pricingVersion?.startsWith('v2-')
    || !merchant.entitlementEffectiveFrom || !merchant.billingPeriodEnd
    || !merchant.standardRenderAllowance || merchant.standardRenderAllowance <= 0) return null
  const start = merchant.entitlementEffectiveFrom
  const end = merchant.billingPeriodEnd
  if (start >= end) return null
  const statuses = await prisma.merchantAiRenderReservation.groupBy({
    by: ['status'],
    where: { merchantId, periodStart: start, periodEnd: end },
    _count: { _all: true },
  })
  const count = (status: 'SETTLED' | 'RESERVED') =>
    statuses.find((row) => row.status === status)?._count._all ?? 0
  const successful = count('SETTLED')
  const held = count('RESERVED')
  const limit = merchant.standardRenderAllowance
  return {
    successful, held, limit,
    remaining: Math.max(0, limit - successful - held),
    usedPercent: Math.min(100, Math.round((successful + held) / limit * 100)),
    periodStart: start.toISOString(), periodEnd: end.toISOString(),
  }
}

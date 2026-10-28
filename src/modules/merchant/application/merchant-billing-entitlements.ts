import { prisma } from '@/lib/prisma'
import { COMMERCIAL_PLAN_VERSION, getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import { FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS } from '@/modules/store/domain/merchant-entitlement'
import type { MerchantBillablePlanCode } from '../domain/merchant-billing'
import { MerchantBillingError } from './merchant-billing-shared'

/**
 * Shared transactional billing entitlement writer.
 *
 * Kept independent of Stripe HTTP clients, server-only cache invalidation,
 * and Next.js entry points so the exact production enrollment rule can be
 * proven against disposable PostgreSQL without a provider call.
 */
export async function enrollMerchantCommercialPlan(input: {
  merchantId: string
  planCode: MerchantBillablePlanCode
  effectiveFrom: Date
  billingPeriodEnd: Date | null
  commercialStatus: 'PAID_ACTIVE' | 'CANCEL_AT_PERIOD_END' | 'PAST_DUE' | 'PAYMENT_ACTION_REQUIRED' | 'EXPIRED' | 'PILOT_ACTIVE' | 'PILOT_EXPIRED'
  pricingVersion?: string
  entitlementVersion?: string
  source: string
}, txOverride?: any) {
  const run = async (tx: any) => {
    const existing = await tx.merchant.findUnique({
      where: { id: input.merchantId },
      select: {
        planCode: true, standardRenderAllowance: true, commerceSessionAllowance: true,
        commercialExceptionCode: true,
      },
    })
    if (!existing) throw new MerchantBillingError('MERCHANT_NOT_FOUND', 'Merchant not found.', 404)

    const plan = getMerchantPlanDefinition(input.planCode)
    const baseImages = plan.standardTryOnGenerations
    const baseSessions = plan.aiCommerceSessions
    if (!Number.isSafeInteger(baseImages) || !baseImages || baseImages <= 0 || !Number.isSafeInteger(baseSessions) || !baseSessions || baseSessions <= 0) {
      throw new MerchantBillingError('ENTITLEMENT_NOT_CONFIGURED', 'This Merchant plan is not ready for automatic AI activation.', 409)
    }

    // Replayed events, renewals and billing-state changes must preserve any
    // explicitly provisioned allowance for the same plan. A plan change must
    // never inherit the previous plan's image budget.
    const samePlan = existing.planCode === input.planCode
    const approvedPilotBonus = input.planCode === 'FOUNDING_PILOT'
      && existing.commercialExceptionCode === 'FOUNDING_LAUNCH_BONUS'
    const standardRenderAllowance = approvedPilotBonus
      ? FOUNDING_LAUNCH_BONUS_STANDARD_RENDERS
      : samePlan && Number.isSafeInteger(existing.standardRenderAllowance) && existing.standardRenderAllowance > 0
        ? existing.standardRenderAllowance
        : baseImages
    const commerceSessionAllowance = samePlan && Number.isSafeInteger(existing.commerceSessionAllowance) && existing.commerceSessionAllowance > 0
      ? existing.commerceSessionAllowance
      : baseSessions

    return tx.merchant.update({
      where: { id: input.merchantId },
      data: {
        planCode: input.planCode, commercialStatus: input.commercialStatus,
        pricingVersion: input.pricingVersion ?? COMMERCIAL_PLAN_VERSION,
        entitlementVersion: input.entitlementVersion ?? 'v2',
        standardRenderAllowance, commerceSessionAllowance,
        entitlementEffectiveFrom: input.effectiveFrom, billingPeriodEnd: input.billingPeriodEnd,
        commercialStage: input.planCode === 'FOUNDING_PILOT' ? 'MARKET_CAPTURE' : null,
      },
      select: { id: true, planCode: true, commercialStatus: true, billingPeriodEnd: true },
    })
  }
  return txOverride ? run(txOverride) : prisma.$transaction(run)
}

import type { MerchantPlanCode } from '@/modules/store/domain/merchant-commercial-plans'

export const MERCHANT_BILLABLE_PLAN_CODES = ['LAUNCH', 'GROWTH', 'SCALE', 'FOUNDING_PILOT'] as const
export type MerchantBillablePlanCode = (typeof MERCHANT_BILLABLE_PLAN_CODES)[number]
export type MerchantRecurringPlanCode = Exclude<MerchantBillablePlanCode, 'FOUNDING_PILOT'>

export function isMerchantBillablePlanCode(value: unknown): value is MerchantBillablePlanCode {
  return typeof value === 'string' && MERCHANT_BILLABLE_PLAN_CODES.includes(value.toUpperCase() as MerchantBillablePlanCode)
}

export function merchantPlanCodeFromUnknown(value: unknown): MerchantBillablePlanCode | null {
  return isMerchantBillablePlanCode(value) ? value.toUpperCase() as MerchantBillablePlanCode : null
}

export function billingTypeForMerchantPlan(planCode: MerchantBillablePlanCode): 'subscription' | 'one_time' {
  return planCode === 'FOUNDING_PILOT' ? 'one_time' : 'subscription'
}

export function isRecurringMerchantPlan(planCode: MerchantPlanCode | MerchantBillablePlanCode): planCode is MerchantRecurringPlanCode {
  return planCode === 'LAUNCH' || planCode === 'GROWTH' || planCode === 'SCALE'
}

export function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 86_400_000)
}

export function commercialStatusForSubscription(input: { status: string; cancelAtPeriodEnd?: boolean }): 'PAID_ACTIVE' | 'CANCEL_AT_PERIOD_END' | 'PAST_DUE' | 'PAYMENT_ACTION_REQUIRED' | 'EXPIRED' {
  const status = input.status.toLowerCase()
  if (status === 'past_due' || status === 'unpaid') return 'PAST_DUE'
  if (status === 'incomplete' || status === 'paused') return 'PAYMENT_ACTION_REQUIRED'
  if (status === 'canceled' || status === 'incomplete_expired') return 'EXPIRED'
  if (input.cancelAtPeriodEnd) return 'CANCEL_AT_PERIOD_END'
  return status === 'active' || status === 'trialing' ? 'PAID_ACTIVE' : 'PAYMENT_ACTION_REQUIRED'
}

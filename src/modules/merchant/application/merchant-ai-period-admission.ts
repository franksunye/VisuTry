import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { resolveSessionTryOnLimit } from '@/modules/store/domain/session-tryon-limit'

/**
 * Standard billing-period allowance for all enrolled Merchant Store/Campaign Try-Ons.
 *
 * Exactly one Merchant v2 reservation may enter the funded billing-period
 * capacity per logical Store request. Historical MerchantSponsoredUsage rows
 * count rolling first value and are NOT the same quota meter.
 */
export type MerchantAiPeriodAdmission =
  | { decision: 'RESERVED'; reservationId: string; usedIncludingReservations: number; limit: number }
  | { decision: 'EXISTING'; reservationId: string; status: 'RESERVED' | 'SETTLED' | 'RELEASED' }
  | { decision: 'DENIED'; reason: 'NOT_ENROLLED' | 'PERIOD_INACTIVE' | 'LIMIT_REACHED' | 'SESSION_LIMIT_REACHED' | 'SESSION_NOT_FOUND'; usedIncludingReservations?: number; limit?: number }

type ReservationInput = {
  merchantId: string
  merchantSessionId: string
  /** Server-owned Store idempotency key; must identify one logical image. */
  idempotencyKey: string
  now?: Date
}

function assertKey(input: ReservationInput): void {
  for (const key of [input.merchantId, input.merchantSessionId, input.idempotencyKey]) {
    if (typeof key !== 'string' || !key.trim() || key.length > 256) {
      throw new Error('Invalid Merchant AI reservation identity')
    }
  }
}

type ExistingHold = {
  id: string
  merchantId: string
  merchantSessionId: string
  status: 'RESERVED' | 'SETTLED' | 'RELEASED'
}

function reuseReservation(input: ReservationInput, hold: ExistingHold): MerchantAiPeriodAdmission {
  if (hold.merchantId !== input.merchantId || hold.merchantSessionId !== input.merchantSessionId) {
    throw new Error('Merchant AI reservation tenant mismatch')
  }
  return { decision: 'EXISTING', reservationId: hold.id, status: hold.status }
}

const eligibleMonthlyPlans = new Set(['FOUNDING_PILOT', 'LAUNCH', 'GROWTH', 'SCALE', 'ENTERPRISE'])
const eligibleStatuses = new Set(['PILOT_ACTIVE', 'PAID_ACTIVE', 'USAGE_WARNING', 'CANCEL_AT_PERIOD_END'])

/** Paid Merchant plans share one standard render meter. */
export function isMeteredMerchantPlan(planCode: string | null | undefined): boolean {
  return planCode === 'FOUNDING_PILOT' || planCode === 'LAUNCH'
    || planCode === 'GROWTH' || planCode === 'SCALE' || planCode === 'ENTERPRISE'
}

/**
 * Called only from the same SERIALIZABLE transaction that creates a Store
 * TryOnTask, so no reservation is orphaned if a claim fails. This owns the
 * merchant-period advisory lock and the capacity check.
 */
export async function reserveMerchantAiPeriodRenderInTransaction(
  tx: Prisma.TransactionClient,
  input: ReservationInput,
): Promise<MerchantAiPeriodAdmission> {
  assertKey(input)
  const now = input.now ?? new Date()
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid Merchant AI reservation time')

  const merchant = await tx.merchant.findUnique({
    where: { id: input.merchantId },
    select: {
      id: true, planCode: true, commercialStatus: true,
      entitlementVersion: true, pricingVersion: true,
      standardRenderAllowance: true, entitlementEffectiveFrom: true,
      billingPeriodEnd: true,
    },
  })
  if (!merchant) return { decision: 'DENIED', reason: 'NOT_ENROLLED' }

  const included = merchant.standardRenderAllowance
  if (
    !eligibleMonthlyPlans.has(merchant.planCode ?? '')
    || !eligibleStatuses.has(merchant.commercialStatus ?? '')
    || !Number.isInteger(included) || included === null || included <= 0
    || !merchant.entitlementEffectiveFrom || !merchant.billingPeriodEnd
  ) return { decision: 'DENIED', reason: 'NOT_ENROLLED' }

  const start = merchant.entitlementEffectiveFrom
  const end = merchant.billingPeriodEnd
  if (start.getTime() >= end.getTime() || now < start || now >= end) {
    return { decision: 'DENIED', reason: 'PERIOD_INACTIVE' }
  }

  const session = await tx.merchantSession.findFirst({
    where: { id: input.merchantSessionId, merchantId: input.merchantId },
    select: {
      id: true,
      experience: { select: { type: true, sessionTryOnLimit: true } },
    },
  })
  if (!session) return { decision: 'DENIED', reason: 'SESSION_NOT_FOUND' }

  const existing = await tx.merchantAiRenderReservation.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, merchantId: true, merchantSessionId: true, status: true },
  })
  if (existing) return reuseReservation(input, existing)

  const lockKey = `merchant-ai-period:${input.merchantId}:${start.toISOString()}:${end.toISOString()}`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
  const afterLock = await tx.merchantAiRenderReservation.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, merchantId: true, merchantSessionId: true, status: true },
  })
  if (afterLock) return reuseReservation(input, afterLock)

  const used = await tx.merchantAiRenderReservation.count({
    where: {
      merchantId: input.merchantId,
      periodStart: start,
      periodEnd: end,
      status: { in: ['RESERVED', 'SETTLED'] },
    },
  })
  if (used >= included) {
    return { decision: 'DENIED', reason: 'LIMIT_REACHED', usedIncludingReservations: used, limit: included }
  }
  // An unbound session still observes the default two-image limit.
  // The merchant lock serializes concurrent claims for the same session.
  const perSession = resolveSessionTryOnLimit(session.experience?.sessionTryOnLimit)
  const occupied = await tx.merchantAiRenderReservation.count({
    where: {
      merchantId: input.merchantId,
      merchantSessionId: input.merchantSessionId,
      status: { in: ['RESERVED', 'SETTLED'] },
    },
  })
  if (occupied >= perSession) {
    return { decision: 'DENIED', reason: 'SESSION_LIMIT_REACHED', usedIncludingReservations: occupied, limit: perSession }
  }
  const reserved = await tx.merchantAiRenderReservation.create({
    data: {
      merchantId: input.merchantId,
      merchantSessionId: input.merchantSessionId,
      idempotencyKey: input.idempotencyKey,
      periodStart: start,
      periodEnd: end,
      pricingVersion: merchant.pricingVersion || 'standard',
      entitlementVersion: merchant.entitlementVersion || 'standard',
      includedRenderLimit: included,
      reservedAt: now,
    },
    select: { id: true },
  })
  return { decision: 'RESERVED', reservationId: reserved.id, usedIncludingReservations: used + 1, limit: included }
}

/**
 * Standalone admission retained for explicit diagnostics and the M1a tests.
 * Live Store/Campaign must use the shared transaction variant above.
 */
export async function reserveMerchantAiPeriodRender(input: ReservationInput): Promise<MerchantAiPeriodAdmission> {
  assertKey(input)
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => reserveMerchantAiPeriodRenderInTransaction(tx, input),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === 'P2002') {
        const existing = await prisma.merchantAiRenderReservation.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { id: true, merchantId: true, merchantSessionId: true, status: true },
        })
        if (existing) return reuseReservation(input, existing)
      }
      if (code !== 'P2034' || attempt === 3) throw error
    }
  }
  throw new Error('Merchant AI reservation serialization retries exhausted')
}

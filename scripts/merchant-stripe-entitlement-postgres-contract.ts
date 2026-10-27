/**
 * Disposable local PostgreSQL self-service Merchant commercial contract.
 * Stripe paid-event routing is exercised by merchant-billing.test.ts; this
 * test exercises the same enrollment transaction against REAL PostgreSQL and
 * immediately submits to the actual AI period admission gate. No provider
 * requests or charges are made.
 */
import assert from 'node:assert/strict'
import { Prisma } from '@prisma/client'
import { localPostgresPrisma as db } from './lib/local-postgres-prisma'
import { enrollMerchantCommercialPlan } from '@/modules/merchant/application/merchant-billing-entitlements'
import { reserveMerchantAiPeriodRenderInTransaction } from '@/modules/merchant/application/merchant-ai-period-admission'

const now = new Date()
const start = new Date(now.getTime() - 60_000)
const end = new Date(now.getTime() + 30 * 24 * 3600_000)
const suffix = `stripe-entitlement-${Date.now()}-${process.pid}`
const created: string[] = []

type PaidPlan = 'LAUNCH' | 'GROWTH' | 'SCALE' | 'FOUNDING_PILOT'

async function makeMerchant(label: string) {
  const merchant = await db.merchant.create({
    data: {
      slug: `${suffix}-${label}`,
      name: `Disposable self-service billing ${label}`,
      classification: 'AUTOMATION',
      classificationSource: 'AUTOMATED_TEST',
      classificationReason: 'Disposable local PostgreSQL billing-to-Try-On contract.',
      pilotType: 'INTERNAL',
      referenceData: false,
    },
    select: { id: true },
  })
  created.push(merchant.id)
  const experience = await db.experience.create({
    data: {
      merchantId: merchant.id,
      slug: `${suffix}-${label}`,
      name: 'Disposable Store',
      type: 'STORE',
      status: 'ACTIVE',
      sessionTryOnLimit: 4,
    },
    select: { id: true },
  })
  const session = await db.merchantSession.create({
    data: {
      merchantId: merchant.id,
      experienceId: experience.id,
      capabilityTokenHash: `${suffix}-${label}`,
      status: 'ACTIVE',
      expiresAt: end,
    },
    select: { id: true },
  })
  return { merchantId: merchant.id, sessionId: session.id }
}

async function enroll(merchantId: string, planCode: PaidPlan, periodStart = start, periodEnd = end, status: 'PAID_ACTIVE' | 'PILOT_ACTIVE' | 'PAST_DUE' = planCode === 'FOUNDING_PILOT' ? 'PILOT_ACTIVE' : 'PAID_ACTIVE') {
  await db.$transaction(tx => enrollMerchantCommercialPlan({
    merchantId, planCode, effectiveFrom: periodStart,
    billingPeriodEnd: periodEnd, commercialStatus: status,
    source: 'postgres-contract:verified-stripe-paid-event',
  }, tx))
}

async function reserve(merchantId: string, sessionId: string, label: string) {
  return db.$transaction(tx => reserveMerchantAiPeriodRenderInTransaction(tx, {
    merchantId, merchantSessionId: sessionId,
    idempotencyKey: `${suffix}-${label}`, now,
  }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

async function main() {
  try {
    for (const [planCode, images, sessions] of [
      ['LAUNCH', 1000, 1000],
      ['GROWTH', 3500, 5000],
      ['SCALE', 7000, 10000],
    ] as const) {
      const fixture = await makeMerchant(planCode.toLowerCase())
      assert.deepEqual(await reserve(fixture.merchantId, fixture.sessionId, `${planCode}-before-pay`), {
        decision: 'DENIED', reason: 'NOT_ENROLLED',
      }, 'unpaid merchant must fail closed')

      // This enrollment is what the verified Stripe subscription/Checkout
      // event calls; it must atomically persist both numeric allowances.
      await enroll(fixture.merchantId, planCode)
      const enrolled = await db.merchant.findUniqueOrThrow({
        where: { id: fixture.merchantId },
        select: {
          planCode: true, commercialStatus: true,
          standardRenderAllowance: true, commerceSessionAllowance: true,
          entitlementEffectiveFrom: true, billingPeriodEnd: true,
        },
      })
      assert.deepEqual(enrolled, {
        planCode, commercialStatus: 'PAID_ACTIVE',
        standardRenderAllowance: images,
        commerceSessionAllowance: sessions,
        entitlementEffectiveFrom: start, billingPeriodEnd: end,
      })
      const first = await reserve(fixture.merchantId, fixture.sessionId, `${planCode}-first-paid-tryon`)
      assert.equal(first.decision, 'RESERVED', 'paid Merchant must immediately admit Store Try-On')
      if (first.decision === 'RESERVED') assert.equal(first.limit, images)
      assert.equal((await reserve(fixture.merchantId, fixture.sessionId, `${planCode}-first-paid-tryon`)).decision, 'EXISTING', 'replay never buys another image')

      // Same-plan renewal/webhook repeats never discard a previously approved
      // custom positive allowance.
      await db.merchant.update({ where: { id: fixture.merchantId }, data: {
        standardRenderAllowance: images + 100,
        commerceSessionAllowance: sessions + 100,
      } })
      await enroll(fixture.merchantId, planCode)
      const replay = await db.merchant.findUniqueOrThrow({ where: { id: fixture.merchantId } })
      assert.equal(replay.standardRenderAllowance, images + 100)
      assert.equal(replay.commerceSessionAllowance, sessions + 100)

      // Payment attention interrupts fresh dispatch despite stored capacity.
      await enroll(fixture.merchantId, planCode, start, end, 'PAST_DUE')
      assert.deepEqual(await reserve(fixture.merchantId, fixture.sessionId, `${planCode}-past-due`), {
        decision: 'DENIED', reason: 'NOT_ENROLLED',
      })
    }

    const upgrade = await makeMerchant('upgrade')
    await enroll(upgrade.merchantId, 'LAUNCH')
    await db.merchant.update({ where: { id: upgrade.merchantId }, data: { standardRenderAllowance: 9000 } })
    await enroll(upgrade.merchantId, 'GROWTH')
    const upgraded = await db.merchant.findUniqueOrThrow({ where: { id: upgrade.merchantId } })
    assert.equal(upgraded.standardRenderAllowance, 3500, 'plan upgrade resets previous plan overrides')
    assert.equal(upgraded.commerceSessionAllowance, 5000)
    assert.equal((await reserve(upgrade.merchantId, upgrade.sessionId, 'upgraded-first')).decision, 'RESERVED')

    const pilot = await makeMerchant('pilot-bonus')
    await db.merchant.update({ where: { id: pilot.merchantId }, data: { commercialExceptionCode: 'FOUNDING_LAUNCH_BONUS' } })
    await enroll(pilot.merchantId, 'FOUNDING_PILOT')
    const paidPilot = await db.merchant.findUniqueOrThrow({ where: { id: pilot.merchantId } })
    assert.equal(paidPilot.standardRenderAllowance, 5000, 'approved Pilot bonus preserved')
    assert.equal(paidPilot.commerceSessionAllowance, 1500)
    const pilotFirst = await reserve(pilot.merchantId, pilot.sessionId, 'pilot-first')
    assert.equal(pilotFirst.decision, 'RESERVED')
    if (pilotFirst.decision === 'RESERVED') assert.equal(pilotFirst.limit, 5000)

    console.log(JSON.stringify({
      result: 'PASS', realPostgres: true,
      stripeEventUnitGate: 'merchant-billing.test.ts',
      paidPlanEnrollmentToTryOn: ['LAUNCH', 'GROWTH', 'SCALE'],
      persistedDualMeter: true, idempotentReplay: true,
      upgradeResetsAllowance: true, pastDueDenied: true,
      pilotBonusPreserved: true, externalAiCalls: 0,
    }))
  } finally {
    for (const merchantId of created.reverse()) {
      await db.merchantAiRenderReservation.deleteMany({ where: { merchantId } })
      await db.merchantSession.deleteMany({ where: { merchantId } })
      await db.experience.deleteMany({ where: { merchantId } })
      await db.merchant.delete({ where: { id: merchantId } })
    }
    await db.$disconnect()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })

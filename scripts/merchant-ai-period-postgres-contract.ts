/**
 * Disposable PostgreSQL M1b contract, with simulated provider dispatch ONLY.
 * Run after Prisma migrate deploy against GitHub Actions' local PG service.
 */
import assert from 'node:assert/strict'
import { prisma } from '@/lib/prisma'
import { localPostgresPrisma as db } from './lib/local-postgres-prisma'
import { reserveMerchantAiPeriodRenderInTransaction } from '@/modules/merchant/application/merchant-ai-period-admission'
import { claimStoreTryOnSlot } from '@/modules/store/application/submit-store-tryon'
import { DEFAULT_STORE_DEMO_LIMITS } from '@/modules/store/domain/usage-policy'
import { settleStoreTryOnUsage } from '@/modules/store/application/settle-store-usage'
import { releaseMerchantAiRenderForTerminalFailure } from '@/modules/merchant/application/merchant-ai-period-lifecycle'

process.env.VISUTRY_MERCHANT_AI_BUDGET_MODE = 'ENFORCE' // disposable PG process only
const now = new Date()
const periodStart = new Date(now.getTime() - 24 * 3600_000)
const periodEnd = new Date(now.getTime() + 29 * 24 * 3600_000)
const suffix = 'm1b-' + Date.now() + '-' + process.pid

async function fixture(label: string, allowance: number, version = 'v2') {
  const merchant = await db.merchant.create({
    data: {
      slug: 'm1b-' + label + '-' + suffix,
      name: 'M1b ' + label + ' disposable contract',
      pilotType: 'INTERNAL', referenceData: false,
      classification: 'AUTOMATION', classificationSource: 'AUTOMATED_TEST',
      classificationReason: 'Offline M1b PG admission evidence; no external calls.',
      planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
      entitlementVersion: version,
      pricingVersion: version === 'v2' ? 'v2-local-fixture' : 'v1',
      standardRenderAllowance: allowance,
      entitlementEffectiveFrom: periodStart,
      billingPeriodEnd: periodEnd,
    },
    select: { id: true },
  })
  const frame = await db.merchantFrame.create({
    data: {
      merchantId: merchant.id, sku: 'm1b-' + label + '-' + suffix,
      name: 'M1b local frame', shape: 'rectangle', status: 'ACTIVE',
    }, select: { id: true },
  })
  const session = await db.merchantSession.create({
    data: {
      merchantId: merchant.id,
      capabilityTokenHash: 'm1b-' + label + '-' + suffix,
      status: 'ACTIVE', expiresAt: periodEnd,
    },
    select: { id: true },
  })
  return { merchantId: merchant.id, sessionId: session.id, frameId: frame.id }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
const fixtures: Fixture[] = []
let simulatedDispatchCount = 0

async function claim(f: Fixture, key: string, at: Date = now) {
  // Calls the REAL Store claim/admission function. No StoreGenerationPort
  // is invoked; mock dispatch is counted only after the durable claim.
  // The test's provider remains entirely offline.
  try {
    const row = await claimStoreTryOnSlot({
      merchantId: f.merchantId,
      merchantSessionId: f.sessionId,
      merchantFrameId: f.frameId,
      idempotencyKey: key,
      clientSubmissionId: key,
      now: at,
      renderLimits: {
        ...DEFAULT_STORE_DEMO_LIMITS,
        maxSuccessfulRendersPerMerchant: Number.POSITIVE_INFINITY,
        maxSuccessfulRendersPerSession: Number.POSITIVE_INFINITY,
        maxAttemptsPerSession: Number.POSITIVE_INFINITY,
      },
      tryOnOrigin: 'STORE_PILOT',
      batchId: 'm1b-pg-batch-' + f.sessionId,
      maxCompareFrames: 4,
      usagePolicyKind: 'merchant_allowance',
      isTest: true,
    })
    if (!row.reusedExisting) simulatedDispatchCount += 1
    return { decision: row.reusedExisting ? 'EXISTING' : 'RESERVED', taskId: row.taskId }
  } catch (error) {
    if ((error as { code?: string }).code === 'AI_USAGE_LIMIT_REACHED') {
      return { decision: 'DENIED', taskId: null }
    }
    throw error
  }
}
async function main() {
  const a = await fixture('concurrency', 1); fixtures.push(a)
  const b = await fixture('failure', 1); fixtures.push(b)
  const v1 = await fixture('legacy', 1, 'v1'); fixtures.push(v1)

  try {
    // Distinct concurrent final-slot claims use real SERIALIZABLE PG txs.
    const [left, right] = await Promise.all([
      claim(a, 'left-' + suffix), claim(a, 'right-' + suffix),
    ])
    const winners = [left, right].filter(x => x.decision === 'RESERVED')
    assert.equal(winners.length, 1, 'one of two final-slot claims succeeds')
    assert.equal(simulatedDispatchCount, 1, 'only one mock provider dispatch')
    const successTaskId = winners[0]?.taskId
    assert.ok(successTaskId)
    assert.equal((await claim(a, 'third-' + suffix)).decision, 'DENIED')
    await db.tryOnTask.update({
      where: { id: successTaskId },
      data: { status: 'COMPLETED', resultImageUrl: 'mock://persisted-result' },
    })
    const usage = {} as unknown as Parameters<typeof settleStoreTryOnUsage>[0]['usage']
    const settleInput = {
      taskId: successTaskId, merchantId: a.merchantId, merchantSessionId: a.sessionId,
      usagePolicy: { kind: 'merchant_allowance' as const, merchantId: a.merchantId }, usage,
    }
    assert.equal((await settleStoreTryOnUsage(settleInput)).settled, true)
    assert.equal((await settleStoreTryOnUsage(settleInput)).alreadySettled, true)
    assert.equal(await db.merchantUsageLedger.count({
      where: {
        merchantId: a.merchantId, tryOnTaskId: successTaskId, kind: 'RENDER_SUCCESS',
      },
    }), 1)
    assert.equal((await db.merchantAiRenderReservation.findUnique({
      where: { tryOnTaskId: successTaskId },
    }))?.status, 'SETTLED')
    assert.equal((await claim(a, 'after-success-' + suffix)).decision, 'DENIED')
    assert.equal((await claim(a, 'left-' + suffix)).decision, 'EXISTING',
      'same logical request remains bound to its original period/task')

    // Renewal must count a different period while preserving the old SETTLED.
    const newPeriodEnd = new Date(periodEnd.getTime() + 30 * 24 * 3600_000)
    await db.merchant.update({
      where: { id: a.merchantId },
      data: { entitlementEffectiveFrom: periodEnd, billingPeriodEnd: newPeriodEnd },
    })
    const renewal = await claim(a, 'renewal-' + suffix,
      new Date(periodEnd.getTime() + 3600_000))
    assert.equal(renewal.decision, 'RESERVED')
    assert.equal(await db.merchantAiRenderReservation.count({
      where: { merchantId: a.merchantId },
    }), 2, 'old period settlement survives new-period admission')

    // Pre-dispatch failure frees a slot; UNKNOWN does not.
    const first = await claim(b, 'pre-dispatch-' + suffix)
    assert.ok(first.taskId)
    await db.tryOnTask.update({
      where: { id: first.taskId! }, data: { status: 'FAILED' },
    })
    assert.equal(await releaseMerchantAiRenderForTerminalFailure({
      taskId: first.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId,
    }), 'RELEASED')

    const unknown = await claim(b, 'ambiguous-' + suffix)
    assert.ok(unknown.taskId)
    await db.tryOnTask.update({
      where: { id: unknown.taskId! },
      data: {
        status: 'FAILED', userImageUrl: 'mock://uploaded-user',
        metadata: {
          serviceType: 'kie', dispatchOutcome: 'UNKNOWN',
          providerSubmissionStatus: 'UNKNOWN',
        },
      },
    })
    assert.equal(await releaseMerchantAiRenderForTerminalFailure({
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId,
    }), 'HELD_AMBIGUOUS')
    assert.equal((await claim(b, 'blocked-unknown-' + suffix)).decision, 'DENIED')

    // A known accepted task with an explicitly definitive FAILED status can release.
    await db.tryOnTask.update({
      where: { id: unknown.taskId! },
      data: {
        metadata: {
          serviceType: 'kie', dispatchOutcome: 'ACCEPTED',
          externalTaskId: 'mock-confirmed-terminal',
        },
      },
    })
    assert.equal(await releaseMerchantAiRenderForTerminalFailure({
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId,
    }), 'RELEASED')
    assert.equal(await releaseMerchantAiRenderForTerminalFailure({
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId,
    }), 'ALREADY_RELEASED')
    assert.equal((await claim(b, 'released-slot-' + suffix)).decision, 'RESERVED')

    assert.equal((await claim(v1, 'legacy-' + suffix)).decision, 'RESERVED',
      'legacy contract must continue without a v2 hold')
    assert.equal(await db.merchantAiRenderReservation.count({
      where: { merchantId: v1.merchantId },
    }), 0)
    const crossTenant = await prisma.$transaction(tx =>
      reserveMerchantAiPeriodRenderInTransaction(tx, {
        merchantId: b.merchantId, merchantSessionId: a.sessionId,
        idempotencyKey: 'foreign-' + suffix, now,
      }))
    assert.deepEqual(crossTenant, { decision: 'DENIED', reason: 'SESSION_NOT_FOUND' })

    console.log(JSON.stringify({
      result: 'PASS', localPostgres: true, simulatedDispatchOnly: true,
      finalSlotConcurrentWinners: winners.length,
      ambiguousRemainsReserved: true, onceOnlySuccess: true,
      legacyUnchanged: true,
    }))
  } finally {
    for (const f of fixtures.reverse()) {
      await db.merchantUsageLedger.deleteMany({ where: { merchantId: f.merchantId } })
      await db.merchantAiRenderReservation.deleteMany({ where: { merchantId: f.merchantId } })
      await db.tryOnTask.deleteMany({ where: { merchantId: f.merchantId } })
      await db.storeAbuseCounter.deleteMany({ where: { merchantId: f.merchantId } })
      await db.merchantSession.deleteMany({ where: { merchantId: f.merchantId } })
      await db.merchantFrame.deleteMany({ where: { merchantId: f.merchantId } })
      await db.merchant.delete({ where: { id: f.merchantId } })
    }
    await prisma.$disconnect()
    await db.$disconnect()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })

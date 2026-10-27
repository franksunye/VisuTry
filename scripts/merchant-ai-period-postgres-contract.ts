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
import { inspectMerchantAiPeriodShadow } from '@/modules/merchant/application/merchant-ai-period-shadow'

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
  // Original M1b tests exercise monthly risk independently of configurable
  // session caps. Give each v2 fixture the highest explicit 4-image cap.
  const baselineExperience = version === 'v2' ? await db.experience.create({
    data: { merchantId: merchant.id, type: 'STORE', slug: 'm1b-base',
      name: 'M1b test store', status: 'ACTIVE', sessionTryOnLimit: 4 },
    select: { id: true },
  }) : null
  const session = await db.merchantSession.create({
    data: {
      merchantId: merchant.id,
      experienceId: baselineExperience?.id ?? null,
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
      db,
    })
    if (!row.reusedExisting) simulatedDispatchCount += 1
    return { decision: row.reusedExisting ? 'EXISTING' : 'RESERVED', taskId: row.taskId }
  } catch (error) {
    if (['AI_USAGE_LIMIT_REACHED', 'AI_SESSION_LIMIT_REACHED'].includes(
      (error as { code?: string }).code ?? '',
    )) {
      return { decision: 'DENIED', taskId: null }
    }
    throw error
  }
}
async function main() {
  const a = await fixture('concurrency', 1); fixtures.push(a)
  const b = await fixture('failure', 1); fixtures.push(b)
  const idem = await fixture('same-key', 1); fixtures.push(idem)
  const v1 = await fixture('legacy', 1, 'v1'); fixtures.push(v1)
  const missingResult = await fixture('missing-result', 1); fixtures.push(missingResult)
  const shadow = await fixture('shadow', 1); fixtures.push(shadow)
  const grsaiFailure = await fixture('grsai-failure', 1); fixtures.push(grsaiFailure)
  const kieFailure = await fixture('kie-failure', 1); fixtures.push(kieFailure)
  const lateSettlement = await fixture('late-settlement', 1); fixtures.push(lateSettlement)
  const sessionCapped = await Promise.all(([1, 2, 4] as const).map(async limit => {
    const row = await fixture('session-cap-' + limit, 10)
    fixtures.push(row)
    // fixture() already provisions this Merchant's only active Store.
    // Change that Experience rather than violating the one-active-Store
    // unique constraint in the canonical database schema.
    const session = await db.merchantSession.findUniqueOrThrow({
      where: { id: row.sessionId }, select: { experienceId: true },
    })
    if (!session.experienceId) throw new Error('M2 fixture must bind a Store Experience')
    await db.experience.update({
      where: { id: session.experienceId }, data: { sessionTryOnLimit: limit },
    })
    return { ...row, sessionLimit: limit }
  }))

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
      usagePolicy: { kind: 'merchant_allowance' as const, merchantId: a.merchantId }, usage, db,
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

    // The same key under simultaneous requests must map to one task and
    // exactly one mock dispatch. The Store claim re-checks idempotency after
    // PostgreSQL serializable conflicts rather than reusing capacity.
    const dispatchBeforeReplay = simulatedDispatchCount
    const [replayOne, replayTwo] = await Promise.all([
      claim(idem, 'same-key-' + suffix), claim(idem, 'same-key-' + suffix),
    ])
    assert.equal(replayOne.taskId, replayTwo.taskId)
    assert.deepEqual([replayOne.decision, replayTwo.decision].sort(),
      ['EXISTING', 'RESERVED'])
    assert.equal(simulatedDispatchCount, dispatchBeforeReplay + 1)
    assert.equal(await db.merchantAiRenderReservation.count({
      where: { merchantId: idem.merchantId },
    }), 1)

    // Verify 1 / 2 / 4 options against actual Store claim/admission
    // using the existing merchant period advisory lock. The 10-image
    // monthly allowance deliberately exceeds each session cap.
    for (const f of sessionCapped) {
      const admitted: Array<Awaited<ReturnType<typeof claim>>> = []
      for (let i = 0; i < f.sessionLimit; i++) {
        admitted.push(await claim(f, 'session-cap-' + f.sessionLimit + '-' + i + '-' + suffix))
      }
      assert.equal(admitted.filter(x => x.decision === 'RESERVED').length, f.sessionLimit)
      assert.equal((await claim(f, 'session-overflow-' + suffix)).decision, 'DENIED',
        'session cap must precede the monthly 10-image ceiling')
      assert.equal(await db.merchantAiRenderReservation.count({
        where: { merchantId: f.merchantId, status: 'RESERVED' },
      }), f.sessionLimit)
      const first = admitted[0]?.taskId
      assert.ok(first)
      await db.tryOnTask.update({ where: { id: first }, data: { status: 'FAILED' } })
      assert.equal(await releaseMerchantAiRenderForTerminalFailure({
        taskId: first, merchantId: f.merchantId, merchantSessionId: f.sessionId, db,
      }), 'RELEASED')
      assert.equal((await claim(f, 'session-after-release-' + suffix)).decision, 'RESERVED',
        'definitive failure restores session allowance')
    }

    // A COMPLETED task without a durably persisted result is NOT a
    // chargeable success. It must keep the single slot reserved until the
    // result is available and the RENDER_SUCCESS ledger can be written.
    const imagePending = await claim(missingResult, 'no-image-' + suffix)
    assert.ok(imagePending.taskId)
    await db.tryOnTask.update({
      where: { id: imagePending.taskId! },
      data: { status: 'COMPLETED' },
    })
    const pendingSettlement = await settleStoreTryOnUsage({
      taskId: imagePending.taskId!,
      merchantId: missingResult.merchantId,
      merchantSessionId: missingResult.sessionId,
      usagePolicy: { kind: 'merchant_allowance', merchantId: missingResult.merchantId },
      usage: {} as unknown as Parameters<typeof settleStoreTryOnUsage>[0]['usage'],
      db,
    })
    assert.equal(pendingSettlement.settled, false, 'no image means no quota settlement')
    assert.equal(await db.merchantUsageLedger.count({
      where: { merchantId: missingResult.merchantId, kind: 'RENDER_SUCCESS' },
    }), 0)
    assert.equal((await db.merchantAiRenderReservation.findUnique({
      where: { tryOnTaskId: imagePending.taskId! },
    }))?.status, 'RESERVED', 'missing result preserves the in-flight hold')
    assert.equal((await claim(missingResult, 'no-image-next-' + suffix)).decision, 'DENIED')
    await db.tryOnTask.update({
      where: { id: imagePending.taskId! },
      data: { resultImageUrl: 'mock://persisted-recovered-result' },
    })
    assert.equal((await settleStoreTryOnUsage({
      taskId: imagePending.taskId!,
      merchantId: missingResult.merchantId,
      merchantSessionId: missingResult.sessionId,
      usagePolicy: { kind: 'merchant_allowance', merchantId: missingResult.merchantId },
      usage: {} as unknown as Parameters<typeof settleStoreTryOnUsage>[0]['usage'],
      db,
    })).settled, true, 'the original task can settle after result persistence')

    // SHADOW must be read-only for the v2 budget even when the configured
    // render allowance is exhausted. The existing v1-style RENDER_ATTEMPT
    // ledger remains in use; no new reservation rows are permitted.
    process.env.VISUTRY_MERCHANT_AI_BUDGET_MODE = 'SHADOW'
    const shadowRead = await inspectMerchantAiPeriodShadow({
      merchantId: shadow.merchantId, now, db,
    })
    assert.equal(shadowRead?.decision, 'AVAILABLE')
    const shadowOne = await claim(shadow, 'shadow-1-' + suffix)
    const shadowTwo = await claim(shadow, 'shadow-2-' + suffix)
    assert.equal(shadowOne.decision, 'RESERVED')
    assert.equal(shadowTwo.decision, 'RESERVED',
      'SHADOW must not enforce the v2 render limit')
    assert.equal(await db.merchantAiRenderReservation.count({
      where: { merchantId: shadow.merchantId },
    }), 0, 'SHADOW must not write billing-period reservation rows')
    process.env.VISUTRY_MERCHANT_AI_BUDGET_MODE = 'ENFORCE'

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
      taskId: first.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId, db,
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
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId, db,
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
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId, db,
    }), 'RELEASED')
    assert.equal(await releaseMerchantAiRenderForTerminalFailure({
      taskId: unknown.taskId!, merchantId: b.merchantId, merchantSessionId: b.sessionId, db,
    }), 'ALREADY_RELEASED')
    assert.equal((await claim(b, 'released-slot-' + suffix)).decision, 'RESERVED')

    // Both aggregator adapters must obey the same idempotent/ambiguous
    // merchant-budget rule. HTTP 429/503 alone does not prove rejection.
    for (const [kind, f, httpCode] of [
      ['grsai', grsaiFailure, 503],
      ['kie', kieFailure, 429],
    ] as const) {
      const initial = await claim(f, kind + '-initial-' + suffix)
      assert.equal(initial.decision, 'RESERVED')
      assert.ok(initial.taskId)
      await db.tryOnTask.update({
        where: { id: initial.taskId! },
        data: {
          status: 'FAILED', userImageUrl: 'mock://uploaded-user',
          errorMessage: 'Synthetic provider ' + httpCode,
          metadata: {
            serviceType: kind, dispatchOutcome: 'UNKNOWN',
            providerSubmissionStatus: 'UNKNOWN', httpStatus: httpCode,
          },
        },
      })
      assert.equal(await releaseMerchantAiRenderForTerminalFailure({
        taskId: initial.taskId!, merchantId: f.merchantId, merchantSessionId: f.sessionId, db,
      }), 'HELD_AMBIGUOUS', 'HTTP error cannot be equated to no billable dispatch')
      const countBeforeReplay: number = simulatedDispatchCount
      const replay = await claim(f, kind + '-initial-' + suffix)
      assert.equal(replay.taskId, initial.taskId, 'same identity recovers original task')
      assert.equal(replay.decision, 'EXISTING')
      assert.equal(simulatedDispatchCount, countBeforeReplay, 'same identity cannot create another provider task')
      assert.equal((await claim(f, kind + '-blocked-' + suffix)).decision, 'DENIED')
      await db.tryOnTask.update({
        where: { id: initial.taskId! },
        data: {
          metadata: {
            serviceType: kind, dispatchOutcome: 'ACCEPTED',
            providerSubmissionStatus: 'ACCEPTED',
            externalTaskId: 'mock-provider-terminal-' + kind,
          },
        },
      })
      assert.equal(await releaseMerchantAiRenderForTerminalFailure({
        taskId: initial.taskId!, merchantId: f.merchantId, merchantSessionId: f.sessionId, db,
      }), 'RELEASED', 'only an accepted task with conclusive terminal failure releases')
      assert.equal((await claim(f, kind + '-after-confirmed-' + suffix)).decision, 'RESERVED')
    }

    // A RESERVED task from the expired period still belongs to that original
    // period when it eventually completes, and must not consume new capacity.
    const late = await claim(lateSettlement, 'late-old-' + suffix)
    assert.equal(late.decision, 'RESERVED')
    assert.ok(late.taskId)
    const lateNewEnd = new Date(periodEnd.getTime() + 30 * 86400_000)
    await db.merchant.update({
      where: { id: lateSettlement.merchantId },
      data: { entitlementEffectiveFrom: periodEnd, billingPeriodEnd: lateNewEnd },
    })
    const lateNew = await claim(lateSettlement, 'late-new-' + suffix, new Date(periodEnd.getTime() + 1000))
    assert.equal(lateNew.decision, 'RESERVED')
    await db.tryOnTask.update({
      where: { id: late.taskId! },
      data: { status: 'COMPLETED', resultImageUrl: 'mock://late-period-success' },
    })
    assert.equal((await settleStoreTryOnUsage({
      taskId: late.taskId!, merchantId: lateSettlement.merchantId,
      merchantSessionId: lateSettlement.sessionId,
      usagePolicy: { kind: 'merchant_allowance', merchantId: lateSettlement.merchantId },
      usage: {} as unknown as Parameters<typeof settleStoreTryOnUsage>[0]['usage'], db,
    })).settled, true)
    const oldHold = await db.merchantAiRenderReservation.findUnique({
      where: { tryOnTaskId: late.taskId! },
    })
    assert.equal(oldHold?.status, 'SETTLED')
    assert.equal(oldHold?.periodEnd.toISOString(), periodEnd.toISOString())
    assert.equal((await db.merchantAiRenderReservation.findUnique({
      where: { tryOnTaskId: lateNew.taskId! },
    }))?.status, 'RESERVED', 'new-period capacity is unaffected by late old-period settlement')

    assert.equal((await claim(v1, 'legacy-' + suffix)).decision, 'RESERVED',
      'legacy contract must continue without a v2 hold')
    assert.equal(await db.merchantAiRenderReservation.count({
      where: { merchantId: v1.merchantId },
    }), 0)
    const crossTenant = await db.$transaction(tx =>
      reserveMerchantAiPeriodRenderInTransaction(tx, {
        merchantId: b.merchantId, merchantSessionId: a.sessionId,
        idempotencyKey: 'foreign-' + suffix, now,
      }))
    assert.deepEqual(crossTenant, { decision: 'DENIED', reason: 'SESSION_NOT_FOUND' })

    console.log(JSON.stringify({
      result: 'PASS', localPostgres: true, simulatedDispatchOnly: true,
      finalSlotConcurrentWinners: winners.length,
      sameKeyConcurrentSingleTask: true,
      ambiguousRemainsReserved: true, onceOnlySuccess: true,
      noImageNoSettlement: true, shadowReadOnly: true,
      kieAndGrsai429503Ambiguity: true, crossPeriodLateSettlement: true,
      perExperienceSessionLimits124: true, legacyUnchanged: true,
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

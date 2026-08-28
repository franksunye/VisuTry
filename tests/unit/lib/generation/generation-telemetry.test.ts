/** @jest-environment node */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/lib/prisma', () => {
  const { createInMemoryGenerationPrisma } = require('./in-memory-generation-prisma')
  return { prisma: createInMemoryGenerationPrisma() }
})

import { prisma } from '@/lib/prisma'
import {
  startGenerationRequest,
  startGenerationAttempt,
  markGenerationAttemptSubmitted,
  recordUsableGenerationSuccess,
  recordGenerationFailure,
  recordGenerationTimeoutForRetry,
  computeAttemptLatencies,
  ensureGenerationRequestFromTask,
} from '@/lib/generation/telemetry'
import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'
import { STALE_CONSUMER_DISPATCH_ERROR } from '@/lib/generation/reconcile-stale-consumer-dispatch'

const db = prisma as unknown as ReturnType<typeof import('./in-memory-generation-prisma').createInMemoryGenerationPrisma>

describe('generation telemetry writer', () => {
  beforeEach(() => {
    db._requests.splice(0, db._requests.length)
    db._attempts.splice(0, db._attempts.length)
    jest.clearAllMocks()
  })

  it('records a successful first attempt with accurate duration and attemptCount', async () => {
    const startedAt = new Date(Date.now() - 1500)
    await startGenerationRequest({
      tryOnTaskId: 'task-success',
      origin: 'CONSUMER',
      userId: 'user-1',
      clientSubmissionId: 'sub-1',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt,
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-success', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-success', 'ext-1', 120)
    await recordUsableGenerationSuccess('task-success')
    await recordUsableGenerationSuccess('task-success')

    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(1)
    expect(db._requests[0].finalStatus).toBe('COMPLETED')
    expect(db._requests[0].attemptCount).toBe(1)
    expect(db._requests[0].endToEndDurationMs).toBeGreaterThanOrEqual(1500)
    expect(db._attempts[0].status).toBe('COMPLETED')
    expect(db._attempts[0].providerTaskId).toBe('ext-1')
    expect(db._attempts[0].submitDurationMs).toBe(120)
  })

  it('does not treat submit latency as provider processing duration', async () => {
    const submittedAt = new Date(Date.now() - 5_000)
    await startGenerationRequest({
      tryOnTaskId: 'task-latency',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt: submittedAt,
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-latency', provider: 'grsai', startedAt: submittedAt })
    await markGenerationAttemptSubmitted('task-latency', 'ext-lat', 800)
    await recordUsableGenerationSuccess('task-latency')

    expect(db._attempts[0].submitDurationMs).toBe(800)
    expect(db._attempts[0].attemptDurationMs).toBeGreaterThanOrEqual(5_000)
    expect(db._attempts[0].providerDurationMs).toBe(
      (db._attempts[0].attemptDurationMs ?? 0) - 800,
    )
    expect(db._attempts[0].providerDurationMs).not.toBe(db._attempts[0].submitDurationMs)
    expect(db._requests[0].endToEndDurationMs).toBeGreaterThanOrEqual(5_000)
  })

  it('keeps request STARTED after timeout when a retry is still allowed', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-retry-fail',
      origin: 'CAMPAIGN',
      campaignId: 'exp-c',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-retry-fail', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-retry-fail', 'ext-1', 80)
    await recordGenerationTimeoutForRetry('task-retry-fail', 'google gemini timeout...')
    expect(db._requests[0].finalStatus).toBe('STARTED')
    expect(db._requests[0].origin).toBe('CAMPAIGN')

    await startGenerationAttempt({ tryOnTaskId: 'task-retry-fail', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-retry-fail', 'ext-2', 90)
    await recordGenerationFailure('task-retry-fail', 'google gemini timeout...', { source: 'poll' })

    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(2)
    expect(db._requests[0].finalStatus).toBe('FAILED')
    expect(db._requests[0].attemptCount).toBe(2)
    expect(db._requests[0].origin).toBe('CAMPAIGN')
    expect(db._attempts[0].status).toBe('TIMEOUT')
    expect(db._attempts[0].failureStage).toBe('PROVIDER_PROCESSING')
    expect(db._attempts[1].status).toBe('TIMEOUT')
    expect(db._requests[0].failureStage).toBe('PROVIDER_PROCESSING')
  })

  it('does not rewrite timestamps on duplicate poll after terminal failure', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-dup-fail',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt: new Date(Date.now() - 2_000),
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-dup-fail', provider: 'grsai' })
    await recordGenerationFailure('task-dup-fail', 'upstream failed')
    const completedAt = db._requests[0].completedAt?.getTime()
    const duration = db._requests[0].endToEndDurationMs
    const attemptCompletedAt = db._attempts[0].completedAt?.getTime()

    await new Promise((resolve) => setTimeout(resolve, 20))
    await recordGenerationFailure('task-dup-fail', 'upstream failed again')
    await startGenerationAttempt({ tryOnTaskId: 'task-dup-fail', provider: 'grsai' })

    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(1)
    expect(db._requests[0].finalStatus).toBe('FAILED')
    expect(db._requests[0].completedAt?.getTime()).toBe(completedAt)
    expect(db._requests[0].endToEndDurationMs).toBe(duration)
    expect(db._attempts[0].completedAt?.getTime()).toBe(attemptCompletedAt)
  })

  it('classifies GrsAi submit timeout as PROVIDER_TIMEOUT / SUBMIT', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-submit-timeout',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-submit-timeout', provider: 'grsai' })
    await recordGenerationFailure('task-submit-timeout', 'The operation was aborted due to timeout', {
      source: 'submit',
      isTimeout: true,
      failureStage: 'SUBMIT',
    })

    expect(db._requests[0].finalStatus).toBe('FAILED')
    expect(db._requests[0].finalErrorCode).toBe('PROVIDER_TIMEOUT')
    expect(db._requests[0].failureStage).toBe('SUBMIT')
    expect(db._attempts[0].status).toBe('TIMEOUT')
    expect(db._attempts[0].failureStage).toBe('SUBMIT')
  })

  it('classifies stale consumer dispatch as INTERNAL_ERROR / STALE_DISPATCH', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-stale',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-stale', provider: 'grsai' })
    await recordGenerationFailure('task-stale', STALE_CONSUMER_DISPATCH_ERROR, { source: 'internal' })

    expect(db._requests[0].finalErrorCode).toBe('INTERNAL_ERROR')
    expect(db._requests[0].failureStage).toBe('STALE_DISPATCH')
    expect(db._attempts[0].failureStage).toBe('STALE_DISPATCH')
    expect(db._attempts[0].status).toBe('FAILED')
  })

  it('preserves STORE and CAMPAIGN origin across retries', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-store-origin',
      origin: 'STORE',
      storeId: 'exp-store',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-store-origin', provider: 'grsai' })
    await recordGenerationTimeoutForRetry('task-store-origin', 'timeout')
    await startGenerationAttempt({ tryOnTaskId: 'task-store-origin', provider: 'grsai' })
    await recordUsableGenerationSuccess('task-store-origin')
    expect(db._requests[0].origin).toBe('STORE')
    expect(db._requests[0].storeId).toBe('exp-store')

    await startGenerationRequest({
      tryOnTaskId: 'task-campaign-meta',
      origin: 'STORE',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await ensureGenerationRequestFromTask({
      id: 'task-campaign-meta',
      origin: 'STORE_DEMO',
      metadata: { telemetryOrigin: 'CAMPAIGN', campaignId: 'exp-c' },
      type: 'GLASSES',
    })
    expect(db._requests.find((row) => row.tryOnTaskId === 'task-campaign-meta')?.origin).toBe('STORE')

    const recovered = await ensureGenerationRequestFromTask({
      id: 'task-campaign-recover',
      origin: 'STORE_DEMO',
      metadata: { telemetryOrigin: 'CAMPAIGN', campaignId: 'exp-c' },
      type: 'GLASSES',
    })
    expect(recovered?.origin).toBe('CAMPAIGN')
    expect(db._requests.find((row) => row.tryOnTaskId === 'task-campaign-recover')?.origin).toBe('CAMPAIGN')
    expect(db._requests.find((row) => row.tryOnTaskId === 'task-campaign-recover')?.campaignId).toBe('exp-c')
  })

  it('excludes isTest rows and incomplete observations from the default baseline report', async () => {
    const startedAt = new Date(Date.now() - 60_000)
    await startGenerationRequest({
      tryOnTaskId: 'prod-ok',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt,
      isTest: false,
    })
    await startGenerationAttempt({ tryOnTaskId: 'prod-ok', provider: 'grsai' })
    await recordUsableGenerationSuccess('prod-ok')

    await startGenerationRequest({
      tryOnTaskId: 'qa-ok',
      origin: 'STORE',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt,
      isTest: true,
    })
    await startGenerationAttempt({ tryOnTaskId: 'qa-ok', provider: 'grsai' })
    await recordUsableGenerationSuccess('qa-ok')

    await startGenerationRequest({
      tryOnTaskId: 'inflight',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt,
    })
    await startGenerationAttempt({ tryOnTaskId: 'inflight', provider: 'grsai' })

    const baseline = await queryGenerationReliabilityReport({ period: '24h' })
    expect(baseline.requests).toBe(2)
    expect(baseline.inFlight).toBe(1)
    expect(baseline.terminalRequests).toBe(1)
    const prodRequest = db._requests.find((row) => row.tryOnTaskId === 'prod-ok')
    const prodAttempt = db._attempts.find((row) => row.requestId === prodRequest?.id)
    expect(baseline.p50).toBe(prodRequest?.endToEndDurationMs)
    expect(baseline.attemptP50).toBe(prodAttempt?.providerDurationMs)

    const withTest = await queryGenerationReliabilityReport({ period: '24h', includeTest: true })
    expect(withTest.requests).toBe(3)
  })

  it('computes provider processing as attempt wall-clock minus submit latency', () => {
    const submittedAt = new Date('2026-08-28T00:00:00.000Z')
    const completedAt = new Date('2026-08-28T00:00:10.000Z')
    expect(computeAttemptLatencies({ submittedAt, completedAt, submitDurationMs: 1200 })).toEqual({
      attemptDurationMs: 10_000,
      providerDurationMs: 8_800,
    })
    expect(computeAttemptLatencies({ submittedAt, completedAt, submitDurationMs: null })).toEqual({
      attemptDurationMs: 10_000,
      providerDurationMs: 10_000,
    })
  })

  it('records provider failure without creating a second request', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-fail',
      origin: 'STORE',
      merchantId: 'm1',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-fail', provider: 'grsai' })
    await recordGenerationFailure('task-fail', 'upstream failed')

    expect(db._requests).toHaveLength(1)
    expect(db._requests[0].finalStatus).toBe('FAILED')
    expect(db._requests[0].finalErrorCode).toBe('PROVIDER_FAILED')
    expect(db._attempts[0].status).toBe('FAILED')
  })

  it('records provider timeout as a timeout attempt', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-timeout',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-timeout', provider: 'grsai' })
    await recordGenerationFailure('task-timeout', 'google gemini timeout...', { source: 'poll' })

    expect(db._attempts[0].status).toBe('TIMEOUT')
    expect(db._attempts[0].isTimeout).toBe(true)
    expect(db._requests[0].finalErrorCode).toBe('PROVIDER_TIMEOUT')
  })

  it('creates a new attempt after timeout retry, then success', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-retry',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-retry', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-retry', 'ext-1', 80)
    await recordGenerationTimeoutForRetry('task-retry', 'google gemini timeout...')
    await startGenerationAttempt({ tryOnTaskId: 'task-retry', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-retry', 'ext-2', 90)
    await recordUsableGenerationSuccess('task-retry')

    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(2)
    expect(db._requests[0].attemptCount).toBe(2)
    expect(db._requests[0].finalStatus).toBe('COMPLETED')
    expect(db._attempts[0].status).toBe('TIMEOUT')
    expect(db._attempts[1].status).toBe('COMPLETED')
    expect(db._attempts[1].providerTaskId).toBe('ext-2')
  })

  it('keeps independent frame generations as separate logical requests', async () => {
    for (const preset of ['browline-classic', 'rectangle-classic', 'wayfarer-classic']) {
      await startGenerationRequest({
        tryOnTaskId: `task-${preset}`,
        origin: 'CONSUMER',
        clientSubmissionId: `batch:${preset}:1`,
        generationType: 'GLASSES',
        provider: 'grsai',
      })
      await startGenerationAttempt({ tryOnTaskId: `task-${preset}`, provider: 'grsai' })
      await recordUsableGenerationSuccess(`task-${preset}`)
    }

    expect(db._requests).toHaveLength(3)
    expect(db._attempts).toHaveLength(3)
    expect(new Set(db._requests.map((row) => row.tryOnTaskId)).size).toBe(3)
  })

  it('is idempotent for duplicate poll/callback completion', async () => {
    await startGenerationRequest({
      tryOnTaskId: 'task-poll',
      origin: 'CAMPAIGN',
      campaignId: 'exp-1',
      generationType: 'GLASSES',
      provider: 'grsai',
    })
    await startGenerationAttempt({ tryOnTaskId: 'task-poll', provider: 'grsai' })
    await startGenerationAttempt({ tryOnTaskId: 'task-poll', provider: 'grsai' })
    await markGenerationAttemptSubmitted('task-poll', 'ext-poll', 50)
    await markGenerationAttemptSubmitted('task-poll', 'ext-poll', 50)
    await recordUsableGenerationSuccess('task-poll')
    await recordUsableGenerationSuccess('task-poll')

    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(1)
    expect(db._attempts[0].status).toBe('COMPLETED')
  })

  it('attributes Consumer, Store, and Campaign origins', async () => {
    await startGenerationRequest({ tryOnTaskId: 'c', origin: 'CONSUMER', generationType: 'GLASSES', provider: 'grsai' })
    await startGenerationRequest({ tryOnTaskId: 's', origin: 'STORE', merchantId: 'm1', storeId: 'exp-store', generationType: 'GLASSES', provider: 'grsai' })
    await startGenerationRequest({ tryOnTaskId: 'g', origin: 'CAMPAIGN', merchantId: 'm1', campaignId: 'exp-campaign', generationType: 'GLASSES', provider: 'grsai' })

    expect(db._requests.map((row) => row.origin).sort()).toEqual(['CAMPAIGN', 'CONSUMER', 'STORE'])
    expect(db._requests.find((row) => row.origin === 'CAMPAIGN')?.campaignId).toBe('exp-campaign')
  })

  it('does not treat repeated startGenerationRequest as a new logical request', async () => {
    await startGenerationRequest({ tryOnTaskId: 'task-dup', origin: 'CONSUMER', generationType: 'GLASSES', provider: 'grsai' })
    await startGenerationRequest({ tryOnTaskId: 'task-dup', origin: 'CONSUMER', generationType: 'GLASSES', provider: 'grsai' })
    expect(db._requests).toHaveLength(1)
  })

  it('builds a baseline report from DB telemetry rows', async () => {
    const startedAt = new Date(Date.now() - 60_000)
    await startGenerationRequest({
      tryOnTaskId: 'report-1',
      origin: 'CONSUMER',
      generationType: 'GLASSES',
      provider: 'grsai',
      startedAt,
    })
    await startGenerationAttempt({ tryOnTaskId: 'report-1', provider: 'grsai' })
    await recordUsableGenerationSuccess('report-1')

    const report = await queryGenerationReliabilityReport({ period: '24h' })
    expect(report.requests).toBe(1)
    expect(report.finalSuccess).toBe(1)
    expect(report.firstAttemptSuccess).toBe(1)
    expect(report.p50).not.toBeNull()
  })
})

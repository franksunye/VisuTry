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
} from '@/lib/generation/telemetry'
import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'

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

/** @jest-environment node */

import { classifyFailureStage, classifyGenerationError, normalizeGenerationErrorMessage } from '@/lib/generation/error-taxonomy'
import {
  buildGenerationReliabilityReport,
  percentileCont,
  resolveReliabilityPeriod,
} from '@/lib/generation/reliability-report'
import type { ReliabilityRequestRow } from '@/lib/generation/reliability-report'

describe('generation error taxonomy', () => {
  it('normalizes sensitive payloads out of error text', () => {
    expect(
      normalizeGenerationErrorMessage('failed https://file.grsai.com/abc data:image/png;base64,AAAA'),
    ).toBe('failed [url] [image]')
  })

  it('classifies timeout, network, input, and reject failures', () => {
    expect(classifyGenerationError('google gemini timeout...').errorCode).toBe('PROVIDER_TIMEOUT')
    expect(classifyGenerationError('google gemini timeout...').isTimeout).toBe(true)
    expect(classifyGenerationError('Network error').errorCode).toBe('NETWORK_ERROR')
    expect(classifyGenerationError('The image format is incorrect').errorCode).toBe('INVALID_INPUT')
    expect(classifyGenerationError('No Task ID received from GrsAi', { source: 'submit' }).errorCode).toBe('PROVIDER_REJECTED')
    expect(classifyGenerationError('Failed to upload images', { source: 'upload' }).errorCode).toBe('UPLOAD_OR_ASSET_ERROR')
    expect(classifyGenerationError('safety filter blocked').errorCode).toBe('CONTENT_POLICY')
    expect(classifyGenerationError('interrupted before external task ID', { source: 'internal' }).errorCode).toBe('INTERNAL_ERROR')
  })

  it('separates submit timeout from provider-processing timeout and stale dispatch', () => {
    expect(classifyFailureStage({ source: 'submit', error: 'aborted due to timeout', isTimeout: true })).toBe('SUBMIT')
    expect(classifyFailureStage({ source: 'poll', error: 'google gemini timeout...', isTimeout: true })).toBe('PROVIDER_PROCESSING')
    expect(classifyFailureStage({ source: 'poll', error: 'Network error' })).toBe('POLL_NETWORK')
    expect(classifyFailureStage({
      source: 'internal',
      error: 'Provider submission was interrupted before an external task ID was saved. Please retry.',
    })).toBe('STALE_DISPATCH')
    expect(classifyFailureStage({ source: 'upload' })).toBe('ASSET_UPLOAD')
    expect(classifyFailureStage({ source: 'internal', error: 'claim failed' })).toBe('INTERNAL')
  })
})

describe('reliability report metrics', () => {
  const now = new Date('2026-08-28T12:00:00.000Z')

  it('resolves 24h / 7d / 14d and custom ranges', () => {
    expect(resolveReliabilityPeriod({ period: '24h', now }).from.toISOString()).toBe('2026-08-27T12:00:00.000Z')
    expect(resolveReliabilityPeriod({ period: '7d', now }).from.toISOString()).toBe('2026-08-21T12:00:00.000Z')
    expect(resolveReliabilityPeriod({ period: '14d', now }).from.toISOString()).toBe('2026-08-14T12:00:00.000Z')
    const custom = resolveReliabilityPeriod({
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-08T00:00:00.000Z',
    })
    expect(custom.preset).toBe('custom')
    expect(custom.from.toISOString()).toBe('2026-08-01T00:00:00.000Z')
  })

  it('uses PostgreSQL percentile_cont interpolation on completed observations only', () => {
    expect(percentileCont([10, 20, 30, 40], 0.5)).toBe(25)
    expect(percentileCont([10, 20, 30, 40], 0.9)).toBe(37)
    expect(percentileCont([], 0.5)).toBeNull()
  })

  it('separates first-attempt success, final success, retry recovery, and origins', () => {
    const rows: ReliabilityRequestRow[] = [
      {
        id: 'r1',
        origin: 'CONSUMER',
        requestedProvider: 'grsai',
        requestedModel: 'nano-banana-fast',
        finalStatus: 'COMPLETED',
        endToEndDurationMs: 1000,
        attemptCount: 1,
        finalErrorCode: null,
        failureStage: null,
        attempts: [{ attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'COMPLETED', isTimeout: false, submitDurationMs: 200, attemptDurationMs: 1000, providerDurationMs: 800, errorCode: null, failureStage: null }],
      },
      {
        id: 'r2',
        origin: 'STORE',
        requestedProvider: 'grsai',
        requestedModel: 'nano-banana-fast',
        finalStatus: 'COMPLETED',
        endToEndDurationMs: 4000,
        attemptCount: 2,
        finalErrorCode: null,
        failureStage: null,
        attempts: [
          { attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'TIMEOUT', isTimeout: true, submitDurationMs: 100, attemptDurationMs: 180000, providerDurationMs: 180000, errorCode: 'PROVIDER_TIMEOUT', failureStage: 'PROVIDER_PROCESSING' },
          { attemptNumber: 2, provider: 'grsai', model: 'nano-banana-fast', status: 'COMPLETED', isTimeout: false, submitDurationMs: 90, attemptDurationMs: 990, providerDurationMs: 900, errorCode: null, failureStage: null },
        ],
      },
      {
        id: 'r3',
        origin: 'CAMPAIGN',
        requestedProvider: 'grsai',
        requestedModel: 'nano-banana-fast',
        finalStatus: 'FAILED',
        endToEndDurationMs: 200000,
        attemptCount: 1,
        finalErrorCode: 'PROVIDER_FAILED',
        failureStage: 'PROVIDER_PROCESSING',
        attempts: [{ attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'FAILED', isTimeout: false, submitDurationMs: 80, attemptDurationMs: 199000, providerDurationMs: 199000, errorCode: 'PROVIDER_FAILED', failureStage: 'PROVIDER_PROCESSING' }],
      },
      {
        id: 'r4-inflight',
        origin: 'CONSUMER',
        requestedProvider: 'grsai',
        requestedModel: 'nano-banana-fast',
        finalStatus: 'STARTED',
        endToEndDurationMs: 999999,
        attemptCount: 1,
        finalErrorCode: null,
        failureStage: null,
        attempts: [{ attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'STARTED', isTimeout: false, submitDurationMs: null, attemptDurationMs: null, providerDurationMs: 777777, errorCode: null, failureStage: null }],
      },
    ]

    const report = buildGenerationReliabilityReport(
      rows,
      { preset: '7d', from: new Date('2026-08-21T00:00:00.000Z'), to: now },
    )

    expect(report.requests).toBe(4)
    expect(report.attempts).toBe(5)
    expect(report.inFlight).toBe(1)
    expect(report.terminalRequests).toBe(3)
    expect(report.firstAttemptSuccess).toBe(0.3333)
    expect(report.finalSuccess).toBe(0.6667)
    expect(report.failure).toBe(0.3333)
    expect(report.timeout).toBe(0.3333)
    expect(report.retryRate).toBe(0.3333)
    expect(report.retryRecovery).toBe(1)
    expect(report.p50).toBe(4000)
    expect(report.p50).not.toBe(999999)
    expect(report.attemptP50).toBe(90450)
    expect(report.attemptP50).not.toBe(777777)
    expect(report.submitP50).toBe(95)
    expect(report.breakdowns.origin.map((row) => row.key).sort()).toEqual(['CAMPAIGN', 'CONSUMER', 'STORE'])
    expect(report.breakdowns.error[0].key).toBe('PROVIDER_FAILED')
    expect(report.breakdowns.failureStage[0].key).toBe('PROVIDER_PROCESSING')
    expect(report.latencyFields.requestEndToEnd).toBe('endToEndDurationMs')
    expect(report.latencyFields.providerProcessing).toBe('providerDurationMs')
    expect(report.latencyFields.submitApi).toBe('submitDurationMs')
  })
})

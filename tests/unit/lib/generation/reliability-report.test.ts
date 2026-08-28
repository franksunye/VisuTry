/** @jest-environment node */

import { classifyGenerationError, normalizeGenerationErrorMessage } from '@/lib/generation/error-taxonomy'
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
        attempts: [{ attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'COMPLETED', isTimeout: false, providerDurationMs: 800, errorCode: null }],
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
        attempts: [
          { attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'TIMEOUT', isTimeout: true, providerDurationMs: 180000, errorCode: 'PROVIDER_TIMEOUT' },
          { attemptNumber: 2, provider: 'grsai', model: 'nano-banana-fast', status: 'COMPLETED', isTimeout: false, providerDurationMs: 900, errorCode: null },
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
        attempts: [{ attemptNumber: 1, provider: 'grsai', model: 'nano-banana-fast', status: 'FAILED', isTimeout: false, providerDurationMs: 199000, errorCode: 'PROVIDER_FAILED' }],
      },
    ]

    const report = buildGenerationReliabilityReport(
      rows,
      { preset: '7d', from: new Date('2026-08-21T00:00:00.000Z'), to: now },
    )

    expect(report.requests).toBe(3)
    expect(report.attempts).toBe(4)
    expect(report.firstAttemptSuccess).toBe(0.3333)
    expect(report.finalSuccess).toBe(0.6667)
    expect(report.failure).toBe(0.3333)
    expect(report.timeout).toBe(0.3333)
    expect(report.retryRate).toBe(0.3333)
    expect(report.retryRecovery).toBe(1)
    expect(report.p50).toBe(4000)
    expect(report.breakdowns.origin.map((row) => row.key).sort()).toEqual(['CAMPAIGN', 'CONSUMER', 'STORE'])
    expect(report.breakdowns.error[0].key).toBe('PROVIDER_FAILED')
  })
})

/** @jest-environment node */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'
import { GET } from '@/app/api/admin/generation-reliability/route'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/generation/query-reliability-report', () => ({
  queryGenerationReliabilityReport: jest.fn(),
}))

const admin = requireAdmin as jest.Mock
const query = queryGenerationReliabilityReport as jest.Mock

describe('admin generation reliability route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('returns structured baseline metrics for a selected period', async () => {
    query.mockResolvedValue({
      period: { preset: '7d', from: '2026-08-21T00:00:00.000Z', to: '2026-08-28T00:00:00.000Z' },
      requests: 10,
      attempts: 12,
      firstAttemptSuccess: 0.7,
      finalSuccess: 0.8,
      failure: 0.2,
      timeout: 0.1,
      retryRate: 0.2,
      retryRecovery: 0.5,
      p50: 1000,
      p90: 2000,
      p95: 3000,
      p99: 4000,
      breakdowns: { provider: [], model: [], origin: [], error: [] },
    })

    const response = await GET(
      new NextRequest('http://localhost/api/admin/generation-reliability?period=7d'),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(query).toHaveBeenCalledWith({ period: '7d', from: null, to: null })
    expect(body.data.requests).toBe(10)
    expect(body.data.finalSuccess).toBe(0.8)
  })
})

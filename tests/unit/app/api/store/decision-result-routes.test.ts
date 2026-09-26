/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET as getDecisionResult } from '@/app/api/store/results/[token]/route'
import { GET as getDecisionResultAsset } from '@/app/api/store/results/[token]/try-on/[assetRef]/route'
import { hashSessionCapability } from '@/modules/store/domain/session'

const mockShareFindUnique = jest.fn()
const mockTaskFindMany = jest.fn()
const mockTaskFindFirst = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    decisionResultShare: { findUnique: (...args: unknown[]) => mockShareFindUnique(...args) },
    tryOnTask: {
      findMany: (...args: unknown[]) => mockTaskFindMany(...args),
      findFirst: (...args: unknown[]) => mockTaskFindFirst(...args),
    },
  },
}))

function shareFor(token: string, overrides: Record<string, unknown> = {}) {
  const resultOverrides = overrides.result && typeof overrides.result === 'object'
    ? overrides.result as Record<string, unknown>
    : {}
  return {
    tokenHash: hashSessionCapability(token),
    expiresAt: (overrides.expiresAt as Date | undefined) ?? new Date('2026-09-27T00:00:00.000Z'),
    revokedAt: (overrides.revokedAt as Date | null | undefined) ?? null,
    result: {
      id: 'result-1',
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      expiresAt: new Date('2026-09-27T00:00:00.000Z'),
      payload: {
        journey: { experienceType: 'STORE', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
        faceFit: null,
        recommendation: null,
        selectedFrameIds: [],
        favoriteFrameIds: [],
        tryOnResults: [],
        compare: null,
      },
      merchant: { id: 'merchant-1', slug: 'merchant', name: 'Merchant', status: 'ACTIVE', accentColor: null, websiteUrl: null },
      experience: null,
      ...resultOverrides,
    },
  }
}

describe('Decision Result bearer routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTaskFindMany.mockResolvedValue([])
  })

  it('returns the canonical result for a valid scoped token', async () => {
    const token = 'decision-result-token'
    mockShareFindUnique.mockResolvedValue(shareFor(token))

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.merchant.name).toBe('Merchant')
    expect(mockShareFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { tokenHash: hashSessionCapability(token) } }))
  })

  it.each([
    ['tampered token', 'not-the-issued-token', null],
    ['revoked token', 'decision-result-token', { revokedAt: new Date('2026-09-26T01:00:00.000Z') }],
    ['expired share', 'decision-result-token', { expiresAt: new Date('2026-09-25T00:00:00.000Z') }],
    ['expired result', 'decision-result-token', { result: { ...shareFor('decision-result-token').result, expiresAt: new Date('2026-09-25T00:00:00.000Z') } }],
    ['wrong merchant relation', 'decision-result-token', { result: { ...shareFor('decision-result-token').result, merchant: { ...shareFor('decision-result-token').result.merchant, id: 'merchant-2' } } }],
  ])('fails closed for %s', async (_label, token, override) => {
    mockShareFindUnique.mockResolvedValue(override === null ? null : shareFor(token, override as Record<string, unknown>))

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })

    expect(response.status).toBe(404)
  })

  it('does not authorize a task that is not in the canonical result', async () => {
    const token = 'decision-result-token'
    mockShareFindUnique.mockResolvedValue(shareFor(token))

    const response = await getDecisionResultAsset(new NextRequest('http://localhost/api/store/results/' + token), { params: { token, assetRef: 'not-a-result-asset-ref' } })

    expect(response.status).toBe(404)
    expect(mockTaskFindFirst).not.toHaveBeenCalled()
  })
})

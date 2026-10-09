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
  const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const resultOverrides = overrides.result && typeof overrides.result === 'object'
    ? overrides.result as Record<string, unknown>
    : {}
  return {
    tokenHash: hashSessionCapability(token),
    expiresAt: (overrides.expiresAt as Date | undefined) ?? futureExpiry,
    revokedAt: (overrides.revokedAt as Date | null | undefined) ?? null,
    result: {
      id: 'result-1',
      merchantId: 'merchant-1',
      merchantSessionId: 'session-1',
      expiresAt: futureExpiry,
      payload: {
        journey: { experienceType: 'STORE', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
        faceFit: null,
        recommendation: null,
        selectedFrameIds: [],
        favoriteFrameIds: [],
        tryOnResults: [],
        compare: null,
      },
      merchant: { id: 'merchant-1', slug: 'merchant', name: 'Merchant', status: 'ACTIVE', logoUrl: 'https://cdn.example.test/merchant.png', accentColor: null, websiteUrl: null, referenceData: false, classification: 'UNKNOWN', pilotType: 'LIVE', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', commercialExceptionCode: null },
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
    expect(payload.data.merchant.referenceData).toBe(false)
    expect(payload.data.merchant.logoUrl).toBe('https://cdn.example.test/merchant.png')
    expect(payload.data.merchant).not.toHaveProperty('classification')
    expect(payload.data.merchant).not.toHaveProperty('planCode')
    expect(mockShareFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { tokenHash: hashSessionCapability(token) } }))
  })

  it.each(['javascript:alert(1)', '//tracker.example.test/logo.png', '/api/private/logo', '/\\tracker.example.test/logo.png'])('omits an unsafe merchant logo URL: %s', async (logoUrl) => {
    const token = 'decision-result-token'
    mockShareFindUnique.mockResolvedValue(shareFor(token, {
      result: {
        ...shareFor(token).result,
        merchant: { ...shareFor(token).result.merchant, logoUrl },
      },
    }))

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.data.merchant.logoUrl).toBeNull()
  })

  it('renders the same typed Handoff on the canonical Result and ignores unsafe legacy CTA data', async () => {
    const token = 'decision-result-token'
    mockShareFindUnique.mockResolvedValue(shareFor(token, {
      result: {
        ...shareFor(token).result,
        experience: {
          id: 'experience-1', type: 'STORE', slug: 'main-store', name: 'Main Store',
          primaryCtaType: 'PRODUCT_OR_COLLECTION', primaryCtaLabel: 'Browse frames', primaryCtaUrl: 'https://merchant.example/products',
          secondaryCtaType: 'UNBOUNDED_SCRIPT', secondaryCtaLabel: 'Unsafe', secondaryCtaUrl: 'javascript:alert(1)',
          deliveryPolicy: null,
        },
      },
    }))

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })
    const payload = await response.json()
    expect(payload.data.experience.primaryCta).toEqual({ action: 'PRODUCT', label: 'Browse frames', url: 'https://merchant.example/products' })
    expect(payload.data.experience.secondaryCta).toBeNull()
  })

  it('labels the guarded deterministic Local E2E image as a QA fixture, not a shopper Try-On', async () => {
    const token = 'decision-result-token'
    const share = shareFor(token)
    share.result.payload = {
      ...share.result.payload as Record<string, unknown>,
      journey: { experienceType: 'STORE', enabledStages: ['RECOMMENDATION', 'TRY_ON'] },
      tryOnResults: [{ source: 'LIVE_TRYON', taskId: 'test-task', frameId: 'frame-1', status: 'COMPLETED', completedAt: new Date().toISOString() }],
    }
    mockShareFindUnique.mockResolvedValue(share)
    mockTaskFindMany.mockResolvedValue([{
      id: 'test-task',
      merchantFrameId: 'frame-1',
      resultImageUrl: 'blob://local/test.png',
      expiresAt: new Date(Date.now() + 60_000),
      metadata: { localDecisionResultE2EFixture: true },
      merchantFrame: { name: 'Test frame', sku: 'TEST-1', productUrl: null },
    }])

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.data.tryOnResults[0]).toMatchObject({ disclosure: 'LOCAL_QA_FIXTURE', name: 'Test frame' })
    expect(payload.data.tryOnResults[0]).not.toHaveProperty('metadata')
  })

  it('fails closed when a previously issued Result belongs to a Merchant without Decision Result entitlement', async () => {
    const token = 'decision-result-token'
    mockShareFindUnique.mockResolvedValue(shareFor(token, {
      result: {
        ...shareFor(token).result,
        merchant: {
          ...shareFor(token).result.merchant,
          planCode: 'FREE',
          commercialStatus: 'FREE',
          commercialExceptionCode: null,
        },
      },
    }))

    const response = await getDecisionResult(new NextRequest('http://localhost/api/store/results/' + token), { params: { token } })

    expect(response.status).toBe(404)
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

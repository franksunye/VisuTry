/** @jest-environment node */

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))

const mockRuntime = {
  merchants: { findBySlug: jest.fn() },
  frames: {},
  sessions: {},
  experiences: {},
  decisionResults: {},
  assets: {},
  events: {},
  usage: {},
  sponsoredUsage: {},
  generation: {},
}
const mockResolveMode = jest.fn()
const mockPresentPrepared = jest.fn()
const mockSubmitLive = jest.fn()

jest.mock('@/modules/store/application', () => ({
  createStoreRuntime: () => mockRuntime,
  createDecisionResultAssetRef: (token: string, reference: unknown) => {
    void token
    void reference
    return 'private-asset-ref'
  },
  presentPreparedDemoResult: (...args: unknown[]) => mockPresentPrepared(...args),
  resolveStoreTryOnExecutionMode: (...args: unknown[]) => mockResolveMode(...args),
  storeErrorResponse: jest.fn((error: Error) => Response.json({ error: error.message }, { status: 500 })),
  submitStoreFrameTryOn: (...args: unknown[]) => mockSubmitLive(...args),
  clientIpFromRequest: jest.fn(() => null),
}))

jest.mock('@/modules/store/infrastructure', () => ({
  readStoreCapabilityToken: jest.fn(() => 'session-capability'),
}))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { POST } from '@/app/api/store/sessions/try-on/route'

const session = getServerSession as jest.Mock

function request(overrides: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/store/sessions/try-on', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      merchantSlug: 'visutry-demo-optical',
      merchantSessionId: 'session-1',
      merchantFrameId: 'frame-rowan',
      batchId: 'batch-1',
      clientSubmissionId: 'submit-1',
      decisionResultToken: 'private-result-token',
      ...overrides,
    }),
  })
}

describe('Store Try-On execution mode route boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    session.mockResolvedValue(null)
    mockRuntime.merchants.findBySlug.mockResolvedValue({ id: 'canonical-demo', slug: 'visutry-demo-optical' })
    mockResolveMode.mockReturnValue('PREPARED_DEMO')
    mockPresentPrepared.mockResolvedValue({
      source: 'PREPARED_DEMO',
      sourceRef: { assetKey: 'rowan' },
      merchantFrameId: 'frame-rowan',
      presentedAt: '2026-09-30T00:00:00.000Z',
      disclosure: 'LOCAL_QA_FIXTURE',
      frame: { id: 'frame-rowan', name: 'VT Rowan' },
    })
    mockSubmitLive.mockResolvedValue({ taskId: 'live-task' })
  })

  it('routes canonical prepared mode through the shared prepared-result application service only', async () => {
    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockResolveMode).toHaveBeenCalledWith(expect.objectContaining({ slug: 'visutry-demo-optical' }))
    expect(mockPresentPrepared).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'visutry-demo-optical',
      merchantSessionId: 'session-1',
      shareToken: 'private-result-token',
      merchantFrameId: 'frame-rowan',
    }))
    expect(payload.data).toMatchObject({
      source: 'PREPARED_DEMO',
      status: 'prepared',
      taskId: null,
      imageUrl: '/api/store/results/private-result-token/try-on/private-asset-ref',
    })
    expect(mockSubmitLive).not.toHaveBeenCalled()
  })

  it('fails closed when prepared mode has no existing private Decision Result token', async () => {
    const response = await POST(request({ decisionResultToken: undefined }))

    expect(response.status).toBe(409)
    expect(mockPresentPrepared).not.toHaveBeenCalled()
    expect(mockSubmitLive).not.toHaveBeenCalled()
  })

  it('keeps ordinary/live execution on the existing Try-On application path', async () => {
    mockResolveMode.mockReturnValue('LIVE_TRYON')
    const response = await POST(request({ decisionResultToken: undefined }))

    expect(response.status).toBe(200)
    expect(mockSubmitLive).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'visutry-demo-optical',
      merchantFrameId: 'frame-rowan',
    }))
    expect(mockPresentPrepared).not.toHaveBeenCalled()
  })
})

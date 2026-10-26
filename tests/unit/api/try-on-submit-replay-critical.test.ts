/** @jest-environment node */

import type { NextRequest } from 'next/server'
import { POST } from '@/app/api/try-on/submit/route'

const mockRequireAuthWithUser = jest.fn()
const mockCheckUserQuota = jest.fn()
const mockFindTask = jest.fn()
const mockSubmitTryOnTask = jest.fn()
const mockSettleQuota = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAuthWithUser: (...args: unknown[]) => mockRequireAuthWithUser(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { findUnique: (...args: unknown[]) => mockFindTask(...args) },
  },
}))

jest.mock('@/lib/logger', () => ({
  getRequestContext: () => ({ requestId: 'consumer-replay-test' }),
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/quota', () => ({
  checkUserQuota: (...args: unknown[]) => mockCheckUserQuota(...args),
  settleTryOnTaskQuota: (...args: unknown[]) => mockSettleQuota(...args),
}))

jest.mock('@/lib/tryon-service', () => ({
  submitTryOnTask: (...args: unknown[]) => mockSubmitTryOnTask(...args),
}))

jest.mock('@/lib/tryon-media', () => ({
  tryOnMediaPath: (id: string) => `/api/try-on/${id}/media/result`,
}))

const user = { id: 'user-1', isPremium: false, premiumExpiresAt: null }

function makeRequest(submissionId?: string) {
  const body = new FormData()
  body.set('userImage', new File(['face'], 'face.jpg', { type: 'image/jpeg' }))
  body.set('itemImage', new File(['frame'], 'frame.jpg', { type: 'image/jpeg' }))
  body.set('type', 'GLASSES')
  if (submissionId) body.set('clientSubmissionId', submissionId)
  return { formData: jest.fn().mockResolvedValue(body) } as unknown as NextRequest
}

describe('Consumer Try-On submit replay and quota', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuthWithUser.mockResolvedValue({ ok: true, user, userId: user.id })
    mockCheckUserQuota.mockReturnValue({ allowed: false, reason: 'No remaining quota' })
    mockFindTask.mockResolvedValue(null)
    mockSubmitTryOnTask.mockResolvedValue({
      taskId: 'existing-task',
      status: 'submitted',
      serviceType: 'grsai',
      isAsync: true,
    })
    mockSettleQuota.mockResolvedValue(undefined)
  })

  it('allows same-user, same-key replay after quota is exhausted', async () => {
    mockFindTask.mockResolvedValue({ id: 'existing-task', type: 'GLASSES' })

    const response = await POST(makeRequest('existing-key'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.taskId).toBe('existing-task')
    expect(mockFindTask).toHaveBeenCalledWith({
      where: { userId_clientSubmissionId: { userId: user.id, clientSubmissionId: 'existing-key' } },
      select: { id: true, type: true },
    })
    expect(mockSubmitTryOnTask).toHaveBeenCalledTimes(1)
    expect(mockSettleQuota).not.toHaveBeenCalled()
  })

  it('does not launch a new task when quota is exhausted', async () => {
    const response = await POST(makeRequest('new-key'))

    expect(response.status).toBe(403)
    expect(mockSubmitTryOnTask).not.toHaveBeenCalled()
    expect(mockSettleQuota).not.toHaveBeenCalled()
  })

  it('rejects an ID belonging to a different Try-On type', async () => {
    mockFindTask.mockResolvedValue({ id: 'prior-task', type: 'SUNGLASSES' })

    const response = await POST(makeRequest('wrong-type'))
    expect(response.status).toBe(409)
    expect(mockSubmitTryOnTask).not.toHaveBeenCalled()
  })

  it('rejects an exhausted-quota request without any replay key', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(403)
    expect(mockFindTask).not.toHaveBeenCalled()
    expect(mockSubmitTryOnTask).not.toHaveBeenCalled()
  })
})

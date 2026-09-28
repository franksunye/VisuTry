import { prisma } from '@/lib/prisma'
import { MockBlob } from '@/lib/mocks/blob'
import { createMerchantSessionCapability } from '@/modules/store/domain'
import { resolveStoreTryOnResult } from '@/modules/store/application/resolve-store-tryon-result'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: { tryOnTask: { findFirst: jest.fn() } },
}))

describe('Local Store Try-On result resolution', () => {
  const uploaded: string[] = []

  afterEach(async () => {
    if (uploaded.length) await MockBlob.del(uploaded.splice(0))
    jest.clearAllMocks()
  })

  it('resolves the persisted Local result bytes instead of fetching the mock provider URL', async () => {
    const key = `tryon/result/store/test/${Date.now()}.png`
    const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=', 'base64')
    const blob = await MockBlob.put(key, bytes, { contentType: 'image/png' })
    uploaded.push(blob.url)
    const capability = createMerchantSessionCapability()
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue({
      id: 'task-local-1',
      resultImageUrl: blob.url,
      metadata: { resultPathname: key, resultAssetAccessMode: 'PUBLIC_TEMPORARY' },
      merchantFrameId: 'frame-1',
      expiresAt: null,
      retentionStatus: 'ACTIVE',
    })
    const merchants = { findBySlug: jest.fn().mockResolvedValue({ id: 'merchant-1', status: 'ACTIVE' }) } as never
    const sessions = {
      findByMerchantAndId: jest.fn().mockResolvedValue({
        id: 'session-1',
        merchantId: 'merchant-1',
        capabilityTokenHash: capability.tokenHash,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60_000),
        experienceId: null,
      }),
      markExpired: jest.fn(),
    } as never

    const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch')
    const fetchSpy = jest.fn()
    Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    try {
      const result = await resolveStoreTryOnResult({
        merchants,
        sessions,
        slug: 'visutry-demo-optical',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        taskId: 'task-local-1',
      })

      expect(result).toMatchObject({ taskId: 'task-local-1', contentType: 'image/png', body: bytes })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch)
      else delete (global as { fetch?: typeof fetch }).fetch
    }
  })
})

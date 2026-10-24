import { persistStoreGrsaiSucceededResult } from '@/modules/store/infrastructure/generation/persist-store-grsai-result'
import { prisma } from '@/lib/prisma'
import { mockBlobUpload } from '@/lib/mocks/blob'
import { recordUsableGenerationSuccess } from '@/lib/generation/telemetry'

jest.mock('@/lib/prisma', () => ({
  prisma: { tryOnTask: { updateMany: jest.fn(), findUnique: jest.fn() } },
}))
jest.mock('@vercel/blob', () => ({ head: jest.fn(), put: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: true }))
jest.mock('@/lib/mocks/blob', () => ({ mockBlobUpload: jest.fn() }))
jest.mock('@/lib/generation/telemetry', () => ({
  recordUsableGenerationSuccess: jest.fn(),
}))
jest.mock('@/modules/store/infrastructure/config/store-asset-access-policy', () => ({
  resolveStoreAssetAccessPolicy: jest.fn(() => ({
    assetAccessMode: 'PRIVATE_SIGNED', blobAccess: 'private', publicPoc: false,
  })),
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('Store Kie image persistence uses shared safety boundary (offline)', () => {
  const fetchOriginal = global.fetch
  const baseInput = {
    taskId: 'synthetic-task',
    merchantId: 'synthetic-merchant',
    origin: 'STORE_PILOT',
    userId: null,
    pollImageUrl: 'https://tempfile.aiquickdraw.com/synthetic-image',
    pollProgress: 100,
    pollMetadata: {},
    externalPollMetadata: { serviceType: 'kie', externalTaskId: 'kie-synthetic' },
    latestBeforePersist: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.tryOnTask.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(mockBlobUpload).mockImplementation(async (path) => ({
      pathname: path, url: `mock://${path}`,
    } as never))
  })

  afterEach(() => { global.fetch = fetchOriginal })

  it.each([
    ['image/jpeg', 'jpg', [255, 216, 255, 217]],
    ['image/png', 'png', [137, 80, 78, 71]],
    ['image/webp', 'webp', [82, 73, 70, 70]],
  ])('stores Kie %s as a private %s result pathname', async (mime, ext, data) => {
    global.fetch = jest.fn().mockResolvedValue(new Response(new Uint8Array(data), {
      headers: { 'content-type': mime },
    }))
    const result = await persistStoreGrsaiSucceededResult(baseInput as never)
    expect(result).toMatchObject({ status: 'COMPLETED', isNewCompletion: true })
    const uploaded = jest.mocked(mockBlobUpload).mock.calls[0]
    expect(uploaded[0]).toBe(`tryon/result/store/synthetic-merchant/synthetic-task.${ext}`)
    expect(uploaded[1].type).toBe(mime)
    expect(jest.mocked(global.fetch)).toHaveBeenCalledWith(
      baseInput.pollImageUrl,
      { redirect: 'error', cache: 'no-store' },
    )
    expect(recordUsableGenerationSuccess).toHaveBeenCalledWith('synthetic-task')
  })

  it('does not persist an invalid Kie output or settle quota', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response('{}', { headers: { 'content-type': 'text/html' } }),
    )
    jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
      status: 'PROCESSING', resultImageUrl: null,
    } as never)
    const result = await persistStoreGrsaiSucceededResult(baseInput as never)
    expect(result.status).toBe('PROCESSING')
    expect(mockBlobUpload).not.toHaveBeenCalled()
    expect(recordUsableGenerationSuccess).not.toHaveBeenCalled()
  })
})

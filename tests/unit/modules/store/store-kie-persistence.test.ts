import { persistStoreGrsaiSucceededResult } from '@/modules/store/infrastructure/generation/persist-store-grsai-result'
import { prisma } from '@/lib/prisma'
import { mockBlobUpload } from '@/lib/mocks/blob'
import { recordUsableGenerationSuccess } from '@/lib/generation/telemetry'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { mockKieStreamResponse } from '../../../support/kie-stream-response'

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
    assetAccessMode: 'PUBLIC_TEMPORARY', blobAccess: 'public', publicPoc: true,
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
  ])('stores Kie %s as an existing-policy public-poc %s result pathname', async (mime, ext, data) => {
    global.fetch = jest.fn().mockResolvedValue(mockKieStreamResponse(mime, data))
    const result = await persistStoreGrsaiSucceededResult(baseInput as never)
    expect(result).toMatchObject({ status: 'COMPLETED', isNewCompletion: true })
    const uploaded = jest.mocked(mockBlobUpload).mock.calls[0]
    expect(uploaded[0]).toBe(`tryon/result/store/synthetic-merchant/synthetic-task.${ext}`)
    expect(uploaded[1].type).toBe(mime)
    expect(jest.mocked(global.fetch)).toHaveBeenCalledWith(
      baseInput.pollImageUrl,
      { redirect: 'error', cache: 'no-store' },
    )
    expect(jest.mocked(prisma.tryOnTask.updateMany).mock.calls).toContainEqual([
      expect.objectContaining({ data: expect.objectContaining({
        metadata: expect.objectContaining({ privateBlob: false, resultAssetAccessMode: 'PUBLIC_TEMPORARY' }),
      }) }),
    ])
    expect(recordUsableGenerationSuccess).toHaveBeenCalledWith('synthetic-task')
  })

  it('persists to private Store policy when already configured private', async () => {
    jest.mocked(resolveStoreAssetAccessPolicy).mockReturnValueOnce({
      assetAccessMode: 'PRIVATE_SIGNED', blobAccess: 'private', publicPoc: false,
    })
    global.fetch = jest.fn().mockResolvedValue(mockKieStreamResponse('image/jpeg', [255, 216, 255, 217]))
    await expect(persistStoreGrsaiSucceededResult(baseInput as never)).resolves.toMatchObject({
      status: 'COMPLETED', isNewCompletion: true,
    })
    expect(jest.mocked(prisma.tryOnTask.updateMany).mock.calls).toContainEqual([
      expect.objectContaining({ data: expect.objectContaining({
        metadata: expect.objectContaining({ privateBlob: true, resultAssetAccessMode: 'PRIVATE_SIGNED' }),
      }) }),
    ])
  })

  it('does not persist an invalid Kie output or settle quota', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockKieStreamResponse('text/html', [123, 125]))
    jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
      status: 'PROCESSING', resultImageUrl: null,
    } as never)
    const result = await persistStoreGrsaiSucceededResult(baseInput as never)
    expect(result.status).toBe('PROCESSING')
    expect(mockBlobUpload).not.toHaveBeenCalled()
    expect(recordUsableGenerationSuccess).not.toHaveBeenCalled()
  })
})

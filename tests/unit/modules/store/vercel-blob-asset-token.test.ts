/** @jest-environment node */

jest.mock('@vercel/blob', () => ({
  del: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    storeAsset: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/mocks/blob', () => ({
  MockBlob: { del: jest.fn() },
  mockBlobUpload: jest.fn(),
  readMockBlob: jest.fn(),
}))

import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { createVercelBlobAssetStore } from '@/modules/store/infrastructure/assets/vercel-blob-asset-store'

const delMock = del as jest.Mock
const findFirstMock = prisma.storeAsset.findFirst as jest.Mock
const updateManyMock = prisma.storeAsset.updateMany as jest.Mock
const originalPrivate = process.env.RPIVATE_BLOB_READ_WRITE_TOKEN

beforeEach(() => {
  process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'private-token'
  delMock.mockReset().mockResolvedValue(undefined)
  findFirstMock.mockReset()
  updateManyMock.mockReset().mockResolvedValue({ count: 1 })
})
afterAll(() => {
  if (originalPrivate === undefined) delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
  else process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = originalPrivate
})

it('deletes PRIVATE_SIGNED StoreAsset using the private store credential', async () => {
  findFirstMock.mockResolvedValue({
    id: 'asset-1',
    merchantId: 'merchant-1',
    storageKey: 'store/private/photo.jpg',
    providerUrl: 'https://private-store.private.blob.vercel-storage.com/photo.jpg',
    accessMode: 'PRIVATE_SIGNED',
    retentionStatus: 'ACTIVE',
    deletedAt: null,
    deleteFailCount: 0,
  })
  expect(await createVercelBlobAssetStore().delete('asset-1', 'merchant-1'))
    .toEqual({ deleted: true, retryable: false })
  expect(delMock).toHaveBeenCalledWith('store/private/photo.jpg', { token: 'private-token' })
})

it('leaves a private asset retryable when its credential is missing', async () => {
  delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
  findFirstMock.mockResolvedValue({
    id: 'asset-2',
    merchantId: 'merchant-1',
    storageKey: 'store/private/photo-2.jpg',
    providerUrl: 'https://private-store.private.blob.vercel-storage.com/photo-2.jpg',
    accessMode: 'PRIVATE_SIGNED',
    retentionStatus: 'ACTIVE',
    deletedAt: null,
    deleteFailCount: 0,
  })
  const result = await createVercelBlobAssetStore().delete('asset-2', 'merchant-1')
  expect(result.deleted).toBe(false)
  expect(result.retryable).toBe(true)
  expect(delMock).not.toHaveBeenCalled()
})

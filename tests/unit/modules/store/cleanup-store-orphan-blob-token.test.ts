/** @jest-environment node */

jest.mock('@vercel/blob', () => ({ del: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    storeOrphanBlob: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))

import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { cleanupStoreOrphanBlobs } from '@/modules/store/application/cleanup-store-orphan-blobs'

const delMock = del as jest.Mock
const findManyMock = prisma.storeOrphanBlob.findMany as jest.Mock
const updateMock = prisma.storeOrphanBlob.update as jest.Mock
const originalPublic = process.env.BLOB_READ_WRITE_TOKEN
const originalPrivate = process.env.RPIVATE_BLOB_READ_WRITE_TOKEN

beforeEach(() => {
  delMock.mockReset()
  findManyMock.mockReset()
  updateMock.mockReset()
  process.env.BLOB_READ_WRITE_TOKEN = 'public-token'
  process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'private-token'
  updateMock.mockResolvedValue({})
})
afterAll(() => {
  if (originalPublic === undefined) delete process.env.BLOB_READ_WRITE_TOKEN
  else process.env.BLOB_READ_WRITE_TOKEN = originalPublic
  if (originalPrivate === undefined) delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
  else process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = originalPrivate
})

const row = (url: string) => ({
  id: 'orphan-1',
  url,
  pathname: 'store/test/photo.jpg',
  failCount: 0,
})

it.each([
  ['private', 'https://demo.private.blob.vercel-storage.com/photo.jpg', 'private-token'],
  ['public', 'https://demo.public.blob.vercel-storage.com/photo.jpg', 'public-token'],
])('uses the correct %s credential for a recorded orphan', async (_type, url, token) => {
  findManyMock.mockResolvedValue([row(url)])
  const result = await cleanupStoreOrphanBlobs()
  expect(result).toEqual({ scanned: 1, deleted: 1, failed: 0 })
  expect(delMock).toHaveBeenCalledWith('store/test/photo.jpg', { token })
})

it('refuses unknown hosts and leaves the row retryable', async () => {
  findManyMock.mockResolvedValue([row('https://untrusted.example.com/photo.jpg')])
  const result = await cleanupStoreOrphanBlobs()
  expect(result).toEqual({ scanned: 1, deleted: 0, failed: 1 })
  expect(delMock).not.toHaveBeenCalled()
  expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ failCount: 1 }),
  }))
})

/** @jest-environment node */

jest.mock('@vercel/blob', () => ({ list: jest.fn() }))

import { list } from '@vercel/blob'
import { getBlobStoreConfigs, scanBlobStore, summarizeBlobStore } from '@/lib/blob/admin-inventory'

const listMock = list as jest.Mock
const blob = (pathname: string, size = 2048) => ({
  pathname,
  url: `https://public.example.test/${pathname}`,
  downloadUrl: `https://public.example.test/${pathname}`,
  size,
  uploadedAt: new Date('2026-10-01T00:00:00Z'),
})

beforeEach(() => listMock.mockReset())

it('keeps public/private credentials separate and never includes QA by accident', () => {
  const stores = getBlobStoreConfigs({
    BLOB_READ_WRITE_TOKEN: 'public-token',
    RPIVATE_BLOB_READ_WRITE_TOKEN: 'private-token',
    G2_QA_BLOB_READ_WRITE_TOKEN: 'qa-token',
  })
  expect(stores).toEqual([
    expect.objectContaining({ scope: 'public', token: 'public-token' }),
    expect.objectContaining({ scope: 'private', token: 'private-token' }),
  ])
  expect(stores).toHaveLength(2)
})

it('fails closed instead of double-counting an identical credential', () => {
  const stores = getBlobStoreConfigs({
    BLOB_READ_WRITE_TOKEN: 'shared',
    RPIVATE_BLOB_READ_WRITE_TOKEN: 'shared',
  })
  expect(stores[1].token).toBeNull()
  expect(stores[1].unavailableReason).toMatch(/boundary/)
})

it('reads all SDK cursor pages with the selected store token', async () => {
  listMock
    .mockResolvedValueOnce({ blobs: [blob('a.png')], hasMore: true, cursor: 'next' })
    .mockResolvedValueOnce({ blobs: [blob('b.png', 1024)], hasMore: false })
  const config = getBlobStoreConfigs({
    BLOB_READ_WRITE_TOKEN: 'public-token',
  })[0]
  const inventory = await scanBlobStore(config)
  expect(inventory.complete).toBe(true)
  expect(inventory.blobs.map(item => item.pathname)).toEqual(['a.png', 'b.png'])
  expect(listMock).toHaveBeenNthCalledWith(1, { token: 'public-token', cursor: undefined, limit: 1000 })
  expect(listMock).toHaveBeenNthCalledWith(2, { token: 'public-token', cursor: 'next', limit: 1000 })
  expect(summarizeBlobStore(config, inventory)).toEqual(expect.objectContaining({
    totalFiles: 2,
    totalSize: 3072,
    complete: true,
  }))
})

it('rejects invalid cursor and missing token rather than claiming a complete inventory', async () => {
  listMock.mockResolvedValueOnce({ blobs: [blob('a.png')], hasMore: true })
  await expect(scanBlobStore(getBlobStoreConfigs({ BLOB_READ_WRITE_TOKEN: 'abc' })[0]))
    .rejects.toThrow('cursor missing')
  await expect(scanBlobStore(getBlobStoreConfigs({})[0])).rejects.toThrow('not configured')
})

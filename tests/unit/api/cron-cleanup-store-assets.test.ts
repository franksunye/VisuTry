/** @jest-environment node */

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('@/lib/function-observability', () => ({
  withFunctionObservation: (_route: unknown, _actor: unknown, handler: unknown) => handler,
}))
jest.mock('@/modules/store/application', () => ({
  createStoreRuntime: jest.fn(() => ({ assets: {} })),
  cleanupExpiredStoreAssets: jest.fn(),
  cleanupStoreOrphanBlobs: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { cleanupExpiredStoreAssets, cleanupStoreOrphanBlobs } from '@/modules/store/application'
import { GET } from '@/app/api/cron/cleanup-store-assets/route'

const assets = cleanupExpiredStoreAssets as jest.Mock
const orphans = cleanupStoreOrphanBlobs as jest.Mock
const originalSecret = process.env.CRON_SECRET
const url = 'https://www.visutry.com/api/cron/cleanup-store-assets'

afterAll(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = originalSecret
})
beforeEach(() => {
  assets.mockReset()
  orphans.mockReset()
  process.env.CRON_SECRET = 'cron-test-secret'
  orphans.mockResolvedValue({ scanned: 0, deleted: 0, failed: 0 })
})

it('rejects an unset secret, even when caller sends Bearer undefined', async () => {
  delete process.env.CRON_SECRET
  const response = await GET(new NextRequest(url, {
    headers: { authorization: 'Bearer undefined' },
  }))
  expect(response.status).toBe(401)
  expect(assets).not.toHaveBeenCalled()
})

it('reports partial cleanup failure with non-2xx, without changing retention semantics', async () => {
  assets.mockResolvedValue({ scanned: 1, deleted: 0, failed: 1, blockedScanned: 0 })
  const response = await GET(new NextRequest(url, {
    headers: { authorization: 'Bearer cron-test-secret' },
  }))
  expect(response.status).toBe(500)
  expect((await response.json()).success).toBe(false)
})

it('reports an empty successful run as 200', async () => {
  assets.mockResolvedValue({ scanned: 0, deleted: 0, failed: 0, blockedScanned: 0 })
  const response = await GET(new NextRequest(url, {
    headers: { authorization: 'Bearer cron-test-secret' },
  }))
  expect(response.status).toBe(200)
  expect((await response.json()).success).toBe(true)
})

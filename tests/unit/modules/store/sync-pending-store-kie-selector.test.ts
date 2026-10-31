/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: { tryOnTask: { findMany: jest.fn() } },
}))
jest.mock('@/lib/tryon-service', () => ({ getTryOnResult: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('@/modules/store/infrastructure', () => ({ createPrismaStoreUsageRepository: jest.fn() }))
jest.mock('@/modules/store/application/settle-store-usage', () => ({ settleStoreTryOnUsage: jest.fn() }))
jest.mock('@/modules/store/application/reconcile-stale-store-claims', () => ({
  reconcileStaleStoreClaims: jest.fn(),
}))
jest.mock('@/modules/store/infrastructure/generation/ensure-store-tryon-persist-registered', () => ({
  ensureStoreTryOnPersistRegistered: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { reconcileStaleStoreClaims } from '@/modules/store/application/reconcile-stale-store-claims'
import { syncPendingStoreTryOnTasks } from '@/modules/store/infrastructure/cron/sync-pending-store-tasks'

it('includes both GrsAi and Kie tasks without crossing the Store origin boundary', async () => {
  ;(reconcileStaleStoreClaims as jest.Mock).mockResolvedValue({ scanned: 0, markedFailed: 0 })
  ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([])
  const result = await syncPendingStoreTryOnTasks()
  const where = (prisma.tryOnTask.findMany as jest.Mock).mock.calls[0][0].where
  expect(where.origin).toEqual({ in: ['STORE_DEMO', 'STORE_PILOT'] })
  expect(where.OR).toEqual(expect.arrayContaining([
    expect.objectContaining({
      status: 'PROCESSING',
      metadata: { path: ['serviceType'], equals: 'grsai' },
    }),
    expect.objectContaining({
      status: 'PROCESSING',
      metadata: { path: ['serviceType'], equals: 'kie' },
    }),
  ]))
  expect(result).toMatchObject({ scope: 'store', total: 0, errors: 0 })
})

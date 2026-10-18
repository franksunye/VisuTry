jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantFactoryOperation: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  },
}))
import { prisma } from '@/lib/prisma'
import {
  reserveMerchantFactoryOperation, completeMerchantFactoryOperation,
  factoryOperationFingerprint, MerchantFactoryOperationConflict,
} from '@/modules/merchant/application/merchant-factory-operation-ledger'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner-a', merchantId: 'merchant-a', membershipId: 'membership-a' }
const manifest = {
  version: 1, merchantSlug: 'merchant-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Merchant A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
const input = {
  actor, operationId: '123e4567-e89b-42d3-a456-426614174000',
  action: 'CREATE_STORE_DRAFT' as const,
  targetType: 'STORE' as const, targetId: 'store', expectedRevision: 'ABSENT', manifest,
}
const receipt = {
  version: 1, status: 'DRAFT_STORE_CREATED_ONLY',
  resourceId: 'store-a', changedFields: [], publicRender: 'NOT_EXECUTED', releaseReady: false,
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.merchantFactoryOperation.create as jest.Mock).mockResolvedValue({ id: 'op' })
  ;(prisma.merchantFactoryOperation.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
})
it('returns NEW only for an actual unique tenant-scoped reservation', async () => {
  const r = await reserveMerchantFactoryOperation(input)
  expect(r).toMatchObject({ kind: 'NEW', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) })
  expect(prisma.merchantFactoryOperation.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ merchantId: 'merchant-a', operationId: input.operationId, status: 'IN_PROGRESS' }),
  })
})
it('returns durable sanitized receipt on exact completed replay without creating again', async () => {
  ;(prisma.merchantFactoryOperation.create as jest.Mock).mockRejectedValueOnce({ code: 'P2002' })
  ;(prisma.merchantFactoryOperation.findUnique as jest.Mock).mockResolvedValueOnce({
    actorId: actor.actorId, action: input.action, targetType: input.targetType, targetId: input.targetId,
    fingerprint: factoryOperationFingerprint({
      merchantId: actor.merchantId, action: input.action, targetType: input.targetType,
      targetId: input.targetId, expectedRevision: input.expectedRevision, manifest,
    }), status: 'COMPLETED', receipt,
  })
  expect(await reserveMerchantFactoryOperation(input)).toMatchObject({
    kind: 'REPLAY', receipt: { releaseReady: false, status: 'DRAFT_STORE_CREATED_ONLY' },
  })
})
it('blocks pending or changed fingerprint and never re-executes a potentially partial write', async () => {
  const fingerprint = factoryOperationFingerprint({
    merchantId: actor.merchantId, action: input.action, targetType: input.targetType,
    targetId: input.targetId, expectedRevision: input.expectedRevision, manifest,
  })
  ;(prisma.merchantFactoryOperation.create as jest.Mock).mockRejectedValue({ code: 'P2002' })
  ;(prisma.merchantFactoryOperation.findUnique as jest.Mock).mockResolvedValue({
    actorId: actor.actorId, action: input.action, targetType: input.targetType, targetId: input.targetId,
    fingerprint, status: 'IN_PROGRESS', receipt: null,
  })
  await expect(reserveMerchantFactoryOperation(input)).rejects.toThrow(MerchantFactoryOperationConflict)
  await expect(reserveMerchantFactoryOperation({
    ...input, expectedRevision: 'changed',
  })).rejects.toThrow(MerchantFactoryOperationConflict)
})
it('rejects foreign/no membership and internal unbounded receipt fields', async () => {
  await expect(reserveMerchantFactoryOperation({
    ...input, actor: { ...actor, membershipId: undefined },
  })).rejects.toThrow()
  await expect(completeMerchantFactoryOperation({
    ...input, receipt: { ...receipt, accessToken: 'must-not-store' },
  })).rejects.toThrow()
  expect(prisma.merchantFactoryOperation.updateMany).not.toHaveBeenCalled()
})
it('completes only the exact claimed operation once, with releaseReady always false', async () => {
  expect(await completeMerchantFactoryOperation({ ...input, receipt })).toEqual(receipt)
  expect(prisma.merchantFactoryOperation.updateMany).toHaveBeenCalledWith({
    where: expect.objectContaining({ merchantId: 'merchant-a', status: 'IN_PROGRESS' }),
    data: { status: 'COMPLETED', receipt },
  })
})

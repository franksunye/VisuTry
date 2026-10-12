import { createHash } from 'node:crypto'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
jest.mock('@/lib/prisma', () => ({
  prisma: { experience: { findMany: jest.fn() } },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  updateMerchantStore: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import type { HumanMerchantActor } from '@/modules/merchant/domain/actor'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { updateMerchantStore } from '@/modules/merchant/application/merchant-onboarding'
import { applyMerchantFactoryDraftStoreV1, prepareMerchantFactoryDraftStoreV1 } from '@/modules/merchant/application/merchant-delivery-factory-apply'

const actor: HumanMerchantActor = {
  actorType: 'HUMAN', actorId: 'owner-a',
  merchantId: 'merchant-a', membershipId: 'member-owner-a',
}
const revision = '2026-10-12T08:30:00.000Z'
const proposal = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'Store Updated', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
const manifestDigest = createHash('sha256').update(JSON.stringify(merchantDeliveryManifestV1Schema.parse(proposal))).digest('hex')
const plan = {
  version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
  merchantId: 'merchant-a', merchantSlug: 'store-a',
  blockers: [], warnings: [], canApply: false, releaseReady: false,
  steps: [
    { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
    { resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['name'] },
  ],
}

describe('Owner-approved Factory Draft Store Apply adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValue(plan)
    ;(prisma.experience.findMany as jest.Mock).mockResolvedValue([{
      id: 'store-id-a', status: 'DRAFT', updatedAt: new Date(revision),
    }])
    ;(updateMerchantStore as jest.Mock).mockResolvedValue({ id: 'store-id-a', status: 'DRAFT' })
  })

  it('prepares a read-only exact revision and digest for explicit Human approval', async () => {
    const prepared = await prepareMerchantFactoryDraftStoreV1({ actor, proposal })
    expect(prepared).toMatchObject({
      status: 'HUMAN_APPROVAL_REQUIRED',
      storeId: 'store-id-a', expectedStoreUpdatedAt: revision,
      manifestDigest, changedFields: ['name'],
      requiresHumanApproval: true,
      releaseReady: false, publicRender: 'NOT_EXECUTED',
    })
    expect(updateMerchantStore).not.toHaveBeenCalled()
  })

  it('rejects changed manifest after Prepare even when Store revision is unchanged', async () => {
    await expect(applyMerchantFactoryDraftStoreV1({
      actor,
      proposal: { ...proposal, store: { ...proposal.store, name: 'A different edit' } },
      expectedStoreUpdatedAt: revision,
      manifestDigest,
    })).rejects.toMatchObject({ code: 'FACTORY_APPLY_CONFLICT' })
    expect(updateMerchantStore).not.toHaveBeenCalled()
  })

  it('uses membership-bound tenant, exact revision and canonical audited Store mutation', async () => {
    const result = await applyMerchantFactoryDraftStoreV1({
      actor, proposal, expectedStoreUpdatedAt: revision, manifestDigest,
    })
    expect(result).toMatchObject({
      status: 'DRAFT_STORE_CONFIGURATION_APPLIED',
      storeId: 'store-id-a', changedFields: ['name'],
      publicRender: 'NOT_EXECUTED', releaseReady: false,
    })
    expect(getMerchantFactoryDryRun).toHaveBeenCalledWith({ actor, proposal })
    expect(prisma.experience.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-a', type: 'STORE' },
      select: { id: true, status: true, updatedAt: true },
      take: 2,
    })
    expect(updateMerchantStore).toHaveBeenCalledWith(expect.objectContaining({
      actor, storeId: 'store-id-a', name: 'Store Updated',
      factoryDraftOnly: true, expectedUpdatedAt: revision,
    }))
    expect(updateMerchantStore).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['stale preview', [{ id: 'store-id-a', status: 'DRAFT', updatedAt: new Date('2026-10-12T09:00:00.000Z') }]],
    ['ACTIVE Store', [{ id: 'store-id-a', status: 'ACTIVE', updatedAt: new Date(revision) }]],
    ['ambiguous Stores', [
      { id: 'store-a', status: 'DRAFT', updatedAt: new Date(revision) },
      { id: 'store-b', status: 'DRAFT', updatedAt: new Date(revision) },
    ]],
    ['missing Store', []],
  ])('rejects %s without any data mutation', async (_case, rows) => {
    ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce(rows)
    await expect(applyMerchantFactoryDraftStoreV1({ actor, proposal, expectedStoreUpdatedAt: revision, manifestDigest }))
      .rejects.toMatchObject({ code: 'FACTORY_APPLY_CONFLICT', httpStatus: 409 })
    expect(updateMerchantStore).not.toHaveBeenCalled()
  })

  it('stops on real plan blockers before looking up a write target', async () => {
    ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValueOnce({
      ...plan, blockers: ['Selected frame is not display-ready'],
    })
    await expect(applyMerchantFactoryDraftStoreV1({ actor, proposal, expectedStoreUpdatedAt: revision, manifestDigest }))
      .rejects.toMatchObject({ code: 'FACTORY_APPLY_CONFLICT' })
    expect(prisma.experience.findMany).not.toHaveBeenCalled()
    expect(updateMerchantStore).not.toHaveBeenCalled()
  })

  it('returns ALREADY_MATCHED without writing only when revision still matches', async () => {
    ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValueOnce({
      ...plan, steps: [plan.steps[0], {
        resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [],
      }],
    })
    const result = await applyMerchantFactoryDraftStoreV1({
      actor, proposal, expectedStoreUpdatedAt: revision, manifestDigest,
    })
    expect(result.status).toBe('ALREADY_MATCHED')
    expect(updateMerchantStore).not.toHaveBeenCalled()
  })

  it('requires membership-bearing Human actor, not an Agent credential', async () => {
    await expect(applyMerchantFactoryDraftStoreV1({
      actor: { actorType: 'HUMAN', actorId: 'owner-a', merchantId: 'merchant-a' },
      proposal, expectedStoreUpdatedAt: revision, manifestDigest,
    })).rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(getMerchantFactoryDryRun).not.toHaveBeenCalled()
  })
})

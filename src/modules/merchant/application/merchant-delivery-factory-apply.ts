import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import { updateMerchantStore } from './merchant-onboarding'
import type { HumanMerchantActor } from '../domain/actor'
import {
  MerchantFactoryApplyError,
  planFactoryDraftStoreApplyV1,
} from '../domain/merchant-delivery-factory-apply-v1'

/**
 * This applies only the existing DRAFT Store copy/closed platform policies,
 * not the proposed Brand, Catalog, Campaign, Store selection or live status.
 * Human Owner authorization is required again by the HTTP boundary.
 */
export async function applyMerchantFactoryDraftStoreV1(input: {
  actor: HumanMerchantActor
  proposal: unknown
  expectedStoreUpdatedAt: string
}) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) {
    throw new MerchantAccessError()
  }
  const plan = await getMerchantFactoryDryRun({
    actor: input.actor,
    proposal: input.proposal,
  })
  const decision = planFactoryDraftStoreApplyV1({ proposal: input.proposal, plan })

  // Fail closed on ambiguous identity. A fallback to "latest" Store or a
  // merchant-supplied Store ID could target the wrong resource.
  const stores = await prisma.experience.findMany({
    where: { merchantId: input.actor.merchantId, type: 'STORE' },
    select: { id: true, status: true, updatedAt: true },
    take: 2,
  })
  if (stores.length !== 1 || stores[0].status !== 'DRAFT') {
    throw new MerchantFactoryApplyError('An unambiguous existing Draft Store is required.')
  }
  const store = stores[0]
  if (store.updatedAt.toISOString() !== input.expectedStoreUpdatedAt) {
    throw new MerchantFactoryApplyError('FACTORY_DRAFT_STORE_STALE_REVISION')
  }
  if (decision.noChange) {
    return {
      version: 1 as const, status: 'ALREADY_MATCHED' as const,
      changedFields: [] as string[], storeId: store.id,
      publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
    }
  }

  // Canonical business write includes activation/audit and public-discovery
  // invalidation. Transactional row lock + optimistic revision check prevent
  // write-after-preview and ACTIVE Store mutations (including interleavings).
  await updateMerchantStore({
    actor: input.actor,
    storeId: store.id,
    ...decision.store,
    factoryDraftOnly: true,
    expectedUpdatedAt: input.expectedStoreUpdatedAt,
  })
  return {
    version: 1 as const, status: 'DRAFT_STORE_CONFIGURATION_APPLIED' as const,
    changedFields: decision.changedFields, storeId: store.id,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { MerchantOnboardingError } from './merchant-onboarding'
import type { HumanMerchantActor } from '../domain/actor'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { getPublicEdgeTagsForMerchant } from '@/modules/store/application/public-edge-paths-server'

/**
 * Human-confirmed non-destructive lifecycle. References to shopper history
 * remain intact. Any Store/Campaign selection (including Draft) must be
 * removed through canonical Experience commands before archiving.
 *
 * Lock Merchant first, like Catalog import, to avoid automatic resurrection
 * racing an Archive. The MerchantFrame row lock serializes selection/changes.
 */
export async function changeMerchantFrameLifecycle(input: {
  actor: HumanMerchantActor
  frameId: string
  action: 'ARCHIVE' | 'RESTORE'
}): Promise<{ id: string; status: 'INACTIVE' | 'ACTIVE' }> {
  if (!input.actor.membershipId) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.actor.merchantId },
    select: { slug: true },
  })
  if (!merchant) throw new MerchantAccessError()

  const nextStatus = input.action === 'ARCHIVE' ? 'INACTIVE' as const : 'ACTIVE' as const
  return withPublicDiscoveryInvalidation({
    target: { kind: 'catalog', merchantSlug: merchant.slug },
    edgeTags: {
      before: await getPublicEdgeTagsForMerchant(merchant.slug),
      after: () => getPublicEdgeTagsForMerchant(merchant.slug),
    },
    mutation: () => prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Merchant" WHERE "id" = ${input.actor.merchantId} FOR UPDATE`
      const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT "id", "status" FROM "MerchantFrame"
        WHERE "id" = ${input.frameId} AND "merchantId" = ${input.actor.merchantId}
        FOR UPDATE
      `
      const current = rows[0]
      if (!current) throw new MerchantAccessError()
      if (current.status === nextStatus) return { id: current.id, status: nextStatus }
      if (input.action === 'RESTORE' && current.status !== 'INACTIVE') {
        throw new MerchantOnboardingError('CATALOG_LIFECYCLE_CONFLICT', 'This product is not archived.', 409)
      }
      if (input.action === 'ARCHIVE') {
        const links = await tx.experienceFrame.count({
          where: { merchantId: input.actor.merchantId, merchantFrameId: input.frameId },
        })
        if (links > 0) {
          throw new MerchantOnboardingError(
            'PRODUCT_IN_USE',
            'Remove this product from all Store and Campaign selections, including Drafts, before archiving. Shopper history will remain available.',
            409,
          )
        }
      }
      // The tenant + row ownership and status were checked under row locks.
      await tx.merchantFrame.update({
        where: { id: input.frameId, merchantId: input.actor.merchantId },
        data: { status: nextStatus },
      })
      await tx.merchantOperationAudit.create({
        data: {
          merchantId: input.actor.merchantId,
          actorType: 'HUMAN',
          actorId: input.actor.actorId,
          action: input.action === 'ARCHIVE' ? 'catalog.archived' : 'catalog.restored',
          resourceType: 'MerchantFrame',
          resourceId: input.frameId,
          result: 'SUCCESS',
        },
      })
      return { id: input.frameId, status: nextStatus }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }),
  })
}

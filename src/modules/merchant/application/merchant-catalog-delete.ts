import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { MerchantOnboardingError } from './merchant-onboarding'
import type { HumanMerchantActor } from '../domain/actor'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { getPublicEdgeTagsForMerchant } from '@/modules/store/application/public-edge-paths-server'

/**
 * A true deletion, exclusively for an unreferenced merchant-owned frame.
 * It never deletes Blob bytes; media disposal is a separate exact-object workflow.
 * The row lock serializes concurrent FK inserts/experience selections against
 * the final delete. DB RESTRICT constraints remain the final authority.
 */
export async function deleteUnusedMerchantFrame(input: {
  actor: HumanMerchantActor
  frameId: string
}): Promise<{ id: string }> {
  if (!input.actor.membershipId) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.actor.merchantId },
    select: { slug: true },
  })
  if (!merchant) throw new MerchantAccessError()

  try {
    return await withPublicDiscoveryInvalidation({
      target: { kind: 'catalog', merchantSlug: merchant.slug },
      edgeTags: {
        before: await getPublicEdgeTagsForMerchant(merchant.slug),
        after: () => getPublicEdgeTagsForMerchant(merchant.slug),
      },
      mutation: () => prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "MerchantFrame"
          WHERE "id" = ${input.frameId} AND "merchantId" = ${input.actor.merchantId}
          FOR UPDATE
        `
        if (locked.length === 0) throw new MerchantAccessError()

        const where = { merchantId: input.actor.merchantId, merchantFrameId: input.frameId }
        const [selections, intents, events, tryOnTasks] = await Promise.all([
          tx.experienceFrame.count({ where }),
          tx.merchantIntent.count({ where }),
          tx.merchantEvent.count({ where }),
          tx.tryOnTask.count({ where }),
        ])
        if (selections + intents + events + tryOnTasks > 0) {
          throw new MerchantOnboardingError(
            'PRODUCT_IN_USE',
            'This product is used by a Store, Campaign or shopper history. Remove it from Experiences first; products with shopper history cannot be permanently deleted.',
            409,
          )
        }

        await tx.merchantFrame.delete({ where: { id: input.frameId, merchantId: input.actor.merchantId } })
        await tx.merchantOperationAudit.create({
          data: {
            merchantId: input.actor.merchantId,
            actorType: 'HUMAN',
            actorId: input.actor.actorId,
            action: 'catalog.deleted',
            resourceType: 'MerchantFrame',
            resourceId: input.frameId,
            result: 'SUCCESS',
          },
        })
        return { id: input.frameId }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }),
    })
  } catch (error) {
    // Restrict FKs also protect insert-after-reference-check races. A future
    // relation must never turn this legitimate business conflict into a 500.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' || error.code === 'P2014') {
        throw new MerchantOnboardingError(
          'PRODUCT_IN_USE',
          'This product has existing Store, Campaign or shopper references and cannot be permanently deleted.',
          409,
        )
      }
      if (error.code === 'P2025') throw new MerchantAccessError()
    }
    throw error
  }
}

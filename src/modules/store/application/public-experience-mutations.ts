import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { withPublicDiscoveryInvalidation } from './public-discovery-invalidation'

type PublicExperienceTarget = {
  id: string
  slug: string
  type: 'STORE' | 'CAMPAIGN'
  merchant: { slug: string }
}

async function findPublicExperience(merchantId: string, experienceId: string): Promise<PublicExperienceTarget> {
  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, merchantId },
    select: { id: true, slug: true, type: true, merchant: { select: { slug: true } } },
  })
  if (!experience) throw new MerchantAccessError()
  return experience as PublicExperienceTarget
}

/**
 * Admin configuration writes for Store/Campaign experiences. The route owns
 * HTTP validation; this service owns the database mutation and its public
 * discovery invalidation.
 */
export async function updatePublicExperience(input: {
  merchantId: string
  experienceId: string
  data: Prisma.ExperienceUpdateInput
}) {
  const current = await findPublicExperience(input.merchantId, input.experienceId)
  const updated = await withPublicDiscoveryInvalidation({
    target: {
      kind: 'experience',
      merchantSlug: current.merchant.slug,
      experienceSlug: current.type === 'STORE' ? null : current.slug,
    },
    mutation: () => prisma.experience.update({ where: { id: current.id }, data: input.data }),
  })
  return updated
}

/**
 * Replaces an experience's selected catalog frames in one transaction. The
 * caller performs request-level frame validation before invoking this method.
 */
export async function replacePublicExperienceFrames(input: {
  merchantId: string
  experienceId: string
  frameIds: string[]
}) {
  const current = await findPublicExperience(input.merchantId, input.experienceId)
  await withPublicDiscoveryInvalidation({
    target: {
      kind: 'experience',
      merchantSlug: current.merchant.slug,
      experienceSlug: current.type === 'STORE' ? null : current.slug,
    },
    mutation: () => prisma.$transaction(async (tx) => {
      await tx.experienceFrame.deleteMany({
        where: { experienceId: current.id, merchantId: input.merchantId },
      })
      if (input.frameIds.length > 0) {
        await tx.experienceFrame.createMany({
          data: input.frameIds.map((merchantFrameId, sortOrder) => ({
            experienceId: current.id,
            merchantId: input.merchantId,
            merchantFrameId,
            sortOrder,
            active: true,
          })),
        })
      }
    }),
  })
  return { frameIds: input.frameIds }
}

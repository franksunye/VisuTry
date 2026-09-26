import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createExperienceCommandService, type ExperienceCommandRepository } from './experience-command-service'

const repository: ExperienceCommandRepository<Prisma.TransactionClient> = {
  async findTarget(merchantId, experienceId) {
    const row = await prisma.experience.findFirst({
      where: { id: experienceId, merchantId },
      select: { id: true, slug: true, type: true, merchant: { select: { slug: true } } },
    })
    if (!row || (row.type !== 'STORE' && row.type !== 'CAMPAIGN')) return null
    // The relation is selected on the canonical query. Keep a fallback for
    // lightweight Prisma adapters/mocks that omit nested relations.
    const merchantSlug = row.merchant?.slug ?? (await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { slug: true },
    }))?.slug
    if (!merchantSlug) return null
    return { id: row.id, slug: row.slug, type: row.type, merchantSlug }
  },
  async update(merchantId, experienceId, patch, options) {
    if (options?.atomicEffects?.length) throw new Error('Prisma Experience commands require transactional callbacks, not SQL effects')
    const data = { ...patch }
    if (data.journeyPolicy === null) data.journeyPolicy = Prisma.JsonNull
    if (data.deliveryPolicy === null) data.deliveryPolicy = Prisma.JsonNull
    if (options?.afterUpdate) {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.experience.update({
          where: { id: experienceId, merchantId },
          data: data as Prisma.ExperienceUpdateInput,
        })
        await options.afterUpdate?.(tx)
        return updated
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
    return prisma.experience.update({
      where: { id: experienceId, merchantId },
      data: data as Prisma.ExperienceUpdateInput,
      include: {
        frames: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            merchantFrame: {
              select: { id: true, sku: true, externalId: true, productUrl: true, name: true, brand: true, imageUrl: true, price: true, currency: true, shape: true, widthClass: true, source: true, enrichmentStatus: true, status: true },
            },
          },
        },
      },
    })
  },
  async replaceCatalogSelection(input) {
    await prisma.$transaction(async (tx) => {
      await tx.experienceFrame.deleteMany({
        where: { experienceId: input.experienceId, merchantId: input.merchantId },
      })
      if (input.frameIds.length) {
        await tx.experienceFrame.createMany({
          data: input.frameIds.map((merchantFrameId, sortOrder) => ({
            experienceId: input.experienceId,
            merchantId: input.merchantId,
            merchantFrameId,
            sortOrder,
            active: true,
          })),
        })
      }
      await input.afterReplace?.(tx)
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  },
}

export const experienceCommands = createExperienceCommandService(repository)

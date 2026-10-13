import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createExperienceCommandService, ExperienceCommandError, type ExperienceCommandRepository } from './experience-command-service'

class CatalogSelectionConflictError extends ExperienceCommandError {
  readonly code = 'CATALOG_SELECTION_NOT_ACTIVE'
  readonly httpStatus = 409

  constructor(message = 'A selected product is archived or unavailable. Restore it in Catalog and retry.') {
    super(message)
  }
}

/**
 * Prisma reports PostgreSQL SQLSTATE 40001 differently by adapter:
 * - P2010 + meta.code=40001 for raw SQL SELECT ... FOR UPDATE
 * - P2010 + meta.driverAdapterError=TransactionWriteConflict for Prisma's
 *   driver-adapter wrapping of PostgreSQL 40001 (observed in local PG16 QA)
 * - P2034 for a SERIALIZABLE transaction commit/write conflict
 * - direct 40001 from a PostgreSQL adapter.
 *
 * Only translate these failures at the *selection transaction* boundary.
 * The aborted transaction has no committed selection/audit/activation effects.
 * Other SQL errors remain visible as real failures, never disguised as 409.
 */
function isCatalogSelectionSerializationConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as {
    code?: unknown
    meta?: { code?: unknown; sqlstate?: unknown; driverAdapterError?: unknown }
    cause?: unknown
  }
  if (candidate.code === 'P2034' || candidate.code === '40001') return true
  if (candidate.code === 'P2010') {
    if (candidate.meta?.code === '40001' || candidate.meta?.sqlstate === '40001') return true
    // Prisma's PostgreSQL driver adapter can wrap SQLSTATE 40001 as P2010
    // with meta.driverAdapterError.kind = 'TransactionWriteConflict', instead
    // of surfacing the SQLSTATE at meta.code. Match only this exact conflict
    // kind, not arbitrary raw-query failures such as 23503 or 23505.
    const adapterError = candidate.meta?.driverAdapterError
    if (adapterError === 'TransactionWriteConflict') return true
    if (adapterError && typeof adapterError === 'object') {
      const detail = adapterError as {
        kind?: unknown
        originalCode?: unknown
        cause?: { kind?: unknown; originalCode?: unknown } | null
      }
      if (detail.kind === 'TransactionWriteConflict'
        || detail.originalCode === '40001'
        || detail.cause?.kind === 'TransactionWriteConflict'
        || detail.cause?.originalCode === '40001') return true
    }
  }
  const cause = candidate.cause
  return Boolean(cause && typeof cause === 'object'
    && (cause as { code?: unknown }).code === '40001')
}

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
    if (options?.afterUpdate || options?.draftOnly || options?.expectedUpdatedAt) {
      return prisma.$transaction(async (tx) => {
        if (options?.draftOnly || options?.expectedUpdatedAt) {
          const draft = await tx.$queryRaw<{ id: string; updatedAt: Date }[]>`SELECT "id", "updatedAt" FROM "Experience" WHERE "id" = ${experienceId} AND "merchantId" = ${merchantId} AND "status" = 'DRAFT' FOR UPDATE`
          if (!draft.length) throw new ExperienceCommandError('Agent changes are limited to Draft Experiences.')
          if (options.expectedUpdatedAt && new Date(draft[0].updatedAt).toISOString() !== options.expectedUpdatedAt) {
            throw new ExperienceCommandError('FACTORY_DRAFT_STORE_STALE_REVISION')
          }
        }
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
      // Same lock order as Catalog Archive/Restore: Merchant, then MerchantFrame.
      // The preflight read in Store/Campaign UI is not a transactional guarantee.
      const merchantRows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Merchant" WHERE "id" = ${input.merchantId} FOR UPDATE`
      if (!merchantRows.length) throw new ExperienceCommandError('Merchant not found')
      if (input.frameIds.length) {
        const frames = await tx.$queryRaw<{ id: string; status: string }[]>`
          SELECT "id", "status" FROM "MerchantFrame"
          WHERE "merchantId" = ${input.merchantId} AND "id" IN (${Prisma.join(input.frameIds)})
          ORDER BY "id" FOR UPDATE
        `
        if (frames.length !== input.frameIds.length || frames.some((frame) => frame.status !== 'ACTIVE')) {
          throw new CatalogSelectionConflictError()
        }
      }
      let lockedRevision: Date | null = null
      if (input.draftOnly || input.expectedUpdatedAt) {
        const draft = await tx.$queryRaw<{ id: string; updatedAt: Date }[]>`SELECT "id", "updatedAt" FROM "Experience" WHERE "id" = ${input.experienceId} AND "merchantId" = ${input.merchantId} AND "status" = 'DRAFT' FOR UPDATE`
        if (!draft.length) throw new ExperienceCommandError('Agent changes are limited to Draft Experiences.')
        lockedRevision = new Date(draft[0].updatedAt)
        if (input.expectedUpdatedAt && lockedRevision.toISOString() !== input.expectedUpdatedAt) {
          throw new ExperienceCommandError('FACTORY_DRAFT_SELECTION_STALE_REVISION')
        }
      }
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
      if (input.expectedUpdatedAt && lockedRevision) {
        // Invalidate the approved selection snapshot in the same transaction.
        await tx.experience.update({
          where: { id: input.experienceId, merchantId: input.merchantId },
          data: { updatedAt: new Date(Math.max(Date.now(), lockedRevision.getTime() + 1)) },
        })
      }
      await input.afterReplace?.(tx)
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: unknown) => {
      if (isCatalogSelectionSerializationConflict(error)) {
        throw new CatalogSelectionConflictError(
          'Catalog selection changed during this request. Reload the current products and retry.',
        )
      }
      throw error
    })
  },
}

export const experienceCommands = createExperienceCommandService(repository)

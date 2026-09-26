import { experienceCommands } from './experience-command-service-prisma'

/**
 * Admin configuration writes for Store/Campaign experiences. The route owns
 * HTTP validation; this service owns the database mutation and its public
 * discovery invalidation.
 */
export async function updatePublicExperience(input: {
  merchantId: string
  experienceId: string
  data: Record<string, unknown>
}) {
  return experienceCommands.updateSharedConfiguration({
    merchantId: input.merchantId,
    experienceId: input.experienceId,
    patch: input.data,
  })
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
  return experienceCommands.replaceCatalogSelection({
    merchantId: input.merchantId,
    experienceId: input.experienceId,
    frameIds: input.frameIds,
  })
}

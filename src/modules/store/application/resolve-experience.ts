import { experienceNotFound } from '../domain'
import type { ExperienceRecord, ExperienceRepository, MerchantRecord } from './ports/repositories'

/** Resolve a merchant-scoped Experience without making Store depend on Campaign-only code. */
export async function resolveMerchantExperience(input: {
  merchant: MerchantRecord
  experiences?: ExperienceRepository
  slug?: string | null
}): Promise<ExperienceRecord | null> {
  if (!input.experiences) return null

  const experience = input.slug
    ? await input.experiences.findActiveByMerchantAndSlug(input.merchant.id, input.slug)
    : await input.experiences.findDefaultStore(input.merchant.id)

  if (experience && experience.merchantId !== input.merchant.id) {
    throw experienceNotFound()
  }

  if (!experience && input.slug) throw experienceNotFound()

  return experience
}

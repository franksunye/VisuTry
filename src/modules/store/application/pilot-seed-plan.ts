import { assertPilotCatalogSourceOwnership, type PilotCatalogRow, type PilotExperienceConfig } from './pilot-delivery-kit'

export type PilotSeedSnapshot = {
  merchant: { id: string } | null
  frames: Array<{ sku: string | null; externalId: string | null; source: string; status: string }>
  experiences: Array<{
    slug: string
    type: 'STORE' | 'CAMPAIGN'
    status: string
    frameCount: number
  }>
}

export type PilotSeedPlan = {
  merchant: { action: 'CREATE' | 'UPDATE'; id: string | null }
  frames: { create: number; update: number; deactivate: number }
  experiences: { create: number; update: number }
  experienceFrames: Array<{
    slug: string
    type: PilotExperienceConfig['type']
    action: 'CREATE' | 'REPLACE'
    selectedFrameCount: number
  }>
  warnings: string[]
  errors: string[]
}

export function buildPilotSeedPlan(input: {
  catalog: PilotCatalogRow[]
  experiences: PilotExperienceConfig[]
  snapshot: PilotSeedSnapshot
}): PilotSeedPlan {
  const { catalog, experiences, snapshot } = input
  const errors: string[] = []
  const warnings: string[] = []
  const incomingSkus = catalog.map((row) => row.sku)
  try {
    assertPilotCatalogSourceOwnership(snapshot.frames, incomingSkus)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  const existingBySku = new Map(snapshot.frames.map((frame) => [frame.sku, frame]))
  const incomingExternalIds = new Set(catalog.map((row) => row.externalId))
  const create = catalog.filter((row) => !existingBySku.has(row.sku)).length
  const update = catalog.length - create
  const deactivate = snapshot.frames.filter(
    (frame) => frame.source === 'CSV' && frame.status === 'ACTIVE' && !incomingExternalIds.has(frame.externalId ?? ''),
  ).length
  if (deactivate > 0) {
    warnings.push(`${deactivate} active CSV frame(s) would be deactivated because they are absent from the incoming catalog`)
  }

  const existingExperiences = new Map(snapshot.experiences.map((experience) => [experience.slug, experience]))
  const experienceFrames = experiences.map((experience) => {
    const selectedFrameCount = experience.catalogSelection === 'ALL_ACTIVE'
      ? catalog.filter((row) => row.status === 'ACTIVE').length
      : experience.catalogSelection.length
    const existing = existingExperiences.get(experience.experienceSlug)
    return {
      slug: experience.experienceSlug,
      type: experience.type,
      action: existing ? 'REPLACE' as const : 'CREATE' as const,
      selectedFrameCount,
    }
  })

  return {
    merchant: { action: snapshot.merchant ? 'UPDATE' : 'CREATE', id: snapshot.merchant?.id ?? null },
    frames: { create, update, deactivate },
    experiences: {
      create: experiences.filter((experience) => !existingExperiences.has(experience.experienceSlug)).length,
      update: experiences.filter((experience) => existingExperiences.has(experience.experienceSlug)).length,
    },
    experienceFrames,
    warnings,
    errors,
  }
}

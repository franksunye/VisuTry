export const EXPERIENCE_TYPES = ['STORE', 'CAMPAIGN'] as const
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number]

export const EXPERIENCE_STATUSES = ['DRAFT', 'ACTIVE', 'ENDED', 'ARCHIVED'] as const
export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number]

export function isExperienceSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function isExperienceAvailable(status: ExperienceStatus): boolean {
  return status === 'ACTIVE'
}

export function experienceContainsFrame(experience: { frameIds: string[] }, frameId: string): boolean {
  return experience.frameIds.includes(frameId)
}

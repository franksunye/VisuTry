import { assertDecisionJourneyPolicy } from '../domain/decision-journey'
import { assertExperienceDeliveryPolicy } from '../domain/delivery-profile'
import { isCampaignGate, isCampaignObjective, isPresentationMode } from '../domain/campaign-policy'
import { isSafeCampaignCtaUrl } from '../domain/campaign-readiness'
import { withPublicDiscoveryInvalidation } from './public-discovery-invalidation'

export type ExperienceCommandTarget = {
  id: string
  slug: string
  type: 'STORE' | 'CAMPAIGN'
  merchantSlug: string
}

export type ExperienceCommandRepository<TTransaction = unknown> = {
  findTarget(merchantId: string, experienceId: string): Promise<ExperienceCommandTarget | null>
  update(merchantId: string, experienceId: string, patch: Record<string, unknown>, options?: {
    afterUpdate?: (transaction: TTransaction) => Promise<void>
    atomicEffects?: unknown[]
  }): Promise<unknown>
  replaceCatalogSelection(input: {
    merchantId: string
    experienceId: string
    frameIds: string[]
    afterReplace?: (transaction: TTransaction) => Promise<void>
    atomicEffects?: unknown[]
  }): Promise<unknown>
}

const SHARED_FIELDS = new Set([
  'name', 'headline', 'description', 'heroAssetUrl', 'status',
  'journeyPolicy', 'deliveryPolicy', 'presentationMode',
  'primaryCtaType', 'primaryCtaLabel', 'primaryCtaUrl',
  'secondaryCtaType', 'secondaryCtaLabel', 'secondaryCtaUrl',
  'offerLabel', 'offerCode',
])
const CAMPAIGN_FIELDS = new Set(['campaignObjective', 'campaignGate', 'startAt', 'endAt'])
const EXPERIENCE_STATUSES = new Set(['DRAFT', 'ACTIVE', 'ENDED', 'ARCHIVED'])
const TEXT_FIELDS = new Set([
  'name', 'headline', 'description', 'heroAssetUrl', 'primaryCtaType',
  'primaryCtaLabel', 'primaryCtaUrl', 'secondaryCtaType',
  'secondaryCtaLabel', 'secondaryCtaUrl', 'offerLabel', 'offerCode',
])
const CTA_URL_FIELDS = new Set(['primaryCtaUrl', 'secondaryCtaUrl'])

export class ExperienceCommandError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExperienceCommandError'
  }
}

function normalizePatch(patch: Record<string, unknown>, allowCampaignFields: boolean): Record<string, unknown> {
  const allowed = allowCampaignFields ? new Set([...SHARED_FIELDS, ...CAMPAIGN_FIELDS]) : SHARED_FIELDS
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) throw new ExperienceCommandError(`Unsupported Experience command field: ${key}`)
  }

  const normalized = { ...patch }
  if ('journeyPolicy' in normalized && normalized.journeyPolicy !== null) {
    assertDecisionJourneyPolicy(normalized.journeyPolicy)
  }
  if ('deliveryPolicy' in normalized && normalized.deliveryPolicy !== null) {
    assertExperienceDeliveryPolicy(normalized.deliveryPolicy)
  }
  if ('presentationMode' in normalized && !isPresentationMode(normalized.presentationMode)) {
    throw new ExperienceCommandError('presentationMode must use a supported value')
  }
  if ('status' in normalized && !EXPERIENCE_STATUSES.has(String(normalized.status))) {
    throw new ExperienceCommandError('status must use a supported Experience lifecycle value')
  }
  for (const field of TEXT_FIELDS) {
    if (!(field in normalized)) continue
    const value = normalized[field]
    if (value !== null && typeof value !== 'string') throw new ExperienceCommandError(`${field} must be a string or null`)
    if (typeof value === 'string') normalized[field] = value.trim()
  }
  for (const field of CTA_URL_FIELDS) {
    const value = normalized[field]
    if (typeof value === 'string' && value && !isSafeCampaignCtaUrl(value)) {
      throw new ExperienceCommandError(`${field} must be an https URL or an internal path`)
    }
  }
  if ('campaignObjective' in normalized && !isCampaignObjective(normalized.campaignObjective)) {
    throw new ExperienceCommandError('campaignObjective must use a supported value')
  }
  if ('campaignGate' in normalized && !isCampaignGate(normalized.campaignGate)) {
    throw new ExperienceCommandError('campaignGate must use a supported value')
  }
  for (const field of ['startAt', 'endAt'] as const) {
    const value = normalized[field]
    if (value !== undefined && value !== null && !(value instanceof Date && !Number.isNaN(value.getTime()))) {
      throw new ExperienceCommandError(`${field} must be a valid Date or null`)
    }
  }
  const startAt = normalized.startAt
  const endAt = normalized.endAt
  if (startAt instanceof Date && endAt instanceof Date && startAt >= endAt) {
    throw new ExperienceCommandError('startAt must be earlier than endAt')
  }
  return normalized
}

/**
 * Canonical mutation boundary for shared Store/Campaign Experience state.
 * Runtime adapters provide persistence only; validation, command shape, and
 * successful-write invalidation are shared here.
 */
export function createExperienceCommandService<TTransaction = unknown>(repository: ExperienceCommandRepository<TTransaction>) {
  async function update(input: {
    merchantId: string
    experienceId: string
    patch: Record<string, unknown>
    campaignFields?: boolean
    expectedType?: 'STORE' | 'CAMPAIGN'
    afterUpdate?: (transaction: TTransaction) => Promise<void>
    atomicEffects?: unknown[]
  }) {
    const patch = normalizePatch(input.patch, input.campaignFields === true)
    if (Object.keys(patch).length === 0) throw new ExperienceCommandError('Experience command has no fields to update')
    const current = await repository.findTarget(input.merchantId, input.experienceId)
    if (!current || (input.expectedType && current.type !== input.expectedType)) {
      throw new ExperienceCommandError('Experience not found')
    }
    if (!input.campaignFields && current.type === 'CAMPAIGN'
      && Object.keys(patch).some((key) => CAMPAIGN_FIELDS.has(key))) {
      throw new ExperienceCommandError('Campaign-only fields require a Campaign command')
    }
    return withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: current.merchantSlug, experienceSlug: current.type === 'STORE' ? null : current.slug },
      mutation: () => repository.update(input.merchantId, current.id, patch, {
        afterUpdate: input.afterUpdate,
        atomicEffects: input.atomicEffects,
      }),
    })
  }

  async function replaceCatalogSelection(input: {
    merchantId: string
    experienceId: string
    frameIds: string[]
    expectedType?: 'STORE' | 'CAMPAIGN'
    afterReplace?: (transaction: TTransaction) => Promise<void>
    atomicEffects?: unknown[]
  }) {
    const frameIds = [...new Set(input.frameIds)]
    const current = await repository.findTarget(input.merchantId, input.experienceId)
    if (!current || (input.expectedType && current.type !== input.expectedType)) {
      throw new ExperienceCommandError('Experience not found')
    }
    const mutationResult = await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: current.merchantSlug, experienceSlug: current.type === 'STORE' ? null : current.slug },
      mutation: () => repository.replaceCatalogSelection({
        merchantId: input.merchantId,
        experienceId: current.id,
        frameIds,
        afterReplace: input.afterReplace,
        atomicEffects: input.atomicEffects,
      }),
    })
    return { frameIds, mutationResult }
  }

  async function runCampaignLifecycleMutation(input: {
    merchantId: string
    experienceId: string
    mutation: () => Promise<unknown>
  }) {
    const current = await repository.findTarget(input.merchantId, input.experienceId)
    if (!current || current.type !== 'CAMPAIGN') throw new ExperienceCommandError('Experience not found')
    return withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: current.merchantSlug, experienceSlug: current.slug },
      mutation: input.mutation,
    })
  }

  return {
    updateSharedConfiguration: (input: Parameters<typeof update>[0]) => update({ ...input, campaignFields: false }),
    updateCampaignConfiguration: (input: Parameters<typeof update>[0]) => update({ ...input, campaignFields: true, expectedType: 'CAMPAIGN' }),
    updateJourneyPolicy: (input: { merchantId: string; experienceId: string; policy: unknown | null }) =>
      update({ merchantId: input.merchantId, experienceId: input.experienceId, patch: { journeyPolicy: input.policy } }),
    updateDeliveryPolicy: (input: { merchantId: string; experienceId: string; policy: unknown | null }) =>
      update({ merchantId: input.merchantId, experienceId: input.experienceId, patch: { deliveryPolicy: input.policy } }),
    updatePresentation: (input: { merchantId: string; experienceId: string; patch: Record<string, unknown> }) =>
      update({ ...input, patch: input.patch }),
    updateHandoff: (input: { merchantId: string; experienceId: string; patch: Record<string, unknown> }) =>
      update({ ...input, patch: input.patch }),
    replaceCatalogSelection,
    runCampaignLifecycleMutation,
  }
}

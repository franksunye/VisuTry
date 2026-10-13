import {
  merchantDeliveryManifestV1Schema, type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

export const FACTORY_CAMPAIGN_COPY_FIELDS = [
  'name', 'headline', 'description', 'presentationMode', 'journeyPolicy', 'deliveryPolicy',
] as const
export type FactoryCampaignField = (typeof FACTORY_CAMPAIGN_COPY_FIELDS)[number]

export class MerchantFactoryCampaignConfigConflict extends Error {
  constructor() {
    super('Campaign configuration requires a new Owner approval for this Draft revision.')
    this.name = 'MerchantFactoryCampaignConfigConflict'
  }
}

export function planFactoryDraftCampaignConfiguration(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
  slug: string
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  const target = manifest.campaigns.find(item => item.slug === input.slug)
  const p = input.plan
  if (!target || !target.selectedFrameIds.length
    || p.version !== 1 || p.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || p.merchantSlug !== manifest.merchantSlug || p.canApply !== false
    || p.releaseReady !== false || p.blockers.length > 0
    || p.steps.some(step => step.action === 'HUMAN_REVIEW_REQUIRED')) {
    throw new MerchantFactoryCampaignConfigConflict()
  }
  const steps = p.steps.filter(step => step.resource === 'CAMPAIGN' && step.target === target.slug)
  if (steps.length !== 1 || !['UPDATE_DRAFT', 'NO_CHANGE'].includes(steps[0].action)) {
    throw new MerchantFactoryCampaignConfigConflict()
  }
  const changes = steps[0].changedFields.filter((field): field is FactoryCampaignField =>
    (FACTORY_CAMPAIGN_COPY_FIELDS as readonly string[]).includes(field),
  )
  if ((steps[0].action === 'NO_CHANGE' && steps[0].changedFields.length !== 0)
    || (steps[0].action === 'UPDATE_DRAFT' && steps[0].changedFields.length === 0)) {
    throw new MerchantFactoryCampaignConfigConflict()
  }
  const patch: Record<string, unknown> = {}
  for (const field of changes) {
    if (target[field] === undefined) throw new MerchantFactoryCampaignConfigConflict()
    patch[field] = target[field]
  }
  return {
    slug: target.slug, noChange: changes.length === 0,
    changedFields: changes, patch,
  }
}

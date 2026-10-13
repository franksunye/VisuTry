import {
  merchantDeliveryManifestV1Schema,
  type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

export class MerchantFactoryCreateCampaignConflict extends Error {
  constructor() {
    super('Factory Campaign creation requires fresh Owner review.')
    this.name = 'MerchantFactoryCreateCampaignConflict'
  }
}

/** Select exactly one absent Campaign; other Manifest resources remain untouched. */
export function planFactoryDraftCampaignCreation(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
  slug: string
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  const target = manifest.campaigns.find(item => item.slug === input.slug)
  const plan = input.plan
  if (!target || target.selectedFrameIds.length === 0
    || plan.version !== 1 || plan.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || plan.merchantSlug !== manifest.merchantSlug
    || plan.canApply !== false || plan.releaseReady !== false
    || plan.blockers.length > 0) {
    throw new MerchantFactoryCreateCampaignConflict()
  }
  const candidates = plan.steps.filter(step => step.resource === 'CAMPAIGN' && step.target === input.slug)
  if (candidates.length !== 1 || candidates[0].action !== 'CREATE_DRAFT'
    || plan.steps.some(step => step.action === 'HUMAN_REVIEW_REQUIRED')) {
    throw new MerchantFactoryCreateCampaignConflict()
  }
  return {
    slug: target.slug,
    name: target.name,
    headline: target.headline ?? null,
    description: target.description ?? null,
    presentationMode: target.presentationMode ?? 'EDITORIAL_FIRST',
    pending: ['selectedFrameIds', 'journeyPolicy', 'deliveryPolicy'] as const,
  }
}

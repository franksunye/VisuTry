import {
  merchantDeliveryManifestV1Schema,
  type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

export class MerchantFactoryCreateStoreConflict extends Error {
  constructor() {
    super('Factory Draft Store creation requires fresh Owner review.')
    this.name = 'MerchantFactoryCreateStoreConflict'
  }
}

/** One explicit DRAFT creation, not a bulk manifest Apply or authorization token. */
export function planFactoryDraftStoreCreation(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  const plan = input.plan
  if (plan.version !== 1 || plan.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || plan.merchantSlug !== manifest.merchantSlug
    || plan.canApply !== false || plan.releaseReady !== false
    || plan.blockers.length > 0 || manifest.store.selectedFrameIds.length === 0) {
    throw new MerchantFactoryCreateStoreConflict()
  }
  const stores = plan.steps.filter(step => step.resource === 'STORE')
  if (stores.length !== 1 || stores[0].action !== 'CREATE_DRAFT'
    || plan.steps.some(step => step.action === 'HUMAN_REVIEW_REQUIRED')) {
    throw new MerchantFactoryCreateStoreConflict()
  }
  return {
    name: manifest.store.name,
    headline: manifest.store.headline ?? null,
    description: manifest.store.description ?? null,
    /** These are NOT part of the Store creation command. */
    pending: ['selectedFrameIds', 'presentationMode', 'journeyPolicy', 'deliveryPolicy'] as const,
  }
}

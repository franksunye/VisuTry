import {
  merchantDeliveryManifestV1Schema,
  type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

export type MerchantFactorySelectionTarget =
  | { type: 'STORE' }
  | { type: 'CAMPAIGN'; slug: string }

export class MerchantFactorySelectionConflict extends Error {
  constructor() {
    super('The approved Draft product selection is no longer safe; prepare a new approval.')
    this.name = 'MerchantFactorySelectionConflict'
  }
}

/** Exactly one product selection step; never treat other manifest changes as approved. */
export function planFactoryDraftSelection(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
  target: MerchantFactorySelectionTarget
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  const { plan, target } = input
  const key = target.type === 'STORE' ? 'default' : target.slug
  const desired = target.type === 'STORE'
    ? manifest.store
    : manifest.campaigns.find(c => c.slug === target.slug)
  if (!desired || plan.version !== 1 || plan.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || plan.merchantSlug !== manifest.merchantSlug || plan.canApply !== false
    || plan.releaseReady !== false || plan.blockers.length > 0) {
    throw new MerchantFactorySelectionConflict()
  }
  const relevant = plan.steps.filter(step => step.resource === target.type && step.target === key)
  if (relevant.length !== 1 || plan.steps.some(step => step.action === 'HUMAN_REVIEW_REQUIRED')) {
    throw new MerchantFactorySelectionConflict()
  }
  const step = relevant[0]
  if (step.action !== 'UPDATE_DRAFT' && step.action !== 'NO_CHANGE') {
    throw new MerchantFactorySelectionConflict()
  }
  if ((step.action === 'NO_CHANGE' && step.changedFields.length !== 0)
    || (step.action === 'UPDATE_DRAFT' && step.changedFields.length === 0)) {
    throw new MerchantFactorySelectionConflict()
  }
  // A full Manifest can contain other pending DRAFT configuration steps.
  // This operation approves selectedFrameIds ONLY. Changes to copy, policies
  // or other DRAFT resources remain pending and cannot be applied here.
  return {
    target, desiredFrameIds: [...desired.selectedFrameIds],
    noChange: !step.changedFields.includes('selectedFrameIds'),
  }
}

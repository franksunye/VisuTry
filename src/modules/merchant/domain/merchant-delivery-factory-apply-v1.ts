import {
  merchantDeliveryManifestV1Schema,
  type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

export const FACTORY_DRAFT_STORE_MUTABLE_FIELDS = [
  'name', 'headline', 'description', 'presentationMode',
  'journeyPolicy', 'deliveryPolicy',
] as const

export class MerchantFactoryApplyError extends Error {
  readonly httpStatus = 409
  readonly code = 'FACTORY_APPLY_CONFLICT'

  constructor(message = 'The approved Draft Store plan is no longer safe. Review a fresh Plan before retrying.') {
    super(message)
    this.name = 'MerchantFactoryApplyError'
  }
}

/**
 * Pure, fail-closed authorization boundary for one existing DRAFT Store.
 * The full multi-resource Factory Apply, frame selection and publishing are
 * deliberately excluded until concurrency and E2E gates close.
 */
export function planFactoryDraftStoreApplyV1(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  const { plan } = input
  if (plan.version !== 1 || plan.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || plan.merchantSlug !== manifest.merchantSlug
    || plan.canApply !== false || plan.releaseReady !== false
    || plan.blockers.length !== 0 || manifest.store.selectedFrameIds.length === 0) {
    throw new MerchantFactoryApplyError()
  }
  const storeSteps = plan.steps.filter(step => step.resource === 'STORE')
  const unrelated = plan.steps.filter(step => step.resource !== 'STORE')
  if (storeSteps.length !== 1 || unrelated.some(step => step.action !== 'NO_CHANGE')) {
    throw new MerchantFactoryApplyError('Other resource changes require separate review and approval.')
  }
  const store = storeSteps[0]
  if (store.action !== 'UPDATE_DRAFT' && store.action !== 'NO_CHANGE') {
    throw new MerchantFactoryApplyError('Only an existing private Draft Store may be updated.')
  }
  if (store.changedFields.some(field =>
    !(FACTORY_DRAFT_STORE_MUTABLE_FIELDS as readonly string[]).includes(field),
  )) {
    throw new MerchantFactoryApplyError('Catalog selection and unsupported fields require separate approval.')
  }
  if (store.action === 'UPDATE_DRAFT' && store.changedFields.length === 0) {
    throw new MerchantFactoryApplyError()
  }
  if (store.action === 'NO_CHANGE' && store.changedFields.length !== 0) {
    throw new MerchantFactoryApplyError()
  }
  return {
    merchantSlug: manifest.merchantSlug,
    noChange: store.action === 'NO_CHANGE',
    changedFields: store.changedFields,
    store: {
      name: manifest.store.name,
      headline: manifest.store.headline,
      description: manifest.store.description,
      presentationMode: manifest.store.presentationMode,
      journeyPolicy: manifest.store.journeyPolicy,
      deliveryPolicy: manifest.store.deliveryPolicy,
    },
  }
}

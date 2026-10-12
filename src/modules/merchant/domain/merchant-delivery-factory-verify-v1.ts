import {
  merchantDeliveryManifestV1Schema,
  type MerchantFactoryDryRunV1,
} from './merchant-delivery-factory-v1'

/**
 * Compares a canonical Factory manifest with a fresh, authenticated database
 * Plan. This is a private configuration verification only: it cannot assert
 * that shopper HTML, images, Kiosk, Auth0, or billing work in the real world.
 * Never turns a Plan's canApply=false into write authorization.
 */
export function verifyMerchantFactoryConfigurationV1(input: {
  proposal: unknown
  plan: MerchantFactoryDryRunV1
}) {
  const manifest = merchantDeliveryManifestV1Schema.parse(input.proposal)
  if (manifest.merchantSlug !== input.plan.merchantSlug
    || input.plan.classification !== 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
    || input.plan.version !== 1
    || input.plan.canApply !== false
    || input.plan.releaseReady !== false) {
    throw new Error('FACTORY_VERIFICATION_UNTRUSTED_PLAN')
  }

  const pending = input.plan.steps.filter(step => step.action !== 'NO_CHANGE')
  const blockers = [...input.plan.blockers]
  if (manifest.store.selectedFrameIds.length === 0) {
    blockers.push('Store needs at least one eligible selected Catalog product before handoff')
  }
  const configurationMatched = blockers.length === 0 && pending.length === 0

  return {
    version: 1 as const,
    classification: 'READ_ONLY_PRIVATE_CONFIGURATION_VERIFICATION' as const,
    merchantSlug: manifest.merchantSlug,
    status: configurationMatched ? 'CONFIGURATION_MATCHED' as const : 'ACTION_REQUIRED' as const,
    configurationMatched,
    pendingSteps: pending,
    blockers: [...new Set(blockers)],
    warnings: input.plan.warnings,
    verification: {
      authenticatedDatabaseConfig: configurationMatched ? 'MATCHED' as const : 'NOT_MATCHED' as const,
      publicShopperRender: 'NOT_EXECUTED' as const,
      heroImageDecode: 'NOT_EXECUTED' as const,
      resultAndKioskJourney: 'NOT_EXECUTED' as const,
      ownerAuthCallback: 'NOT_EXECUTED' as const,
      billingLive: 'NOT_EXECUTED' as const,
    },
    nextAction: configurationMatched
      ? 'Verify the actual guest Store, Result/Kiosk, image loading, privacy and applicable billing before handoff.'
      : 'Review the blocking configuration differences and apply them separately using authorized Merchant workspace actions.',
    canApply: false as const,
    releaseReady: false as const,
  }
}

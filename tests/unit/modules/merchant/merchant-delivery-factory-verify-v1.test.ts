import { verifyMerchantFactoryConfigurationV1 } from '@/modules/merchant/domain/merchant-delivery-factory-verify-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

const manifest = {
  version: 1,
  merchantSlug: 'store-a',
  classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'Store A', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
const plan = (): MerchantFactoryDryRunV1 => ({
  version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
  merchantSlug: 'store-a', merchantId: 'merchant-a',
  steps: [
    { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
    { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
  ],
  blockers: [], warnings: [], canApply: false, releaseReady: false,
})

describe('Factory Verify v1 private read-only contract', () => {
  it('recognizes a fully matching persisted configuration but never upgrades public evidence or Apply permission', () => {
    const verified = verifyMerchantFactoryConfigurationV1({ proposal: manifest, plan: plan() })
    expect(verified).toMatchObject({
      status: 'CONFIGURATION_MATCHED', configurationMatched: true,
      verification: {
        authenticatedDatabaseConfig: 'MATCHED',
        publicShopperRender: 'NOT_EXECUTED',
        heroImageDecode: 'NOT_EXECUTED',
        resultAndKioskJourney: 'NOT_EXECUTED',
        billingLive: 'NOT_EXECUTED',
      },
      canApply: false, releaseReady: false,
    })
    expect(verified.pendingSteps).toEqual([])
    expect(verified.blockers).toEqual([])
  })

  it('returns ACTION_REQUIRED for a Draft Store configuration difference', () => {
    const current = plan()
    current.steps[1] = {
      resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT',
      changedFields: ['name'],
    }
    const verified = verifyMerchantFactoryConfigurationV1({ proposal: manifest, plan: current })
    expect(verified).toMatchObject({
      status: 'ACTION_REQUIRED', configurationMatched: false,
      pendingSteps: [{ resource: 'STORE', action: 'UPDATE_DRAFT' }],
      verification: { authenticatedDatabaseConfig: 'NOT_MATCHED' },
      releaseReady: false,
    })
  })

  it('never treats a Human-review Brand step or an ACTIVE Store blocker as verified', () => {
    const current = plan()
    current.steps[0] = {
      resource: 'BRAND', target: 'store-a', action: 'HUMAN_REVIEW_REQUIRED',
      changedFields: ['logoAssetUrl'],
    }
    current.blockers = ['Brand and media configuration require authenticated Human UI review']
    const verified = verifyMerchantFactoryConfigurationV1({ proposal: manifest, plan: current })
    expect(verified.configurationMatched).toBe(false)
    expect(verified.blockers).toContain('Brand and media configuration require authenticated Human UI review')
    expect(verified.releaseReady).toBe(false)
  })

  it('requires a selected eligible product before a successful handoff comparison', () => {
    const empty = { ...manifest, catalog: { ...manifest.catalog, expectedFrameIds: [] },
      store: { ...manifest.store, selectedFrameIds: [] } }
    const verified = verifyMerchantFactoryConfigurationV1({ proposal: empty, plan: plan() })
    expect(verified.status).toBe('ACTION_REQUIRED')
    expect(verified.blockers).toContain('Store needs at least one eligible selected Catalog product before handoff')
  })

  it('preserves benign surplus Catalog warnings without implying actual Store render verified', () => {
    const current = plan()
    current.warnings = ['Existing Catalog has additional active resources']
    const verified = verifyMerchantFactoryConfigurationV1({ proposal: manifest, plan: current })
    expect(verified.status).toBe('CONFIGURATION_MATCHED')
    expect(verified.warnings).toEqual(current.warnings)
    expect(verified.verification.publicShopperRender).toBe('NOT_EXECUTED')
  })

  it('rejects a mismatched tenant/plan or a forged canApply=true plan', () => {
    const foreign = { ...plan(), merchantSlug: 'other' }
    expect(() => verifyMerchantFactoryConfigurationV1({ proposal: manifest, plan: foreign }))
      .toThrow('FACTORY_VERIFICATION_UNTRUSTED_PLAN')
    const malicious = { ...plan(), canApply: true }
    expect(() => verifyMerchantFactoryConfigurationV1({
      proposal: manifest,
      plan: malicious as unknown as MerchantFactoryDryRunV1,
    })).toThrow('FACTORY_VERIFICATION_UNTRUSTED_PLAN')
  })

  it('rejects injected approval field instead of allowing a write-capable variant', () => {
    expect(() => verifyMerchantFactoryConfigurationV1({
      proposal: { ...manifest, approved: true },
      plan: plan(),
    })).toThrow()
  })
})

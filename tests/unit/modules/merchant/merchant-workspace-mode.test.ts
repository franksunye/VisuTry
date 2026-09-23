import { resolveMerchantWorkspaceMode } from '@/modules/merchant/domain/merchant-workspace-mode'

describe('Merchant workspace operating-mode compatibility', () => {
  it('resolves a Store preview milestone to Operating', () => {
    expect(resolveMerchantWorkspaceMode({
      hasStorePreviewedEvent: true,
      hasStorePublishedEvent: false,
      storeStatus: 'DRAFT',
    })).toEqual({ mode: 'OPERATING', reason: 'STORE_PREVIEWED' })
  })

  it('resolves a Store publish milestone to Operating without a preview milestone', () => {
    expect(resolveMerchantWorkspaceMode({
      hasStorePreviewedEvent: false,
      hasStorePublishedEvent: true,
      storeStatus: null,
    })).toEqual({ mode: 'OPERATING', reason: 'STORE_PUBLISHED' })
  })

  it('resolves an ACTIVE Store to Operating when historical activation events are absent', () => {
    expect(resolveMerchantWorkspaceMode({
      hasStorePreviewedEvent: false,
      hasStorePublishedEvent: false,
      storeStatus: 'ACTIVE',
    })).toEqual({ mode: 'OPERATING', reason: 'ACTIVE_STORE' })
  })

  it.each([
    ['DRAFT Store', 'DRAFT'],
    ['no Store', null],
  ])('keeps %s in Activation when no qualifying event exists', (_label, storeStatus) => {
    expect(resolveMerchantWorkspaceMode({
      hasStorePreviewedEvent: false,
      hasStorePublishedEvent: false,
      storeStatus,
    })).toEqual({ mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' })
  })

  it('uses deterministic evidence precedence without changing the evidence itself', () => {
    expect(resolveMerchantWorkspaceMode({
      hasStorePreviewedEvent: true,
      hasStorePublishedEvent: true,
      storeStatus: 'ACTIVE',
    })).toEqual({ mode: 'OPERATING', reason: 'STORE_PREVIEWED' })
  })
})

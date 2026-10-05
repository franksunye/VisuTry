import { merchantCampaignHref, merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'

describe('merchant workspace routes', () => {
  it('keeps the selected merchant on every workspace route', () => {
    expect(merchantWorkspaceHref({ locale: 'en', section: 'catalog', merchantId: 'merchant-a' })).toBe('/en/merchant/catalog?merchantId=merchant-a')
    expect(merchantWorkspaceHref({ locale: 'zh', section: 'plan', merchantId: 'merchant/a' })).toBe('/zh/merchant/plan?merchantId=merchant%2Fa')
  })

  it('maps every operating destination to a dedicated route', () => {
    const merchantId = 'merchant-a'
    expect(merchantWorkspaceHref({ locale: 'en', section: 'home', merchantId })).toContain('/en/merchant?')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'store', merchantId })).toContain('/en/merchant/store?')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'campaigns', merchantId })).toContain('/en/merchant/campaigns?')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'analytics', merchantId })).toContain('/en/merchant/analytics?')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'integrations', merchantId })).toContain('/en/merchant/integrations?')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'settings', merchantId })).toContain('/en/merchant/settings?')
  })

  it('adds a concrete frameId only to Catalog and preserves the merchant context', () => {
    expect(merchantWorkspaceHref({ locale: 'en', section: 'catalog', merchantId: 'merchant/a', frameId: 'frame/1' }))
      .toBe('/en/merchant/catalog?merchantId=merchant%2Fa&frameId=frame%2F1')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'catalog', merchantId: 'merchant-a' }))
      .toBe('/en/merchant/catalog?merchantId=merchant-a')
    expect(merchantWorkspaceHref({ locale: 'en', section: 'analytics', merchantId: 'merchant-a' }))
      .not.toContain('frameId')
  })

  it('builds the existing exact Campaign detail route', () => {
    expect(merchantCampaignHref({ locale: 'en', merchantId: 'merchant/a', campaignId: 'campaign/1' }))
      .toBe('/en/merchant/campaigns/campaign%2F1?merchantId=merchant%2Fa')
  })

  it('does not allow frameId for non-Catalog routes at compile time', () => {
    // @ts-expect-error A frame focus is meaningful only on the Catalog route.
    merchantWorkspaceHref({ locale: 'en', section: 'plan', merchantId: 'merchant-a', frameId: 'frame-a' })
  })
})

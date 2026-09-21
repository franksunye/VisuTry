import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'

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
})

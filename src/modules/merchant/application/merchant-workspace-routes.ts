export type MerchantWorkspaceSection =
  | 'home'
  | 'catalog'
  | 'store'
  | 'campaigns'
  | 'analytics'
  | 'integrations'
  | 'plan'
  | 'settings'

type MerchantWorkspaceHrefBase = { locale: string; merchantId: string }

export function merchantWorkspaceHref(input: MerchantWorkspaceHrefBase & { section: 'catalog'; frameId?: string }): string
export function merchantWorkspaceHref(input: MerchantWorkspaceHrefBase & { section: Exclude<MerchantWorkspaceSection, 'catalog'> }): string
export function merchantWorkspaceHref(input: MerchantWorkspaceHrefBase & { section: MerchantWorkspaceSection; frameId?: undefined }): string
export function merchantWorkspaceHref(input: MerchantWorkspaceHrefBase & { section: MerchantWorkspaceSection; frameId?: string }): string {
  const query = new URLSearchParams({ merchantId: input.merchantId })
  if (input.section === 'catalog' && input.frameId) query.set('frameId', input.frameId)
  return `/${input.locale}${sectionPaths[input.section]}?${query.toString()}`
}

const sectionPaths: Record<MerchantWorkspaceSection, string> = {
  home: '/merchant',
  catalog: '/merchant/catalog',
  store: '/merchant/store',
  campaigns: '/merchant/campaigns',
  analytics: '/merchant/analytics',
  integrations: '/merchant/integrations',
  plan: '/merchant/plan',
  settings: '/merchant/settings',
}

export function merchantCampaignHref(input: { locale: string; merchantId: string; campaignId: string }) {
  const query = new URLSearchParams({ merchantId: input.merchantId })
  return `/${input.locale}/merchant/campaigns/${encodeURIComponent(input.campaignId)}?${query.toString()}`
}

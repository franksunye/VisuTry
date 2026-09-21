export type MerchantWorkspaceSection =
  | 'home'
  | 'catalog'
  | 'store'
  | 'campaigns'
  | 'analytics'
  | 'integrations'
  | 'plan'
  | 'settings'

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

export function merchantWorkspaceHref(input: {
  locale: string
  section: MerchantWorkspaceSection
  merchantId: string
}) {
  const query = new URLSearchParams({ merchantId: input.merchantId })
  return `/${input.locale}${sectionPaths[input.section]}?${query.toString()}`
}


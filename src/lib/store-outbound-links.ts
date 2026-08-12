export type StoreOutboundLinkType = 'product' | 'merchant'

export type StoreOutboundLinkContext = {
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string | null
  linkType: StoreOutboundLinkType
}

/**
 * Build the canonical tracking contract for links from a public Store/Campaign
 * to a merchant-owned destination. Keep this in one place so new outbound
 * links cannot accidentally skip attribution fields.
 */
export function buildStoreOutboundUrl(
  rawUrl: string,
  context: StoreOutboundLinkContext,
): string {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return rawUrl

  const surface = context.experienceType === 'CAMPAIGN' ? 'campaign' : 'store'
  const campaign = context.experienceType === 'CAMPAIGN' && context.experienceSlug
    ? `campaign-${context.experienceSlug}`
    : 'store-discovery'

  url.searchParams.set('source', 'visutry')
  url.searchParams.set('medium', 'referral')
  url.searchParams.set('surface', surface)
  url.searchParams.set('campaign', campaign)
  url.searchParams.set('utm_source', 'visutry.com')
  url.searchParams.set('utm_medium', 'referral')
  url.searchParams.set('utm_campaign', campaign)
  url.searchParams.set('utm_content', context.linkType)

  return url.toString()
}

export type MerchantHomeSection = 'catalog' | 'store' | 'campaigns' | 'analytics' | 'plan'

export type MerchantOperatingHomeReadModel = {
  merchant: {
    id: string
    slug: string
    name: string
  }
  store: {
    exists: boolean
    status: string | null
    selectedProductCount: number
    eligibleProductCount: number
    readiness: 'READY' | 'NEEDS_ATTENTION' | 'INCOMPLETE' | null
  }
  catalog: {
    total: number
    ready: number
    issueCount: number
  }
  campaigns: {
    total: number
    active: number
    draft: number
    archived: number
    needsAttention: number
  }
  shopper: {
    hasActivity: boolean
    periodLabel: string
    metrics: Array<{ label: string; value: number }>
  }
  commercial: {
    status: string
    planName: string
    attention: boolean
  }
}

export type MerchantHomePresentation = {
  recommendedAction: {
    label: string
    section: MerchantHomeSection
    reason: string
  }
  attention: Array<{
    title: string
    body: string
    section: MerchantHomeSection
    label: string
  }>
  outcome: {
    kind: 'ACTIVITY' | 'EMPTY'
    periodLabel: string
    metrics: Array<{ label: string; value: number }>
  }
  currentWork: {
    store: { status: string; detail: string; section: 'store'; label: string }
    catalog: { status: string; detail: string; section: 'catalog'; label: string }
    campaigns: { status: string; detail: string; section: 'campaigns'; label: string }
  }
}

function humanStatus(value: string | null): string {
  if (!value) return 'Not created'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function productLabel(count: number): string {
  return `${count} product${count === 1 ? '' : 's'}`
}

/**
 * Small, deterministic Home interpretation layer. It only presents facts
 * supplied by the Home read model; it does not perform business validation.
 */
export function resolveMerchantHomePresentation(
  read: MerchantOperatingHomeReadModel,
): MerchantHomePresentation {
  const attention: MerchantHomePresentation['attention'] = []

  if (read.catalog.issueCount > 0) {
    attention.push({
      title: 'Catalog needs review',
      body: `${read.catalog.issueCount} product${read.catalog.issueCount === 1 ? '' : 's'} need attention before they can be used confidently.`,
      section: 'catalog',
      label: 'Review Catalog',
    })
  }

  if (read.store.readiness === 'NEEDS_ATTENTION') {
    attention.push({
      title: 'Store needs review',
      body: 'Some Store content is not ready for a reliable shopper experience.',
      section: 'store',
      label: 'Review Store',
    })
  }

  if (read.campaigns.needsAttention > 0) {
    attention.push({
      title: 'Campaigns need review',
      body: `${read.campaigns.needsAttention} non-archived Campaign${read.campaigns.needsAttention === 1 ? '' : 's'} need attention.`,
      section: 'campaigns',
      label: 'Review Campaigns',
    })
  }

  if (read.commercial.attention) {
    attention.push({
      title: 'Plan & Usage needs attention',
      body: 'Review your current commercial status and available capacity.',
      section: 'plan',
      label: 'Review Plan & Usage',
    })
  }

  let recommendedAction: MerchantHomePresentation['recommendedAction']
  if (read.catalog.issueCount > 0) {
    recommendedAction = { label: 'Review Catalog', section: 'catalog', reason: 'Resolve product readiness issues.' }
  } else if (!read.store.exists || read.store.readiness === 'NEEDS_ATTENTION' || read.store.status === 'DRAFT') {
    recommendedAction = { label: 'Review Store', section: 'store', reason: 'Keep your Store ready for shoppers.' }
  } else if (read.campaigns.needsAttention > 0) {
    recommendedAction = { label: 'Review Campaigns', section: 'campaigns', reason: 'Resolve Campaign work that needs attention.' }
  } else if (read.store.status === 'ACTIVE' && read.shopper.hasActivity) {
    recommendedAction = { label: 'Review Analytics', section: 'analytics', reason: 'See how shoppers are using your Store.' }
  } else {
    recommendedAction = { label: 'Open Store', section: 'store', reason: 'Review your current Store experience.' }
  }

  const campaignBody = read.campaigns.total === 0
    ? 'No campaigns yet'
    : `${read.campaigns.active} active${read.campaigns.draft ? ` · ${read.campaigns.draft} draft` : ''}${read.campaigns.archived ? ` · ${read.campaigns.archived} archived` : ''}`

  return {
    recommendedAction,
    attention,
    outcome: {
      kind: read.shopper.hasActivity ? 'ACTIVITY' : 'EMPTY',
      periodLabel: read.shopper.periodLabel,
      metrics: read.shopper.metrics,
    },
    currentWork: {
      store: {
        status: humanStatus(read.store.status),
        detail: read.store.exists
          ? `${productLabel(read.store.selectedProductCount)} selected`
          : 'Create a Store when your catalog is ready.',
        section: 'store',
        label: 'Open Store',
      },
      catalog: {
        status: `${read.catalog.total} ${read.catalog.total === 1 ? 'product' : 'products'}`,
        detail: `${read.catalog.ready} ready${read.catalog.issueCount ? ` · ${read.catalog.issueCount} need review` : ''}`,
        section: 'catalog',
        label: 'Manage Catalog',
      },
      campaigns: {
        status: String(read.campaigns.total),
        detail: campaignBody,
        section: 'campaigns',
        label: 'View Campaigns',
      },
    },
  }
}

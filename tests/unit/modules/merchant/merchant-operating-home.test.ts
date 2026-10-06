import { projectMerchantCommercialForHome, resolveMerchantHomePresentation, type MerchantHomeSection, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'
import { selectPrimaryMerchantCatalogIssueFrameId } from '@/modules/merchant/domain/merchant-catalog-presentation'
import type { MerchantCommercialState } from '@/modules/store/domain/merchant-commercial-state'

function read(overrides: Partial<MerchantOperatingHomeReadModel> = {}): MerchantOperatingHomeReadModel {
  return {
    merchant: { id: 'm', slug: 'm', name: 'M', referenceData: false },
    store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
    catalog: { total: 1, ready: 1, issueCount: 0, primaryIssueFrameId: null },
    campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
    shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [], decisionTrend: [] },
    commercial: { status: 'FREE', planName: 'Free', threshold: null, primaryAction: 'UNLOCK_AI_TRY_ON', attention: false },
    ...overrides,
  }
}

describe('resolveMerchantHomePresentation', () => {
  type MatrixScenario = {
    name: string
    commercial: [MerchantCommercialState['status'], MerchantCommercialState['threshold'], MerchantCommercialState['primaryAction'], boolean]
    catalogIssues?: number
    storeStatus?: string
    storeReadiness?: 'READY' | 'NEEDS_ATTENTION' | 'INCOMPLETE'
    campaignIssues?: number
    activity?: boolean
    expected: [MerchantHomeSection, string, string]
    retained: MerchantHomeSection[]
  }

  const commercialMatrix: MatrixScenario[] = [
    { name: '1 PAYMENT_ACTION_REQUIRED + Catalog issue', commercial: ['PAYMENT_ACTION_REQUIRED', null, 'RESOLVE_PAYMENT', true], catalogIssues: 1, expected: ['plan', 'Review payment status', 'Action is needed to restore paid features.'], retained: ['catalog', 'plan'] },
    { name: '2 PAST_DUE + Store needs attention', commercial: ['PAST_DUE', null, 'RESOLVE_PAYMENT', true], storeReadiness: 'NEEDS_ATTENTION', expected: ['plan', 'Review payment status', 'Action is needed to restore paid features.'], retained: ['store', 'plan'] },
    { name: '3 USAGE_EXHAUSTED + Campaign issue', commercial: ['USAGE_EXHAUSTED', 'LIMIT_REACHED', 'RESTORE_AI_CAPACITY', true], campaignIssues: 1, expected: ['plan', 'Restore AI capacity', 'AI Try-On is paused. Your Store remains live.'], retained: ['campaigns', 'plan'] },
    { name: '4 EXPIRED + Catalog issue', commercial: ['EXPIRED', null, 'MANAGE_PLAN', true], catalogIssues: 1, expected: ['plan', 'Manage plan', 'This commercial period has ended. Your Store and catalog remain available.'], retained: ['catalog', 'plan'] },
    { name: '5 PILOT_EXPIRED + healthy active Store', commercial: ['PILOT_EXPIRED', null, 'CONTINUE_AFTER_PILOT', true], storeStatus: 'ACTIVE', expected: ['plan', 'Continue after Pilot', 'Your Founding Pilot has ended. Your Store and catalog remain available.'], retained: ['plan'] },
    { name: '6 USAGE_WARNING/WARNING + Catalog issue', commercial: ['USAGE_WARNING', 'WARNING', 'UPGRADE_CAPACITY', true], catalogIssues: 1, expected: ['catalog', 'Review Catalog', 'Resolve product readiness issues.'], retained: ['catalog', 'plan'] },
    { name: '7 USAGE_WARNING/WARNING + Store issue', commercial: ['USAGE_WARNING', 'WARNING', 'UPGRADE_CAPACITY', true], storeReadiness: 'NEEDS_ATTENTION', expected: ['store', 'Review Store', 'Keep your Store ready for shoppers.'], retained: ['store', 'plan'] },
    { name: '8 USAGE_WARNING/WARNING + healthy activity', commercial: ['USAGE_WARNING', 'WARNING', 'UPGRADE_CAPACITY', true], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: ['plan'] },
    { name: '9 USAGE_WARNING/WARNING + healthy no activity', commercial: ['USAGE_WARNING', 'WARNING', 'UPGRADE_CAPACITY', true], storeStatus: 'ACTIVE', expected: ['store', 'Open Store', 'Review your current Store experience.'], retained: ['plan'] },
    { name: '10 normal commercial + Catalog issue', commercial: ['PAID_ACTIVE', 'NORMAL', 'MANAGE_PLAN', false], catalogIssues: 1, expected: ['catalog', 'Review Catalog', 'Resolve product readiness issues.'], retained: ['catalog'] },
    { name: '11 normal + Store issue', commercial: ['PAID_ACTIVE', 'NORMAL', 'MANAGE_PLAN', false], storeReadiness: 'NEEDS_ATTENTION', expected: ['store', 'Review Store', 'Keep your Store ready for shoppers.'], retained: ['store'] },
    { name: '12 normal + Campaign issue', commercial: ['PAID_ACTIVE', 'NORMAL', 'MANAGE_PLAN', false], storeStatus: 'ACTIVE', campaignIssues: 1, expected: ['campaigns', 'Review Campaigns', 'Resolve Campaign work that needs attention.'], retained: ['campaigns'] },
    { name: '13 normal + active Store + activity', commercial: ['PAID_ACTIVE', 'NORMAL', 'MANAGE_PLAN', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
    { name: '14 normal + healthy Store + no activity', commercial: ['PAID_ACTIVE', 'NORMAL', 'MANAGE_PLAN', false], storeStatus: 'ACTIVE', expected: ['store', 'Open Store', 'Review your current Store experience.'], retained: [] },
    { name: '15 FREE compatibility state', commercial: ['FREE', null, 'UNLOCK_AI_TRY_ON', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
    { name: '16 active Founding Pilot compatibility state', commercial: ['PILOT_ACTIVE', 'NORMAL', 'CONTINUE_AFTER_PILOT', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
    { name: '17 DEMO_ACTIVE compatibility state', commercial: ['DEMO_ACTIVE', null, 'NONE', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
    { name: '18 LEGACY_UNMIGRATED compatibility state', commercial: ['LEGACY_UNMIGRATED', null, 'ENROLL_PLAN', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
    { name: '19 CANCEL_AT_PERIOD_END compatibility state', commercial: ['CANCEL_AT_PERIOD_END', null, 'MANAGE_PLAN', false], storeStatus: 'ACTIVE', activity: true, expected: ['analytics', 'Review Analytics', 'See how shoppers are using your Store.'], retained: [] },
  ]

  it.each(commercialMatrix)('$name', (scenario) => {
    const [status, threshold, primaryAction, attention] = scenario.commercial
    const result = resolveMerchantHomePresentation(read({
      store: { exists: true, status: scenario.storeStatus ?? 'ACTIVE', selectedProductCount: 1, eligibleProductCount: 1, readiness: scenario.storeReadiness ?? 'READY' },
      catalog: { total: scenario.catalogIssues ? 2 : 1, ready: scenario.catalogIssues ? 1 : 1, issueCount: scenario.catalogIssues ?? 0, primaryIssueFrameId: scenario.catalogIssues ? 'issue-frame' : null },
      campaigns: { total: scenario.campaignIssues ?? 0, active: 0, draft: scenario.campaignIssues ?? 0, archived: 0, needsAttention: scenario.campaignIssues ?? 0 },
      shopper: { hasActivity: scenario.activity ?? false, periodLabel: 'Last 30 days', metrics: [], decisionTrend: [] },
      commercial: { status, planName: 'Growth', threshold, primaryAction, attention },
    }))

    expect(result.recommendedAction).toEqual({ section: scenario.expected[0], label: scenario.expected[1], reason: scenario.expected[2] })
    expect(result.attention.map((item) => item.section)).toEqual(expect.arrayContaining(scenario.retained))
    if (scenario.expected[0] === 'plan') {
      expect(result.attention.find((item) => item.section === 'plan')).toMatchObject({
        title: 'Plan & Usage needs attention',
        body: 'Review your current commercial status and available capacity.',
        label: null,
      })
    }
    if (status === 'USAGE_WARNING') {
      expect(result.attention.find((item) => item.section === 'plan')).toMatchObject({ label: 'Review Plan & Usage' })
    }
  })

  it('uses Store for a healthy draft and does not invent attention', () => {
    const result = resolveMerchantHomePresentation(read())
    expect(result.recommendedAction).toMatchObject({ section: 'store', label: 'Review Store' })
    expect(result.attention).toHaveLength(0)
    expect(result.outcome.kind).toBe('EMPTY')
  })

  it('prioritizes Catalog issues over Store and Campaign work', () => {
    const result = resolveMerchantHomePresentation(read({ catalog: { total: 2, ready: 1, issueCount: 1, primaryIssueFrameId: 'frame-1' }, campaigns: { total: 1, active: 0, draft: 1, archived: 0, needsAttention: 1 } }))
    expect(result.recommendedAction.section).toBe('catalog')
    expect(result.attention.map((item) => item.section)).toContain('catalog')
  })

  it('surfaces commercial attention only for an actionable commercial state', () => {
    const result = resolveMerchantHomePresentation(read({ commercial: { status: 'USAGE_EXHAUSTED', planName: 'Growth', threshold: 'LIMIT_REACHED', primaryAction: 'RESTORE_AI_CAPACITY', attention: true } }))
    expect(result.attention).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'plan' })]))
  })

  it('does not promote a 70% NOTICE into Home Attention', () => {
    const result = resolveMerchantHomePresentation(read({ commercial: { status: 'USAGE_WARNING', planName: 'Growth', threshold: 'NOTICE', primaryAction: 'UPGRADE_CAPACITY', attention: false } }))
    expect(result.attention.some((item) => item.section === 'plan')).toBe(false)
  })

  it('surfaces missing and incomplete Stores as actionable Store Attention', () => {
    const missing = resolveMerchantHomePresentation(read({ store: { exists: false, status: null, selectedProductCount: 0, eligibleProductCount: 0, readiness: null } }))
    expect(missing.attention).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'store', title: 'Store needs setup' })]))

    const incomplete = resolveMerchantHomePresentation(read({ store: { exists: true, status: 'DRAFT', selectedProductCount: 0, eligibleProductCount: 0, readiness: 'INCOMPLETE' } }))
    expect(incomplete.attention).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'store', title: 'Store needs review' })]))
  })

  it('prefers Analytics only for an active Store with real activity', () => {
    const result = resolveMerchantHomePresentation(read({
      store: { exists: true, status: 'ACTIVE', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
      shopper: { hasActivity: true, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 4 }], decisionTrend: [] },
    }))
    expect(result.recommendedAction).toMatchObject({ section: 'analytics', label: 'Review Analytics' })
    expect(result.outcome.kind).toBe('ACTIVITY')
  })
})

describe('projectMerchantCommercialForHome', () => {
  it('projects one canonical Prisma/Cloudflare commercial shape including primaryAction', () => {
    expect(projectMerchantCommercialForHome({
      status: 'PAST_DUE',
      planName: 'Growth',
      threshold: null,
      primaryAction: 'RESOLVE_PAYMENT',
    })).toEqual({ status: 'PAST_DUE', planName: 'Growth', threshold: null, primaryAction: 'RESOLVE_PAYMENT', attention: true })

    expect(projectMerchantCommercialForHome({
      status: 'USAGE_WARNING',
      planName: 'Growth',
      threshold: 'WARNING',
      primaryAction: 'UPGRADE_CAPACITY',
    })).toEqual({ status: 'USAGE_WARNING', planName: 'Growth', threshold: 'WARNING', primaryAction: 'UPGRADE_CAPACITY', attention: true })
  })
})

describe('selectPrimaryMerchantCatalogIssueFrameId', () => {
  it('prefers actionable attention over weaker enrichment and breaks ties by stable id', () => {
    const review = { id: 'a-review', sku: 'S-1', name: 'Review', imageUrl: '/review.png', shape: '', status: 'ACTIVE', source: 'MANUAL', enrichmentStatus: 'PENDING' }
    const attentionZ = { id: 'z-attention', sku: null, name: 'Attention Z', imageUrl: null, shape: '', status: 'ACTIVE', source: 'MANUAL' }
    const attentionA = { ...attentionZ, id: 'a-attention', name: 'Attention A' }
    const ready = { id: '0-ready', sku: 'S-2', name: 'Ready', imageUrl: '/ready.png', shape: 'round', status: 'ACTIVE', source: 'MANUAL' }

    expect(selectPrimaryMerchantCatalogIssueFrameId([review, attentionZ, ready, attentionA])).toBe('a-attention')
  })

  it('returns null when no product needs attention', () => {
    expect(selectPrimaryMerchantCatalogIssueFrameId([
      { id: 'ready', sku: 'S-1', name: 'Ready', imageUrl: '/ready.png', shape: 'round', status: 'ACTIVE', source: 'MANUAL' },
    ])).toBeNull()
  })
})

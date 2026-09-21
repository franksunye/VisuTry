import { resolveMerchantHomePresentation, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'

function read(overrides: Partial<MerchantOperatingHomeReadModel> = {}): MerchantOperatingHomeReadModel {
  return {
    merchant: { id: 'm', slug: 'm', name: 'M' },
    store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
    catalog: { total: 1, ready: 1, issueCount: 0 },
    campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
    shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [] },
    commercial: { status: 'FREE', planName: 'Free', threshold: null, attention: false },
    ...overrides,
  }
}

describe('resolveMerchantHomePresentation', () => {
  it('uses Store for a healthy draft and does not invent attention', () => {
    const result = resolveMerchantHomePresentation(read())
    expect(result.recommendedAction).toMatchObject({ section: 'store', label: 'Review Store' })
    expect(result.attention).toHaveLength(0)
    expect(result.outcome.kind).toBe('EMPTY')
  })

  it('prioritizes Catalog issues over Store and Campaign work', () => {
    const result = resolveMerchantHomePresentation(read({ catalog: { total: 2, ready: 1, issueCount: 1 }, campaigns: { total: 1, active: 0, draft: 1, archived: 0, needsAttention: 1 } }))
    expect(result.recommendedAction.section).toBe('catalog')
    expect(result.attention.map((item) => item.section)).toContain('catalog')
  })

  it('surfaces commercial attention only for an actionable commercial state', () => {
    const result = resolveMerchantHomePresentation(read({ commercial: { status: 'USAGE_EXHAUSTED', planName: 'Growth', threshold: 'LIMIT_REACHED', attention: true } }))
    expect(result.attention).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'plan' })]))
  })

  it('does not promote a 70% NOTICE into Home Attention', () => {
    const result = resolveMerchantHomePresentation(read({ commercial: { status: 'USAGE_WARNING', planName: 'Growth', threshold: 'NOTICE', attention: false } }))
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
      shopper: { hasActivity: true, periodLabel: 'Last 30 days', metrics: [{ label: 'Visitors', value: 4 }] },
    }))
    expect(result.recommendedAction).toMatchObject({ section: 'analytics', label: 'Review Analytics' })
    expect(result.outcome.kind).toBe('ACTIVITY')
  })
})

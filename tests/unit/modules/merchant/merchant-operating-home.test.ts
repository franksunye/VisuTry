import { resolveMerchantHomePresentation, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'

function read(overrides: Partial<MerchantOperatingHomeReadModel> = {}): MerchantOperatingHomeReadModel {
  return {
    merchant: { id: 'm', slug: 'm', name: 'M' },
    store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
    catalog: { total: 1, ready: 1, issueCount: 0 },
    campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
    shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [] },
    commercial: { status: 'FREE', planName: 'Free', attention: false },
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
    const result = resolveMerchantHomePresentation(read({ commercial: { status: 'USAGE_EXHAUSTED', planName: 'Growth', attention: true } }))
    expect(result.attention).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'plan' })]))
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

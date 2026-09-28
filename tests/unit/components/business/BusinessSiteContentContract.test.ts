import { businessPages } from '@/config/business-site'

const coreKeys = ['overview', 'platform', 'store', 'campaigns', 'intelligence'] as const

describe('Business public content contract', () => {
  it('uses one canonical discovery-to-action narrative across core Merchant pages', () => {
    expect(businessPages.overview.title).toBe('Be discovered. Help shoppers decide. Turn intent into action.')
    expect(businessPages.overview.sections[0]?.eyebrow).toBe('Discovery → Decision → Merchant Action')

    for (const key of coreKeys) {
      const page = businessPages[key]
      const publicCopy = JSON.stringify(page)
      expect(publicCopy).toMatch(/discovery/i)
      expect(publicCopy).toMatch(/decision/i)
      expect(publicCopy).toMatch(/action/i)
    }
  })

  it('uses market-facing Merchant Actions instead of internal Handoff terminology', () => {
    const publicCopy = JSON.stringify(businessPages)
    expect(publicCopy).not.toMatch(/handoff/i)
    expect(publicCopy).toMatch(/Merchant Actions/)
  })

  it('keeps the canonical product vocabulary visible across the core story', () => {
    const publicCopy = JSON.stringify(coreKeys.map((key) => businessPages[key]))

    expect(publicCopy).toMatch(/Recommendation/)
    expect(publicCopy).toMatch(/Virtual Try-On/)
    expect(publicCopy).toMatch(/Frame Compare/)
    expect(publicCopy).toMatch(/Decision Result/)
    expect(publicCopy).toMatch(/Commerce Intelligence/)
  })

  it('standardizes the public Pilot CTA while preserving the request CTA on the Pilot page', () => {
    for (const [key, page] of Object.entries(businessPages)) {
      if (key === 'pilot') {
        expect(page.primaryCta.label).toBe('Request Pilot Review')
      } else {
        expect(page.primaryCta.label).toBe('Start 30-Day Pilot')
      }
    }
  })

  it('keeps Commerce Intelligence inside its evidence boundary', () => {
    expect(businessPages.intelligence.description).toMatch(/without treating intent as guaranteed revenue/i)
    expect(businessPages.intelligence.sections.find((section) => section.eyebrow === 'Evidence boundary')?.note)
      .toBe('No guaranteed conversion uplift, revenue lift, or incremental GMV claims.')
  })
})

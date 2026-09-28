import { businessPages } from '@/config/business-site'

const coreKeys = ['overview', 'platform', 'store', 'campaigns', 'intelligence'] as const

describe('Business public content contract', () => {
  it('anchors one canonical Merchant journey on Business Home', () => {
    expect(businessPages.overview.title).toBe('Be discovered. Help shoppers decide. Turn intent into action.')
    expect(businessPages.overview.sections[0]?.eyebrow).toBe('Discovery → Decision → Merchant Action')
  })

  it('gives each core page a distinct information job', () => {
    expect(businessPages.platform.title).toMatch(/system behind every VisuTry decision experience/i)
    expect(businessPages.platform.sections.some((section) => section.eyebrow === 'Platform architecture')).toBe(true)

    expect(businessPages.store.title).toMatch(/always-on decision experience/i)
    expect(businessPages.store.sections.some((section) => section.eyebrow === 'When to use Store')).toBe(true)

    expect(businessPages.campaigns.title).toMatch(/Focused decision experiences for campaign traffic/i)
    expect(businessPages.campaigns.sections.some((section) => section.eyebrow === 'When to use Campaigns')).toBe(true)

    expect(businessPages.intelligence.title).toMatch(/gains — or loses — momentum/i)
    expect(businessPages.intelligence.sections.some((section) => section.eyebrow === 'Questions it answers')).toBe(true)
  })

  it('keeps commercial detail out of Business Home and campaign-channel detail out of Platform', () => {
    const homeCopy = JSON.stringify(businessPages.overview)
    const platformCopy = JSON.stringify(businessPages.platform)

    expect(homeCopy).not.toMatch(/\$149|1,500|3,500/)
    expect(homeCopy).not.toMatch(/Founding Merchant Pilot/)
    expect(platformCopy).not.toMatch(/paid & social|creator|email|QR/i)
  })

  it('does not reuse section headlines across the five core pages', () => {
    const titles = coreKeys.flatMap((key) => businessPages[key].sections.map((section) => section.title))
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('keeps page-specific scope instead of restating every capability everywhere', () => {
    const storeCopy = JSON.stringify(businessPages.store)
    const campaignCopy = JSON.stringify(businessPages.campaigns)
    const intelligenceCopy = JSON.stringify(businessPages.intelligence)

    expect(storeCopy).toMatch(/open-ended/i)
    expect(storeCopy).not.toMatch(/paid & social/i)

    expect(campaignCopy).toMatch(/arrival context/i)
    expect(campaignCopy).not.toMatch(/Kiosk/i)

    expect(intelligenceCopy).toMatch(/operating questions/i)
    expect(intelligenceCopy).not.toMatch(/Kiosk/i)
  })

  it('uses market-facing Merchant Actions instead of internal Handoff terminology', () => {
    const publicCopy = JSON.stringify(businessPages)
    expect(publicCopy).not.toMatch(/handoff/i)
    expect(publicCopy).toMatch(/Merchant Actions/)
  })

  it('keeps canonical product vocabulary available without forcing it into every page', () => {
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

  it('presents the Founding Pilot as one configurable offer from $149', () => {
    expect(businessPages.pricing.metaDescription).toMatch(/Founding Pilot from \$149 \/ 30 days/i)
    expect(businessPages.pilot.metaDescription).toMatch(/from \$149 \/ 30 days/i)
    expect(businessPages.pilot.description).toMatch(/Final scope and pilot fee are confirmed based on your deployment configuration/i)

    const pilotScope = businessPages.pilot.sections.find((section) => section.eyebrow === 'Pilot scope')
    expect(pilotScope?.title).toBe('From $149 / 30 days.')
    expect(pilotScope?.body).toMatch(/8–50 real frames/i)
    expect(pilotScope?.body).toMatch(/may vary in scope and pricing/i)
    expect(pilotScope?.body).not.toMatch(/1,500|3,500/)
  })

  it('keeps Commerce Intelligence inside its evidence boundary', () => {
    expect(businessPages.intelligence.description).toMatch(/evidence layer/i)
    expect(businessPages.intelligence.sections.find((section) => section.eyebrow === 'Evidence boundary')?.note)
      .toBe('No guaranteed conversion uplift, revenue lift, or incremental GMV claims.')
  })
})

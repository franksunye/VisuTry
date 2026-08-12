import { CONTEXTUAL_HANDOFFS } from '@/config/distribution-handoffs'
import { buildMerchantExperienceHref } from '@/modules/store/application/build-merchant-experience-href'

describe('contextual distribution contracts', () => {
  it.each(['face-analysis', 'compare', 'style-explorer'] as const)('uses the %s surface', (surface) => {
    const handoff = CONTEXTUAL_HANDOFFS[surface]
    const href = buildMerchantExperienceHref({
      path: `/en/c/${handoff.merchantSlug}/${handoff.experienceSlug}`,
      surface: handoff.surface,
      campaign: handoff.campaign,
    })
    const url = new URL(href, 'https://visutry.local')

    expect(url.searchParams.get('source')).toBe('visutry')
    expect(url.searchParams.get('medium')).toBe('internal')
    expect(url.searchParams.get('surface')).toBe(surface)
    expect(url.searchParams.get('campaign')).toBe(handoff.campaign)
  })
})
